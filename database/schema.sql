-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM type for roles (supports employee and admin)
CREATE TYPE user_role_enum AS ENUM ('employee', 'admin');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Documents Table
CREATE TABLE documents (
    document_id VARCHAR(100) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_pages INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processed'
);

-- 3. Document Pages Table
CREATE TABLE document_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id VARCHAR(100) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    predicted_category VARCHAR(100) NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processed',
    CONSTRAINT uniq_doc_page UNIQUE (document_id, page_number)
);

-- 4. Override Audit Table
CREATE TABLE override_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id VARCHAR(100) NOT NULL,
    page_number INTEGER NOT NULL,
    original_category VARCHAR(100) NOT NULL,
    new_category VARCHAR(100) NOT NULL,
    overridden_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    override_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- Indexes for performance optimization
CREATE INDEX idx_docs_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_doc_pages_doc ON document_pages(document_id);
CREATE INDEX idx_override_audit_by ON override_audit(overridden_by);

-- 5. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    document_id VARCHAR(100),
    page_number INTEGER,
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
