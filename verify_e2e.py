# verify_e2e.py
import os
import sys
import uuid
import time
import json
from datetime import datetime
from pathlib import Path

# Verify virtual environment dependencies
try:
    import fastapi
    import sqlalchemy
    import pdfplumber
    import openpyxl
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    print("[ERROR] Please execute this script using the virtual environment python: .\\venv\\Scripts\\python.exe verify_e2e.py")
    sys.exit(1)

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# 1. Setup Monkeypatching before importing routes/orchestrator
import backend.ocr_engine
import agents.ray_manager

# Mock OCR Engine text extraction to read text directly from the PDF stream using pdfplumber
def mock_extract_text(self, page_obj) -> str:
    text = page_obj.extract_text()
    return text if text else ""

backend.ocr_engine.OCREngine.extract_text = mock_extract_text

# Mock 5-Agent parallel execution to return simulated agent results based on page text
def mock_classify_page(text: str) -> list:
    doc_type = "invoice"
    text_lower = text.lower()
    
    if "statement" in text_lower:
        doc_type = "bank_statement"
    elif "aadhaar" in text_lower:
        doc_type = "aadhaar"
    elif "pan" in text_lower:
        doc_type = "pan_card"
    elif "passport" in text_lower:
        doc_type = "passport"
    elif "insurance" in text_lower:
        doc_type = "insurance_document"

    # If 'low-confidence' keyword is present, simulate a split vote to trigger < 75% confidence rules
    if "low-confidence" in text_lower or "flag" in text_lower:
        return [
            {"document_type": doc_type, "confidence": 0.60, "reasoning": "Agent 1: Matches layout features", "agent_name": "Agent 1"},
            {"document_type": doc_type, "confidence": 0.65, "reasoning": "Agent 2: Key phrases found", "agent_name": "Agent 2"},
            {"document_type": "passport", "confidence": 0.50, "reasoning": "Agent 3: Layout mismatch", "agent_name": "Agent 3"},
            {"document_type": doc_type, "confidence": 0.62, "reasoning": "Agent 4: Matches template profile", "agent_name": "Agent 4"},
            {"document_type": "bank_statement", "confidence": 0.55, "reasoning": "Agent 5: Pattern lookup matching", "agent_name": "Agent 5"},
        ]

    # High confidence response (all agents agree on the category)
    return [
        {"document_type": doc_type, "confidence": 0.92, "reasoning": "Agent 1 consensus agreement", "agent_name": "Agent 1"},
        {"document_type": doc_type, "confidence": 0.94, "reasoning": "Agent 2 consensus agreement", "agent_name": "Agent 2"},
        {"document_type": doc_type, "confidence": 0.90, "reasoning": "Agent 3 consensus agreement", "agent_name": "Agent 3"},
        {"document_type": doc_type, "confidence": 0.95, "reasoning": "Agent 4 consensus agreement", "agent_name": "Agent 4"},
        {"document_type": doc_type, "confidence": 0.93, "reasoning": "Agent 5 consensus agreement", "agent_name": "Agent 5"},
    ]

agents.ray_manager.classify_page = mock_classify_page

# 2. Import API App and DB components
from backend.main import app
from backend.auth import get_db
from database.models import User, UserRole, Document, DocumentPage, OverrideAudit, AuditLog

client = TestClient(app)

