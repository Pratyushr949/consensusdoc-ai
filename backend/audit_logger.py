from sqlalchemy.orm import Session
from database.models import OverrideAudit
import uuid
from datetime import datetime

def log_override(
    db: Session,
    document_id: str,
    page_number: int,
    original_category: str,
    new_category: str,
    user_id: uuid.UUID,
    reason: str = None
):
    """
    Appends an override audit log entry to the database.
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
