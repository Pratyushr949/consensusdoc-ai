from sqlalchemy.orm import Session
from database.models import OverrideAudit, AuditLog
import uuid
from datetime import datetime
from typing import Optional

def log_override(
    db: Session,
    document_id: str,
    page_number: int,
    original_category: str,
    new_category: str,
    user_id: str,
    reason: str = None
):
    """
    Appends an override audit log entry to the legacy override_audit database table.
    """
    audit = OverrideAudit(
        document_id=document_id,
        page_number=page_number,
        original_category=original_category,
        new_category=new_category,
        overridden_by=user_id,
        override_timestamp=datetime.utcnow(),
        reason=reason
    )
    db.add(audit)
    db.commit()

# ==========================================
# ENTERPRISE AUDIT LOGGER IMPLEMENTATION
# ==========================================

def log_user_login(db: Session, user_id: str, username: str) -> None:
    """
    Logs a successful user authentication event.
    """
    log_entry = AuditLog(
        user_id=user_id,
        action="USER_LOGIN",
        new_value=username
    )
    db.add(log_entry)
    db.commit()

def log_document_upload(db: Session, user_id: str, username: str, document_id: str, filename: str) -> None:
    """
    Logs a document upload action.
    """
    log_entry = AuditLog(
        user_id=user_id,
        action="DOCUMENT_UPLOAD",
        document_id=document_id,
        old_value=username,
        new_value=filename
    )
    db.add(log_entry)
    db.commit()

def log_manual_override(
    db: Session, 
    user_id: str, 
    document_id: str, 
    page_number: int, 
    old_category: str, 
    new_category: str
) -> None:
    """
    Logs a manual classification override by an operator.
    """
    log_entry = AuditLog(
        user_id=user_id,
        action="MANUAL_OVERRIDE",
        document_id=document_id,
        page_number=page_number,
        old_value=old_category,
        new_value=new_category
    )
    db.add(log_entry)
    db.commit()

def log_classification_completion(db: Session, document_id: str, final_status: str, processing_time: float) -> None:
    """
    Logs the completion status and execution latency of a document classification pipeline.
    """
    log_entry = AuditLog(
        action="CLASSIFICATION_COMPLETED",
        document_id=document_id,
        old_value=final_status,
        new_value=f"{processing_time:.2f}s"
    )
    db.add(log_entry)
    db.commit()
