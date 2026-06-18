from datetime import datetime
import uuid
import enum
from typing import Optional, List
from sqlalchemy import String, ForeignKey, DateTime, Enum as SQLEnum, Float, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator, VARCHAR, CHAR

class Base(DeclarativeBase):
    pass

class UserRole(str, enum.Enum):
    EMPLOYEE = "Employee"
    ADMIN = "Admin"

class CapitalizedRoleType(TypeDecorator):
    """
    Custom SQLAlchemy column type to store user roles in lowercase ('employee', 'admin')
    in the database, but return them capitalized ('Employee', 'Admin') to Python.
    """
    impl = VARCHAR(50)
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value.value.lower()
        return str(value).lower()
        
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        val_lower = str(value).lower()
        if val_lower == "admin":
            return UserRole.ADMIN
        return UserRole.EMPLOYEE

class StringUUID(TypeDecorator):
    """
    UUID type that always returns lowercase string representations in Python,
    compatible with both PostgreSQL UUID and SQLite CHAR(36).
    """
    impl = CHAR(36)
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(UUID(as_uuid=False))
        return dialect.type_descriptor(CHAR(36))
        
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)
        
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return str(value)

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(StringUUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        CapitalizedRoleType,
        default=UserRole.EMPLOYEE,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )

    documents: Mapped[List["Document"]] = relationship(back_populates="uploader")


class Document(Base):
    __tablename__ = "documents"

    document_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_by: Mapped[Optional[str]] = mapped_column(
        StringUUID, 
        ForeignKey("users.id", ondelete="SET NULL")
    )
    upload_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )
    total_pages: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="processed", nullable=False)

    uploader: Mapped[Optional[User]] = relationship(back_populates="documents")
    pages: Mapped[List["DocumentPage"]] = relationship(
        back_populates="document", 
        cascade="all, delete-orphan"
    )


class DocumentPage(Base):
    __tablename__ = "document_pages"
    __table_args__ = (UniqueConstraint("document_id", "page_number", name="uniq_doc_page"),)

    id: Mapped[str] = mapped_column(StringUUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(
        String(100), 
        ForeignKey("documents.document_id", ondelete="CASCADE"), 
        nullable=False
    )
    page_number: Mapped[int] = mapped_column(nullable=False)
    predicted_category: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="processed", nullable=False)

    document: Mapped[Document] = relationship(back_populates="pages")


class OverrideAudit(Base):
    __tablename__ = "override_audit"

    id: Mapped[str] = mapped_column(StringUUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(String(100), nullable=False)
    page_number: Mapped[int] = mapped_column(nullable=False)
    original_category: Mapped[str] = mapped_column(String(100), nullable=False)
    new_category: Mapped[str] = mapped_column(String(100), nullable=False)
    overridden_by: Mapped[str] = mapped_column(
        StringUUID, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    override_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )
    reason: Mapped[Optional[str]] = mapped_column(Text)
