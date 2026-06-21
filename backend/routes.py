import os
import uuid
import json
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, File, UploadFile, HTTPException, status, Depends
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from backend.orchestrator import run_pipeline, execute_override, ConsensusFailureError
from backend.human_review_queue import load_queue
from backend.auth import get_db, get_current_user, RoleChecker
from database.models import User, UserRole, Document, DocumentPage, OverrideAudit, AuditLog
from backend.audit_logger import log_document_upload, log_manual_override, log_classification_completion
from pydantic import BaseModel

router = APIRouter()

PIPELINE_STAGES = [
    "PDF Splitter",
    "OCR Engine",
    "Text Preprocessing",
    "5 Parallel Google ADK Agents",
    "Ray Parallel Execution Layer",
    "Voting Engine",
    "Confidence Engine",
    "Reason Aggregator",
    "Confidence Threshold Checker (75%)",
    "Human Review Queue",
    "Override Engine",
    "Boundary Detector",
    "Segment Builder",
    "JSON Generator",
    "Excel Generator"
]

class MyOverrideRequest(BaseModel):
    document_id: str
    page_number: int
    selected_category: str

def get_upload_dir() -> Path:
    """Dynamically resolves the uploads directory based on config settings."""
    possible_paths = [
        Path("config/config.yaml"),
        Path("project2/config/config.yaml"),
        Path("../config/config.yaml")
    ]
    config_path = None
    for p in possible_paths:
        if p.exists():
            config_path = p
            break
            
    uploads_dir = Path("storage/uploads")
    if config_path:
        try:
            with open(config_path, "r") as f:
                config = yaml.safe_load(f)
                if config and "storage" in config and "uploads_dir" in config["storage"]:
                    config_uploads = config["storage"]["uploads_dir"]
                    uploads_dir = config_path.parent.parent / config_uploads
        except Exception:
            pass
            
    uploads_dir.mkdir(parents=True, exist_ok=True)
    return uploads_dir

@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Returns the API health status and the exact processing pipeline stages."""
    return {
        "status": "healthy",
        "pipeline_stages": PIPELINE_STAGES
    }

@router.post("/api/upload", status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accepts exactly one PDF file, validates it, saves it, and runs the classification pipeline."""
    import time
    start_time = time.time()
    
    filename = file.filename or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files are allowed."
        )
        
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Only PDF files are allowed."
        )

    uploads_dir = get_upload_dir()
    unique_filename = f"{uuid.uuid4().hex}.pdf"
    destination_path = uploads_dir / unique_filename

    try:
        with open(destination_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
    except Exception as e:
        if destination_path.exists():
            os.remove(destination_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while saving the file: {str(e)}"
        )
    finally:
        await file.close()

    # Execute classification pipeline on the uploaded document
    doc_id = unique_filename.replace(".pdf", "")
    
    # Audit document upload
    log_document_upload(
        db=db,
        user_id=str(current_user.id),
        username=current_user.username,
        document_id=doc_id,
        filename=filename
    )

    try:
        pipeline_result = run_pipeline(
            pdf_path=str(destination_path),
            document_id=doc_id,
            filename=filename
        )
        
        # Save upload details to database
        pages = pipeline_result.get("report_data", {}).get("pages", [])
        has_flagged = pipeline_result.get("report_data", {}).get("has_flagged_pages", False)
        status_val = "pending_review" if has_flagged else "processed"
        
        db_doc = Document(
            document_id=doc_id,
            filename=filename,
            uploaded_by=current_user.id,
            upload_timestamp=datetime.utcnow(),
            total_pages=len(pages),
            status=status_val
        )
        db.add(db_doc)
        
        for p in pages:
            raw_status = p.get("status", "Processed").lower().replace(" ", "_")
            if raw_status not in ["processed", "pending_review", "overridden"]:
                raw_status = "processed"
                
            db_page = DocumentPage(
                document_id=doc_id,
                page_number=p.get("page_number"),
                predicted_category=p.get("document_type"),
                confidence_score=p.get("confidence"),
                status=raw_status
            )
            db.add(db_page)
            
        db.commit()
        
        # Audit classification completion
        elapsed = time.time() - start_time
        log_classification_completion(
            db=db,
            document_id=doc_id,
            final_status=status_val,
            processing_time=elapsed
        )
        
    except ConsensusFailureError as e:
        if destination_path.exists():
            os.remove(destination_path)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "status": "failed",
                "successful_agents": e.successful_agents,
                "failed_agents": e.failed_agents,
                "message": f"Pipeline execution failed: {str(e)}"
            }
        )
    except Exception as e:
        if destination_path.exists():
            os.remove(destination_path)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "status": "failed",
                "successful_agents": 0,
                "failed_agents": 5,
                "message": f"Pipeline execution failed: {str(e)}"
            }
        )

    successful_agents = pipeline_result.get("successful_agents", 5)
    failed_agents = pipeline_result.get("failed_agents", 0)
    
    if failed_agents > 0:
        status_val = "partial_success"
        message_val = f"{failed_agents} agent{'s' if failed_agents > 1 else ''} failed but consensus completed"
    else:
        status_val = "success"
        message_val = "File processed successfully."

    return {
        "status": status_val,
        "successful_agents": successful_agents,
        "failed_agents": failed_agents,
        "message": message_val,
        "document_id": doc_id,
        "filename": unique_filename,
        "original_name": filename,
        "result": pipeline_result
    }

