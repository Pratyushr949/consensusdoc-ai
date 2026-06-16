# ConsensusDoc AI

Enterprise-grade intelligent document processing system for automated multi-page document classification using multi-agent AI consensus architecture.

---

## Overview

ConsensusDoc AI is an advanced document intelligence platform designed to process mixed multi-page PDF documents containing multiple document types within a single upload.

The system performs page-level classification using five parallel AI agents running independently and applies consensus-based voting to determine final classification.

If classification confidence falls below a threshold of **75%**, the system routes the document page to a **Human-in-the-Loop Review Dashboard** for manual verification before final output generation.

The platform automatically detects document boundaries, groups related pages into logical document segments, and generates structured **JSON** and **Excel** reports.

---

## Core Problem Statement

In enterprise document processing pipelines, a single PDF often contains multiple document types such as:

- Invoices
- Bank Statements
- Aadhaar Cards
- PAN Cards
- Passports
- Insurance Documents

Traditional OCR systems process the entire PDF as one document.

ConsensusDoc AI solves this problem by:

- Splitting PDF page-by-page
- Classifying each page independently
- Detecting boundaries between different document types
- Grouping consecutive pages belonging to the same document
- Allowing manual human review when confidence is low

---

# System Architecture

The system follows a **14-stage enterprise pipeline architecture**.

```text
PDF Upload
    │
    ▼
1. PDF Splitter
    │
    ▼
2. OCR Engine
    │
    ▼
3. Text Preprocessing
    │
    ▼
4. 5 Parallel AI Agents (Google ADK + Gemini)
    │
    ▼
5. Voting Engine
    │
    ▼
6. Confidence Engine
    │
    ▼
7. Reason Aggregator
    │
    ▼
8. Confidence Threshold Checker
    │
    ▼
9. Human Review Queue
    │
    ▼
10. Override Engine
    │
    ▼
11. Boundary Detector
    │
    ▼
12. Segment Builder
    │
    ▼
13. JSON Generator
    │
    ▼
14. Excel Generator
```

---

# Multi-Agent Consensus Architecture

The system uses **5 parallel AI agents** running independently.

All agents perform identical classification tasks.

Each agent runs with different temperature values to simulate reasoning diversity.

| Agent | Model | Temperature |
|---------|------|------------|
| Agent 1 | Gemini | 0.00 |
| Agent 2 | Gemini | 0.05 |
| Agent 3 | Gemini | 0.10 |
| Agent 4 | Gemini | 0.15 |
| Agent 5 | Gemini | 0.20 |

Each agent returns:

```json
{
  "document_type": "invoice",
  "confidence": 0.92,
  "reasoning": "Detected invoice related fields."
}
```

---

# Consensus Voting Engine

All agent outputs are aggregated.

Voting logic:

- Maximum vote wins classification
- Majority consensus determines final document type
- All reasoning logs are aggregated

Example:

```text
Agent 1 → invoice
Agent 2 → invoice
Agent 3 → invoice
Agent 4 → bank_statement
Agent 5 → invoice

Final Classification = invoice
Vote Ratio = 4/5
```

---

# Confidence Engine

Final confidence score is calculated using:

```math
FinalConfidence = VoteRatio × AvgConfidence × (1 - Variance)
```

Where:

```text
VoteRatio = WinningVotes / TotalAgents
```

This prevents overconfidence in inconsistent agent outputs.

---

# Human-in-the-Loop Review

If confidence score falls below:

```text
75%
```

The page is automatically routed to:

```text
Human Inspection Required
```

Workflow:

```text
Low Confidence Page
      │
      ▼
Review Queue
      │
      ▼
Dashboard displays page
      │
      ▼
User manually selects correct category
      │
      ▼
Override Engine updates classification
      │
      ▼
JSON and Excel reports regenerated
```

---

# Boundary Detection System

The system detects transitions between document types.

Example PDF:

```text
Page 1 → Invoice
Page 2 → Invoice
Page 3 → Bank Statement
Page 4 → Aadhaar
Page 5 → Aadhaar
```

Boundary detection:

```text
Invoice Segment → Pages 1-2
Bank Statement Segment → Page 3
Aadhaar Segment → Pages 4-5
```

---

# Supported Document Categories

Configured in:

```text
config/categories.json
```

Supported types:

- invoice
- bank_statement
- aadhaar
- pan_card
- passport
- insurance_document

Each category contains:

```json
{
  "id": 1,
  "name": "invoice",
  "description": "Commercial invoice documents"
}
```

---

# Project Structure

```text
project2/

├── agents/
│   ├── adk_agent_1.py
│   ├── adk_agent_2.py
│   ├── adk_agent_3.py
│   ├── adk_agent_4.py
│   ├── adk_agent_5.py
│   └── ray_manager.py
│
├── backend/
│   ├── main.py
│   ├── routes.py
│   ├── orchestrator.py
│   ├── pdf_splitter.py
│   ├── ocr_engine.py
│   ├── preprocess.py
│   ├── voting_engine.py
│   ├── confidence_engine.py
│   ├── confidence_threshold.py
│   ├── reason_aggregator.py
│   ├── human_review_queue.py
│   ├── override_engine.py
│   ├── boundary_detector.py
│   ├── segment_builder.py
│   ├── json_generator.py
│   └── excel_generator.py
│
├── config/
│   ├── config.yaml
│   └── categories.json
│
├── frontend/
│   ├── src/
│   └── components/
│
├── database/
│   ├── models.py
│   └── schema.sql
│
├── storage/
│   ├── uploads/
│   ├── json/
│   ├── excel/
│   └── review_queue/
│
├── requirements.txt
└── run.py
```

---

# Tech Stack

Backend:

- Python
- FastAPI
- Uvicorn

AI Layer:

- Google ADK
- Gemini API
- Multi-Agent Architecture

Parallel Execution:

- Ray Framework

Document Processing:

- pdfplumber
- PaddleOCR
- NumPy

Database:

- PostgreSQL

Frontend:

- React
- Vite
- Tailwind CSS

Export:

- JSON
- OpenPyXL Excel Generation

Version Control:

- Git
- GitHub

---

# API Endpoints

### Health Check

```http
GET /health
```

### Upload PDF

```http
POST /api/upload
```

### Review Queue

```http
GET /api/review
```

### Manual Override

```http
POST /api/override
```

---

# Future Improvements

- Authentication system
- Role-based access control
- Kubernetes deployment
- Docker containerization
- AWS deployment
- Redis caching
- Monitoring dashboard
- Real-time document processing

---

# Current Development Status

| Module | Status |
|---------|--------|
| Backend | Completed |
| Multi-Agent Architecture | Completed |
| OCR Pipeline | Completed |
| PDF Processing | Completed |
| Human Review Workflow | In Progress |
| Frontend Integration | In Progress |
| Database Integration | In Progress |
| Deployment | Pending |

---

# Author

Pratyush Raj

GitHub:

https://github.com/Pratyushr949

---

# License

MIT License

---

## Project Vision

Building enterprise-grade intelligent document processing systems using multi-agent AI consensus architecture with human-in-the-loop verification.