# Helper function to generate a valid multi-page PDF dynamically
def create_test_pdf(filename: str, page_texts: list[str]) -> None:
    parts_list = []
    offsets = {}
    parts_list.append(b"%PDF-1.4\n")
    current_offset = 9
    def append_obj(obj_id: int, content: bytes):
        nonlocal current_offset
        offsets[obj_id] = current_offset
        obj_bytes = f"{obj_id} 0 obj\n".encode() + content + b"\nendobj\n"
        parts_list.append(obj_bytes)
        current_offset += len(obj_bytes)
    
    append_obj(1, b"<< /Type /Catalog /Pages 2 0 R >>")
    kids_str = " ".join([f"{3 + idx * 3} 0 R" for idx in range(len(page_texts))])
    append_obj(2, f"<< /Type /Pages /Kids [{kids_str}] /Count {len(page_texts)} >>".encode())
    
    offset = 3
    for idx, text in enumerate(page_texts):
        page_id = offset + idx * 3
        font_id = page_id + 1
        stream_id = page_id + 2
        append_obj(page_id, f"<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 {font_id} 0 R >> >> /MediaBox [0 0 595 842] /Contents {stream_id} 0 R >>".encode())
        append_obj(font_id, b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        stream_text = f"BT\n/F1 12 Tf\n72 712 Td\n({text}) Tj\nET\n".encode()
        stream_content = f"<< /Length {len(stream_text)} >>\nstream\n".encode() + stream_text + b"\nendstream"
        append_obj(stream_id, stream_content)
        
    xref_offset = current_offset
    total_objects = 2 + len(page_texts) * 3
    xref_parts = []
    xref_parts.append(f"xref\n0 {total_objects + 1}\n0000000000 65535 f \n".encode())
    for obj_id in range(1, total_objects + 1):
        offset_str = f"{offsets[obj_id]:010d}"
        xref_parts.append(f"{offset_str} 00000 n \n".encode())
    xref_bytes = b"".join(xref_parts)
    parts_list.append(xref_bytes)
    
    trailer_bytes = f"trailer\n<< /Size {total_objects + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode()
    parts_list.append(trailer_bytes)
    
    with open(filename, 'wb') as f:
        f.write(b"".join(parts_list))

def run_e2e_validation():
    print("=" * 60)
    print("CONSENSUSDOC AI - END-TO-END PIPELINE VALIDATION")
    print("=" * 60)
    
    db: Session = next(get_db())
    unique_suffix = uuid.uuid4().hex[:6]
    
    # Define test accounts
    emp_username = f"e2e_employee_{unique_suffix}"
    emp_email = f"{emp_username}@company.com"
    emp_password = "SecurePassword123!"
    
    admin_username = f"e2e_admin_{unique_suffix}"
    admin_email = f"{admin_username}@company.com"
    admin_password = "AdminSecurePassword123!"

    # ----------------------------------------------------
    # VALIDATION 1: User Registration
    # ----------------------------------------------------
    print("\n[VALIDATION 1] Registering Employee & Admin accounts...")
    reg_emp_res = client.post("/api/users/register", json={
        "username": emp_username,
        "email": emp_email,
        "password": emp_password,
        "role": "Employee"
    })
    assert reg_emp_res.status_code == 201, f"Employee registration failed: {reg_emp_res.text}"
    print(f"-> Employee registered successfully: {emp_username}")

    reg_admin_res = client.post("/api/users/register", json={
        "username": admin_username,
        "email": admin_email,
        "password": admin_password,
        "role": "Admin"
    })
    assert reg_admin_res.status_code == 201, f"Admin registration failed: {reg_admin_res.text}"
    print(f"-> Admin registered successfully: {admin_username}")

    # ----------------------------------------------------
    # VALIDATION 2 & 3 & 16: Login, JWT & Login Audit Logs
    # ----------------------------------------------------
    print("\n[VALIDATION 2 & 3] Authenticating credentials & validating JWT payload...")
    login_emp_res = client.post("/api/users/login", data={
        "username": emp_username,
        "password": emp_password
    })
    assert login_emp_res.status_code == 200, f"Employee login failed: {login_emp_res.text}"
    emp_token = login_emp_res.json()["access_token"]
    print("-> Employee logged in successfully. JWT token obtained.")

    # Validate email-based login (crucial for frontend compatibility)
    login_emp_email_res = client.post("/api/users/login", data={
        "username": emp_email,
        "password": emp_password
    })
    assert login_emp_email_res.status_code == 200, f"Employee login via email failed: {login_emp_email_res.text}"
    print("-> Employee logged in successfully using email address.")

    login_admin_res = client.post("/api/users/login", data={
        "username": admin_username,
        "password": admin_password
    })
    assert login_admin_res.status_code == 200, f"Admin login failed: {login_admin_res.text}"
    admin_token = login_admin_res.json()["access_token"]
    print("-> Admin logged in successfully. JWT token obtained.")

    # Verify JWT Authenticated Profile route /api/users/me
    profile_res = client.get("/api/users/me", headers={"Authorization": f"Bearer {emp_token}"})
    assert profile_res.status_code == 200, "JWT profile fetch failed"
    assert profile_res.json()["username"] == emp_username, "JWT profile username mismatch"
    print("-> JWT validation verified via GET /api/users/me.")

    # Verify Login Audit Log entry was created
    login_logs = db.query(AuditLog).filter(AuditLog.action == "USER_LOGIN").all()
    assert len(login_logs) >= 2, "Login action was not logged in audit_logs"
    print("-> Login Audit Logs successfully verified.")

    # ----------------------------------------------------
    # VALIDATION 4 & 5 & 6 & 16: PDF Ingestion & splitting & OCR
    # ----------------------------------------------------
    print("\n[VALIDATION 4 & 5 & 6] Ingesting multi-page PDF document...")
    # Page 1: normal text. Page 2: triggers low-confidence split vote.
    pdf_filename = f"test_e2e_{unique_suffix}.pdf"
    create_test_pdf(pdf_filename, [
        "This is commercial invoice statement with pricing total $500",
        "demographic card aadhaar low-confidence flag page layout scanned"
    ])
    
    with open(pdf_filename, "rb") as f:
        upload_res = client.post(
            "/api/upload",
            files={"file": (pdf_filename, f, "application/pdf")},
            headers={"Authorization": f"Bearer {emp_token}"}
        )
    
    # Cleanup local temp PDF
    if os.path.exists(pdf_filename):
        os.remove(pdf_filename)

    assert upload_res.status_code == 201, f"PDF upload failed: {upload_res.text}"
    doc_id = upload_res.json()["document_id"]
    print(f"-> Document {doc_id} ingested. Ingestion split, OCR text extraction completed.")

    # Verify Upload logs in DB
    upload_log = db.query(AuditLog).filter(
        AuditLog.action == "DOCUMENT_UPLOAD",
        AuditLog.document_id == doc_id
    ).first()
    assert upload_log is not None, "Document upload audit log not found"
    print("-> Ingestion Audit Log verified.")

    # ----------------------------------------------------
    # VALIDATION 7 & 8 & 9 & 10 & 11: Parallel Ray Agents, Consensus, Confidence, Review Queue
    # ----------------------------------------------------
    print("\n[VALIDATION 7 & 8 & 9 & 10 & 11] Running Consensus Engine & Low-Confidence routing...")
    doc_details_res = client.get(f"/api/documents/{doc_id}", headers={"Authorization": f"Bearer {emp_token}"})
    assert doc_details_res.status_code == 200
    report = doc_details_res.json()
    
    # 5 Agents & Voting Engine check
    assert len(report["pages"]) == 2, "Page count mismatch"
    page1 = report["pages"][0]
    page2 = report["pages"][1]
    
    print(f"-> Page 1 Winner: '{page1['document_type']}' with Confidence: {page1['confidence'] * 100}%")
    print(f"-> Page 2 Winner: '{page2['document_type']}' with Confidence: {page2['confidence'] * 100}%")

    assert page1["confidence"] >= 0.75, "Page 1 should have high confidence"
    assert page2["confidence"] < 0.75, "Page 2 should trigger low confidence threshold"
    assert page2["status"] == "Pending Review", "Page 2 should enter review status"
    print("-> Majority Voting & Confidence calculations verified.")

    # Check Review Queue endpoint
    queue_res = client.get("/api/review-queue", headers={"Authorization": f"Bearer {emp_token}"})
    assert queue_res.status_code == 200
    queue_items = queue_res.json()
    
    matching_queue_item = next((item for item in queue_items if item["document_id"] == doc_id and item["page_number"] == 2), None)
    assert matching_queue_item is not None, "Low confidence page did not enter Review Queue"
    print("-> Human Review Queue entries successfully verified.")

    # ----------------------------------------------------
    # VALIDATION 12 & 13 & 14 & 15 & 16: Category Override & Report regeneration
    # ----------------------------------------------------
    print("\n[VALIDATION 12 & 13 & 14 & 15 & 16] Executing manual category override...")
    override_category = "passport"
    override_res = client.post(
        "/api/review-queue/override",
        params={
            "document_id": doc_id,
            "page_number": 2,
            "selected_category": override_category
        },
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert override_res.status_code == 200, f"Override action failed: {override_res.text}"
    print(f"-> Override successful. Category updated to '{override_category}'.")

    # Verify page status transitioned to overridden in results
    refetched_doc = client.get(f"/api/documents/{doc_id}", headers={"Authorization": f"Bearer {emp_token}"}).json()
    refetched_page2 = refetched_doc["pages"][1]
    assert refetched_page2["document_type"] == override_category, "Category was not overridden"
    assert refetched_page2["status"] == "overridden", "Page status was not updated to overridden"
    assert refetched_page2["confidence"] == 1.0, "Confidence was not reset to 100%"
    print("-> Classification update verified.")

    # Verify JSON and Excel regeneration files exist in storage directories
    json_report_path = Path("storage/json") / f"{doc_id}.json"
    excel_report_path = Path("storage/excel") / f"{doc_id}.xlsx"
    assert json_report_path.exists(), "JSON report not regenerated"
    assert excel_report_path.exists(), "Excel report not regenerated"
    print("-> JSON and Excel reports regeneration verified.")

    # Verify Override Audit Log in DB
    override_log = db.query(AuditLog).filter(
        AuditLog.action == "MANUAL_OVERRIDE",
        AuditLog.document_id == doc_id,
        AuditLog.page_number == 2
    ).first()
    assert override_log is not None, "Manual override audit log not found"
    assert override_log.new_value == override_category, "Override logged value mismatch"
    print("-> Manual Override Audit Log verified.")

    # ----------------------------------------------------
    # VALIDATION 17: Admin override query
    # ----------------------------------------------------
    print("\n[VALIDATION 17] Querying Override History from Admin view...")
    history_res = client.get("/api/admin/override-history", headers={"Authorization": f"Bearer {admin_token}"})
    assert history_res.status_code == 200
    override_records = history_res.json()
    
    matching_record = next((r for r in override_records if r["document_id"] == doc_id and r["page_number"] == 2), None)
    assert matching_record is not None, "Admin override history log mismatch"
    print(f"-> Override History matches: Operator '{matching_record['employee']}' overrode doc '{matching_record['document_id']}' page 2 category to '{matching_record['new_category']}'.")

    # ----------------------------------------------------
    # VALIDATION 18: Dashboard Status
    # ----------------------------------------------------
    print("\n[VALIDATION 18] Querying Dashboard Status...")
    dash_docs = client.get("/api/documents", headers={"Authorization": f"Bearer {emp_token}"}).json()
    matching_doc = next((d for d in dash_docs if d["id"] == doc_id), None)
    assert matching_doc is not None, "Uploaded document missing from dashboard"
    assert matching_doc["status"] == "Human Validated", f"Expected 'Human Validated' status, got '{matching_doc['status']}'"
    print("-> Dashboard status updated to 'Human Validated'.")

    print("\n" + "=" * 60)
    print("CONSENSUSDOC AI - PIPELINE VALIDATION COMPLETION SUCCESS")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_validation()