@router.get("/api/documents")
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all classified documents from the JSON output folder, respecting ownership."""
    if current_user.role == UserRole.ADMIN:
        allowed_ids = None
    else:
        docs = db.query(Document).filter(Document.uploaded_by == current_user.id).all()
        allowed_ids = {d.document_id for d in docs}
        
    json_dir = Path("storage/json")
    if not json_dir.exists():
        return []
        
    docs_list = []
    for file in json_dir.glob("*.json"):
        doc_id = file.stem
        if allowed_ids is not None and doc_id not in allowed_ids:
            continue
        try:
            with open(file, "r") as f:
                data = json.load(f)
                pages = data.get("pages", [])
                original_name = pages[0].get("filename") if pages else file.name
                
                status_str = "Pending Review" if data.get("has_flagged_pages", False) else "Processed"
                if any(p.get("status") in ["Human Validated", "overridden"] for p in pages):
                    status_str = "Human Validated"
                    
                docs_list.append({
                    "id": data.get("document_id"),
                    "filename": original_name,
                    "pages_count": len(pages),
                    "status": status_str,
                    "created_at": file.stat().st_mtime
                })
        except Exception:
            pass
            
    docs_list.sort(key=lambda d: d["created_at"], reverse=True)
    return docs_list

@router.get("/api/documents/{doc_id}")
def get_document_results(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves classification results for a document, respecting ownership."""
    if current_user.role != UserRole.ADMIN:
        doc = db.query(Document).filter(Document.document_id == doc_id).first()
        if not doc or doc.uploaded_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. Not authorized to view this document.")
            
    json_dir = Path("storage/json")
    file_path = json_dir / f"{doc_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document results not found.")
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read results: {str(e)}")

