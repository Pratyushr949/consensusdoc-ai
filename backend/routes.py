import os
import uuid
import json
import yaml
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import FileResponse
from backend.orchestrator import run_pipeline, execute_override, ConsensusFailureError
from backend.human_review_queue import load_queue

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
async def upload_pdf(file: UploadFile = File(...)):
    """Accepts exactly one PDF file, validates it, saves it, and runs the classification pipeline."""
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
    try:
        pipeline_result = run_pipeline(
            pdf_path=str(destination_path),
            document_id=doc_id,
            filename=filename
        )
    except ConsensusFailureError as e:
        if destination_path.exists():
            os.remove(destination_path)
        from fastapi.responses import JSONResponse
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
        from fastapi.responses import JSONResponse
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
def list_documents():
    """Lists all classified documents from the JSON output folder."""
    json_dir = Path("storage/json")
    if not json_dir.exists():
        return []
        
    docs = []
    for file in json_dir.glob("*.json"):
        try:
            with open(file, "r") as f:
                data = json.load(f)
                pages = data.get("pages", [])
                original_name = pages[0].get("filename") if pages else file.name
                
                status_str = "Pending Review" if data.get("has_flagged_pages", False) else "Processed"
                if any(p.get("status") == "Human Validated" for p in pages):
                    status_str = "Human Validated"
                    
                docs.append({
                    "id": data.get("document_id"),
                    "filename": original_name,
                    "pages_count": len(pages),
                    "status": status_str,
                    "created_at": file.stat().st_mtime
                })
        except Exception:
            pass
            
    docs.sort(key=lambda d: d["created_at"], reverse=True)
    return docs

@router.get("/api/documents/{doc_id}")
def get_document_results(doc_id: str):
    """Retrieves classification results for a document."""
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
def get_review_queue():
    """Gets all page classifications currently pending human review."""
    queue = load_queue()
    return [item for item in queue if item.get("status") == "Pending Review"]

@router.post("/api/review-queue/override")
def apply_override(document_id: str, page_number: int, selected_category: str):
    """Executes human override on classification, modifying categories and regenerating outputs."""
    json_dir = Path("storage/json")
    file_path = json_dir / f"{document_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document results not found.")
    
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
            
        page_records = data.get("pages", [])
        
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
def download_json(doc_id: str):
    """Downloads the document classification JSON report."""
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
def download_excel(doc_id: str):
    """Downloads the document classification Excel report."""
    excel_dir = Path("storage/excel")
    file_path = excel_dir / f"{doc_id}.xlsx"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Excel report not found.")
    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"report_{doc_id}.xlsx"
    )
