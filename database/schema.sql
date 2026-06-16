-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM type for roles
CREATE TYPE user_role_enum AS ENUM ('Employee', 'Admin');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'Employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    upload_status VARCHAR(50) NOT NULL DEFAULT 'Uploaded',
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Page Classifications Table
CREATE TABLE page_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    reasoning TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Processed',
    segment_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_doc_page UNIQUE (document_id, page_number)
);

-- 4. Review Queue Table
CREATE TABLE review_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    page_number INTEGER NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    reasoning TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Review',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_queue_doc_page UNIQUE (document_id, page_number)
);

-- 5. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Download History Table
CREATE TABLE download_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    file_type VARCHAR(10) NOT NULL, -- 'JSON' or 'Excel'
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX idx_docs_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_page_class_doc ON page_classifications(document_id);
CREATE INDEX idx_review_queue_doc ON review_queue(document_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_download_hist_user ON download_history(user_id);

-- Role System Permissions Constraints:
-- 'Admin' has all privileges.
-- 'Employee' has restricted privileges (cannot access audit and download history tables).

-- Create Roles
-- CREATE ROLE db_admin;
-- CREATE ROLE db_employee;

-- Grant Full permissions on all tables to Admin role
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_admin;

-- Grant Restrictive permissions to Employee role (specifically excluding audit_logs and download_history)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON users, documents, page_classifications, review_queue TO db_employee;
-- REVOKE ALL PRIVILEGES ON audit_logs, download_history FROM db_employee;
