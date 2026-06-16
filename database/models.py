from datetime import datetime
import uuid
import enum
from typing import Optional, List
from sqlalchemy import String, ForeignKey, DateTime, Enum as SQLEnum, Float, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class UserRole(str, enum.Enum):
    EMPLOYEE = "Employee"
    ADMIN = "Admin"

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum"),
        default=UserRole.EMPLOYEE,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )

    documents: Mapped[List["Document"]] = relationship(back_populates="uploader")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="user")
    downloads: Mapped[List["DownloadHistory"]] = relationship(back_populates="user")
    reviews: Mapped[List["ReviewQueue"]] = relationship(back_populates="assignee")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    upload_status: Mapped[str] = mapped_column(String(50), default="Uploaded", nullable=False)
    uploaded_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )

    uploader: Mapped[Optional[User]] = relationship(back_populates="documents")
    page_classifications: Mapped[List["PageClassification"]] = relationship(
        back_populates="document", 
        cascade="all, delete-orphan"
    )
    review_entries: Mapped[List["ReviewQueue"]] = relationship(
        back_populates="document", 
        cascade="all, delete-orphan"
    )
    downloads: Mapped[List["DownloadHistory"]] = relationship(
        back_populates="document", 
        cascade="all, delete-orphan"
    )


class PageClassification(Base):
    __tablename__ = "page_classifications"
    __table_args__ = (UniqueConstraint("document_id", "page_number", name="uniq_doc_page"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("documents.id", ondelete="CASCADE"), 
        nullable=False
    )
    page_number: Mapped[int] = mapped_column(nullable=False)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    reasoning: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="Processed", nullable=False)
    segment_id: Mapped[Optional[int]] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow, 
        nullable=False
    )

    document: Mapped[Document] = relationship(back_populates="page_classifications")


class ReviewQueue(Base):
    __tablename__ = "review_queue"
    __table_args__ = (UniqueConstraint("document_id", "page_number", name="uniq_queue_doc_page"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("documents.id", ondelete="CASCADE"), 
        nullable=False
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    page_number: Mapped[int] = mapped_column(nullable=False)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    reasoning: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="Pending Review", nullable=False)
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow, 
        nullable=False
    )

    document: Mapped[Document] = relationship(back_populates="review_entries")
    assignee: Mapped[Optional[User]] = relationship(back_populates="reviews")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL")
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )

    user: Mapped[Optional[User]] = relationship(back_populates="audit_logs")


class DownloadHistory(Base):
    __tablename__ = "download_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL")
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("documents.id", ondelete="CASCADE"), 
        nullable=False
    )
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)
    downloaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        nullable=False
    )

    user: Mapped[Optional[User]] = relationship(back_populates="downloads")
    document: Mapped[Document] = relationship(back_populates="downloads")
