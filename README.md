# 🚀 ConsensusDoc AI

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=27&duration=2500&pause=800&color=00F7FF&center=true&vCenter=true&width=1000&lines=Enterprise+Grade+Document+Intelligence+Platform;5+Parallel+AI+Agents+Running+with+Ray;Groq+%2B+Llama+3.3+Powered+Consensus+Engine;Human+in+the+Loop+Verification+Architecture;Automated+JSON+%2B+Excel+Report+Generation" />
</p>

<p align="center">

<img src="https://img.shields.io/badge/AI-Multi_Agent-blue?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Backend-FastAPI-green?style=for-the-badge"/>
<img src="https://img.shields.io/badge/LLM-Llama_3.3-orange?style=for-the-badge"/>
<img src="https://img.shields.io/badge/API-Groq-red?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Parallel-Ray-purple?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge"/>

</p>

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

* 📄 Invoices
* 🏦 Bank Statements
* 🪪 Aadhaar Cards
* 💳 PAN Cards
* 🌍 Passports
* 🛡 Insurance Documents

Traditional OCR systems process the entire PDF as one document.

ConsensusDoc AI solves this problem by:

* Splitting PDF page-by-page
* Classifying each page independently
* Detecting boundaries between different document types
* Grouping consecutive pages belonging to the same document
* Allowing manual human review when confidence is low

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
4. 5 Parallel AI Agents (Groq + Llama 3.3)
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


</p>

# Multi-Agent Consensus Architecture

The system uses **5 parallel AI agents** running independently.

All agents perform identical classification tasks.

Each agent uses an independent API key and runs in parallel using Ray distributed execution.

| Agent   | Model         | API            |
| ------- | ------------- | -------------- |
| Agent 1 | Llama 3.3 70B | Groq API Key 1 |
| Agent 2 | Llama 3.3 70B | Groq API Key 2 |
| Agent 3 | Llama 3.3 70B | Groq API Key 3 |
| Agent 4 | Llama 3.3 70B | Groq API Key 4 |
| Agent 5 | Llama 3.3 70B | Groq API Key 5 |

Each agent returns:

```json
{
  "document_type": "invoice",
  "confidence": 0.92,
  "reasoning": "Detected invoice related fields."
}
```

---

# Parallel Processing Engine

ConsensusDoc AI uses **Ray Distributed Framework** for executing all AI agents concurrently.

Workflow:

```text
Same OCR Text
      │
      ▼
Agent 1 ─┐
Agent 2 ─┤
Agent 3 ─┼── Parallel Execution via Ray
Agent 4 ─┤
Agent 5 ─┘
      │
      ▼
Voting Engine
```

Benefits:

* ⚡ Reduced latency
* ⚙ Independent agent execution
* 🔒 Fault isolation
* 📈 Scalable architecture
* 🔄 Parallel API utilization

---

# Consensus Voting Engine

All agent outputs are aggregated.

Voting logic:

* Maximum vote wins classification
* Majority consensus determines final document type
* All reasoning logs are aggregated

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

* invoice
* bank_statement
* aadhaar
* pan_card
* passport
* insurance_document

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
│   ├── key_manager.py
│   ├── llm_client.py
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

* Python
* FastAPI
* Uvicorn

AI Layer:

* Groq API
* Llama 3.3 70B Versatile
* Multi-Agent Consensus Architecture

Parallel Execution:

* Ray Framework

Document Processing:

* pdfplumber
* PaddleOCR
* NumPy

Database:

* PostgreSQL

Frontend:

* React
* Vite
* Tailwind CSS

Export:

* JSON
* OpenPyXL Excel Generation

Version Control:

* Git
* GitHub

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

### Get Document Result

```http
GET /api/documents/{document_id}
```

### Review Queue

```http
GET /api/review-queue
```

### Manual Override

```http
POST /api/review-queue/override
```

### Download JSON

```http
GET /api/documents/{document_id}/download/json
```

### Download Excel

```http
GET /api/documents/{document_id}/download/excel
```

### User Register

```http
POST /api/users/register
```

### User Login

```http
POST /api/users/login
```

---

# Future Improvements

* Role-Based Access Control (Employee / Admin)
* Employee Document Dashboard
* Employee Override Workflow
* Admin Audit Dashboard
* Override History Tracking
* PostgreSQL Production Integration
* Docker Containerization
* Kubernetes Deployment
* AWS Deployment
* Real-time Monitoring Dashboard

---

# Current Development Status

| Module                   | Status                          |
| ------------------------ | ------------------------------- |
| Backend                  | ✅ Completed                     |
| Multi-Agent Architecture | ✅ Completed                     |
| OCR Pipeline             | ✅ Completed                     |
| PDF Processing           | ✅ Completed                     |
| Groq Migration           | ✅ Completed                     |
| Human Review Workflow    | ✅ Completed                     |
| JSON Generation          | ✅ Completed                     |
| Excel Generation         | ✅ Completed                     |
| Authentication Layer     | ✅ Completed                     |
| Frontend Integration     | ✅ Completed                     |
| Role Based Access        | ✅ Completed                     |
| Deployment               | ✅ Completed                     |

---

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=Pratyushr949&show_icons=true&theme=tokyonight" />
</p>

# Author

**Pratyush Raj**

GitHub:

https://github.com/Pratyushr949

---

## Project Vision

Building enterprise-grade intelligent document processing systems using multi-agent AI consensus architecture with human-in-the-loop verification.

---

<p align="center">
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=120&section=footer"/>
</p>