@router.get("/api/review-queue")
def get_review_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gets all page classifications currently pending human review from queue.json, respecting uploader ownership."""
    queue = load_queue()
    pending_items = [item for item in queue if item.get("status") == "Pending Review"]
    
    if current_user.role == UserRole.ADMIN:
        return pending_items
        
    # For employees, filter queue items to return only those belonging to documents they uploaded
    own_docs = db.query(Document).filter(Document.uploaded_by == current_user.id).all()
    own_doc_ids = {d.document_id for d in own_docs}
    
    return [item for item in pending_items if item.get("document_id") in own_doc_ids]

@router.post("/api/review-queue/override")
def apply_override(
    document_id: str, 
    page_number: int, 
    selected_category: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Executes human override on classification, modifying categories and regenerating outputs."""
    # Check ownership
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document results not found.")
    if current_user.role != UserRole.ADMIN and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. Not authorized to override this document.")
        
    json_dir = Path("storage/json")
    file_path = json_dir / f"{document_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document results not found.")
    
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
            
        page_records = data.get("pages", [])
        
        # Get original category
        page = db.query(DocumentPage).filter(
            DocumentPage.document_id == document_id,
            DocumentPage.page_number == page_number
        ).first()
        old_category = page.predicted_category if page else "unknown"
        
        # Update database page classification
        if page:
            page.predicted_category = selected_category
            page.status = "overridden"
        else:
            page = DocumentPage(
                document_id=document_id,
                page_number=page_number,
                predicted_category=selected_category,
                confidence_score=1.0,
                status="overridden"
            )
            db.add(page)
            
        # Log override
        from backend.audit_logger import log_override
        log_override(
            db=db,
            document_id=document_id,
            page_number=page_number,
            original_category=old_category,
            new_category=selected_category,
            user_id=current_user.id
        )
        
        # Log to enterprise audit logs table
        log_manual_override(
            db=db,
            user_id=str(current_user.id),
            document_id=document_id,
            page_number=page_number,
            old_category=old_category,
            new_category=selected_category
        )
        db.commit()
        
        # Trigger orchestrator override updates and report updates
        result = execute_override(
            document_id=document_id,
            page_number=page_number,
            selected_category=selected_category,
            page_records=page_records
        )
        return {"message": "Override applied successfully.", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply override: {str(e)}")

@router.get("/api/documents/{doc_id}/download/json")
def download_json(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Downloads the document classification JSON report, respecting ownership."""
    if current_user.role != UserRole.ADMIN:
        doc = db.query(Document).filter(Document.document_id == doc_id).first()
        if not doc or doc.uploaded_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. Not authorized to download this document.")
            
    json_dir = Path("storage/json")
    file_path = json_dir / f"{doc_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="JSON report not found.")
    return FileResponse(
        path=file_path,
        media_type="application/json",
        filename=f"report_{doc_id}.json"
    )

@router.get("/api/documents/{doc_id}/download/excel")
def download_excel(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Downloads the document classification Excel report, respecting ownership."""
    if current_user.role != UserRole.ADMIN:
        doc = db.query(Document).filter(Document.document_id == doc_id).first()
        if not doc or doc.uploaded_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. Not authorized to download this document.")
            
    excel_dir = Path("storage/excel")
    file_path = excel_dir / f"{doc_id}.xlsx"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Excel report not found.")
    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"report_{doc_id}.xlsx"
    )

# ==========================================
# EMPLOYEE ROUTE ENDPOINTS
# ==========================================

@router.get("/api/my-documents")
def get_my_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns ONLY documents uploaded by the logged-in employee."""
    docs = db.query(Document).filter(Document.uploaded_by == current_user.id).all()
    return docs

@router.get("/api/my-review-items")
def get_my_review_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns ONLY low confidence pages belonging to the employee's own uploaded documents."""
    items = db.query(DocumentPage).join(
        Document, DocumentPage.document_id == Document.document_id
    ).filter(
        Document.uploaded_by == current_user.id,
        DocumentPage.status == "pending_review"
    ).all()
    
    return [
        {
            "document_id": item.document_id,
            "page_number": item.page_number,
            "confidence": item.confidence_score,
            "predicted_category": item.predicted_category
        }
        for item in items
    ]

@router.post("/api/my-override")
def my_override(
    req: MyOverrideRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows an employee to manually override page classifications for their own documents."""
    # 1. Check ownership
    doc = db.query(Document).filter(Document.document_id == req.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role != UserRole.ADMIN and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. Not authorized to override this document.")
        
    json_dir = Path("storage/json")
    file_path = json_dir / f"{req.document_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document results not found")
        
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
        page_records = data.get("pages", [])
        
        # 2. Get original category
        page = db.query(DocumentPage).filter(
            DocumentPage.document_id == req.document_id,
            DocumentPage.page_number == req.page_number
        ).first()
        old_category = page.predicted_category if page else "unknown"
        
        # 3. Update database page status to overridden
        if page:
            page.predicted_category = req.selected_category
            page.status = "overridden"
        else:
            page = DocumentPage(
                document_id=req.document_id,
                page_number=req.page_number,
                predicted_category=req.selected_category,
                confidence_score=1.0,
                status="overridden"
            )
            db.add(page)
            
        # 4. Log override
        from backend.audit_logger import log_override
        log_override(
            db=db,
            document_id=req.document_id,
            page_number=req.page_number,
            original_category=old_category,
            new_category=req.selected_category,
            user_id=current_user.id
        )
        
        # Log to enterprise audit logs table
        log_manual_override(
            db=db,
            user_id=str(current_user.id),
            document_id=req.document_id,
            page_number=req.page_number,
            old_category=old_category,
            new_category=req.selected_category
        )
        db.commit()
        
        # 5. Trigger override execution & outputs regeneration
        result = execute_override(
            document_id=req.document_id,
            page_number=req.page_number,
            selected_category=req.selected_category,
            page_records=page_records
        )
        return {"message": "Override applied successfully.", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply override: {str(e)}")

# ==========================================
# ADMIN ROUTE ENDPOINTS
# ==========================================

@router.get("/api/admin/all-documents")
def get_all_documents_admin(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Returns all uploaded documents across the system with owner information."""
    docs = db.query(Document).all()
    res = []
    for doc in docs:
        uploader = db.query(User).filter(User.id == doc.uploaded_by).first()
        emp_name = uploader.username if uploader else "Unknown"
        res.append({
            "document_id": doc.document_id,
            "employee": emp_name,
            "filename": doc.filename
        })
    return res

@router.get("/api/admin/review-queue")
def get_review_queue_admin(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Returns all system-wide pending review items in the database."""
    items = db.query(DocumentPage).filter(DocumentPage.status == "pending_review").all()
    return [
        {
            "document_id": item.document_id,
            "page_number": item.page_number,
            "confidence": item.confidence_score,
            "predicted_category": item.predicted_category
        }
        for item in items
    ]

@router.get("/api/admin/override-history")
def get_override_history_admin(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Returns override audit log history with employee information."""
    logs = db.query(OverrideAudit).all()
    res = []
    for log in logs:
        uploader = db.query(User).filter(User.id == log.overridden_by).first()
        emp_name = uploader.username if uploader else "Unknown"
        res.append({
            "employee": emp_name,
            "document_id": log.document_id,
            "page_number": log.page_number,
            "original_category": log.original_category,
            "new_category": log.new_category,
            "timestamp": log.override_timestamp.isoformat()
        })
    return res

@router.get("/api/admin/employees")
def list_employees_admin(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Returns a list of all registered employees in the system, restricted to administrators."""
    users = db.query(User).filter(User.role == UserRole.EMPLOYEE).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        for user in users
    ]

@router.get("/api/admin/audit-logs")
def list_audit_logs_admin(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Returns a list of all system-wide audit logs, ordered by timestamp descending, restricted to administrators."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "document_id": log.document_id,
            "page_number": log.page_number,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]
