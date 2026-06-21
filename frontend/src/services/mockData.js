// frontend/src/services/mockData.js

const INITIAL_DOCUMENTS = [
  {
    id: "doc-101",
    filename: "q1_invoice_report.pdf",
    pages_count: 3,
    status: "Approved",
    uploaded_at: "2026-06-15 14:30",
    pages: [
      { page_number: 1, document_type: "invoice", confidence: 0.95, status: "Approved", reasoning: "Standard invoice layout detected. Company name and pricing details found." },
      { page_number: 2, document_type: "invoice", confidence: 0.92, status: "Approved", reasoning: "Invoice line items table detected. Totals align with calculations." },
      { page_number: 3, document_type: "bank_statement", confidence: 0.88, status: "Approved", reasoning: "Monthly balance sheet structure detected." }
    ],
    segments: [
      { segment_id: 1, document_type: "invoice", pages: [1, 2], average_confidence: 0.935 },
      { segment_id: 2, document_type: "bank_statement", pages: [3], average_confidence: 0.88 }
    ]
  },
  {
    id: "doc-102",
    filename: "compliance_report_june.pdf",
    pages_count: 4,
    status: "Pending Review",
    uploaded_at: "2026-06-16 09:12",
    pages: [
      { page_number: 1, document_type: "passport", confidence: 0.94, status: "Approved", reasoning: "Passport biographical page layout matched." },
      { page_number: 2, document_type: "pan_card", confidence: 0.89, status: "Approved", reasoning: "PAN Card layout detected with high text accuracy." },
      { page_number: 3, document_type: "insurance_document", confidence: 0.91, status: "Approved", reasoning: "Insurance policy terms text found." },
      { page_number: 4, document_type: "aadhaar", confidence: 0.52, status: "Pending Review", reasoning: "Unclear biometrics scan. Low resolution demographic metadata." }
    ],
    segments: [
      { segment_id: 1, document_type: "passport", pages: [1], average_confidence: 0.94 },
      { segment_id: 2, document_type: "pan_card", pages: [2], average_confidence: 0.89 },
      { segment_id: 3, document_type: "insurance_document", pages: [3], average_confidence: 0.91 },
      { segment_id: 4, document_type: "aadhaar", pages: [4], average_confidence: 0.52 }
    ]
  },
  {
    id: "doc-103",
    filename: "vendor_contract_amendment.pdf",
    pages_count: 2,
    status: "Approved",
    uploaded_at: "2026-06-16 11:45",
    pages: [
      { page_number: 1, document_type: "insurance_document", confidence: 0.96, status: "Approved", reasoning: "Indemnity clauses and coverage details matched." },
      { page_number: 2, document_type: "insurance_document", confidence: 0.95, status: "Approved", reasoning: "Signature page with corporate stamps matched." }
    ],
    segments: [
      { segment_id: 1, document_type: "insurance_document", pages: [1, 2], average_confidence: 0.955 }
    ]
  },
  {
    id: "doc-104",
    filename: "invoice_batch_9.pdf",
    pages_count: 1,
    status: "Pending Review",
    uploaded_at: "2026-06-16 12:10",
    pages: [
      { page_number: 1, document_type: "invoice", confidence: 0.71, status: "Pending Review", reasoning: "Flipped layout orientation. Blurred line item calculations." }
    ],
    segments: [
      { segment_id: 1, document_type: "invoice", pages: [1], average_confidence: 0.71 }
    ]
  },
  {
    id: "doc-105",
    filename: "rejected_blank_scan.pdf",
    pages_count: 2,
    status: "Rejected",
    uploaded_at: "2026-06-17 10:05",
    pages: [
      { page_number: 1, document_type: "unknown", confidence: 0.20, status: "Rejected", reasoning: "Blank page or unsupported format." },
      { page_number: 2, document_type: "unknown", confidence: 0.15, status: "Rejected", reasoning: "Noise elements only, no recognizable text structure." }
    ],
    segments: [
      { segment_id: 1, document_type: "unknown", pages: [1, 2], average_confidence: 0.175 }
    ]
  }
];

export const mockDataService = {
  init: () => {
    if (!localStorage.getItem('mock_documents')) {
      localStorage.setItem('mock_documents', JSON.stringify(INITIAL_DOCUMENTS));
    }
  },

  getDocuments: () => {
    mockDataService.init();
    return JSON.parse(localStorage.getItem('mock_documents'));
  },

  getDocument: (id) => {
    const docs = mockDataService.getDocuments();
    return docs.find(d => d.id === id) || null;
  },

  addDocument: (filename, pagesCount) => {
    mockDataService.init();
    const docs = mockDataService.getDocuments();
    
    // Generate new mock document
    const newId = `doc-${100 + docs.length + 1}`;
    
    // Create pages with mix of high and low conf classifications
    const pages = [];
    const possibleTypes = ["invoice", "bank_statement", "aadhaar", "pan_card", "passport", "insurance_document"];
    
    let hasFlagged = false;
    let totalConfidence = 0;

    for (let i = 1; i <= pagesCount; i++) {
      // Intentionally flag the first page of larger documents or if i === 2 with low confidence
      const isLowConfidence = (pagesCount > 1 && i === pagesCount) || Math.random() < 0.25;
      const confidence = isLowConfidence ? parseFloat((0.45 + Math.random() * 0.28).toFixed(2)) : parseFloat((0.78 + Math.random() * 0.20).toFixed(2));
      const documentType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
      
      let status = "Approved";
      let reasoning = `Detected high density of visual and text indicators matching standard templates for ${documentType}.`;

      if (confidence < 0.75) {
        status = "Pending Review";
        reasoning = `High noise or variance detected in text. Low resolution OCR output matches multiple standard template shapes.`;
        hasFlagged = true;
      }

      pages.push({
        page_number: i,
        document_type: documentType,
        confidence,
        status,
        reasoning
      });
      totalConfidence += confidence;
    }

    // Determine final status
    const status = hasFlagged ? "Pending Review" : "Approved";
    
    // Build Segments (group consecutive pages of same type)
    const segments = [];
    let currentSegment = null;
    let segId = 1;

    pages.forEach((p) => {
      if (!currentSegment || currentSegment.document_type !== p.document_type) {
        if (currentSegment) {
          currentSegment.average_confidence = parseFloat((currentSegment.total_conf / currentSegment.pages.length).toFixed(3));
          delete currentSegment.total_conf;
          segments.push(currentSegment);
        }
        currentSegment = {
          segment_id: segId++,
          document_type: p.document_type,
          pages: [p.page_number],
          total_conf: p.confidence
        };
      } else {
        currentSegment.pages.push(p.page_number);
        currentSegment.total_conf += p.confidence;
      }
    });
    
    if (currentSegment) {
      currentSegment.average_confidence = parseFloat((currentSegment.total_conf / currentSegment.pages.length).toFixed(3));
      delete currentSegment.total_conf;
      segments.push(currentSegment);
    }

    const newDoc = {
      id: newId,
      filename,
      pages_count: pagesCount,
      status,
      uploaded_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      pages,
      segments
    };

    docs.unshift(newDoc); // add to top
    localStorage.setItem('mock_documents', JSON.stringify(docs));
    return newDoc;
  },

  getReviewQueue: () => {
    const docs = mockDataService.getDocuments();
    const queue = [];

    docs.forEach(doc => {
      doc.pages.forEach(page => {
        if (page.status === 'Pending Review' || page.confidence < 0.75) {
          queue.push({
            document_id: doc.id,
            filename: doc.filename,
            page_number: page.page_number,
            document_type: page.document_type,
            confidence: page.confidence,
            reasoning: page.reasoning,
            status: page.status
          });
        }
      });
    });

    return queue;
  },

  overridePageCategory: (documentId, pageNumber, newCategory) => {
    mockDataService.init();
    const docs = mockDataService.getDocuments();
    const docIdx = docs.findIndex(d => d.id === documentId);
    
    if (docIdx === -1) return false;
    
    const doc = docs[docIdx];
    const pageIdx = doc.pages.findIndex(p => p.page_number === parseInt(pageNumber));
    
    if (pageIdx === -1) return false;

    // 1. Update the specific page
    doc.pages[pageIdx].document_type = newCategory;
    doc.pages[pageIdx].confidence = 1.0;
    doc.pages[pageIdx].status = "Approved"; // marked as approved now
    doc.pages[pageIdx].reasoning = `Human in the loop override: User verified and selected '${newCategory}' category.`;

    // 2. Recalculate segment bounds and average confidences
    const segments = [];
    let currentSegment = null;
    let segId = 1;

    doc.pages.forEach((p) => {
      if (!currentSegment || currentSegment.document_type !== p.document_type) {
        if (currentSegment) {
          currentSegment.average_confidence = parseFloat((currentSegment.total_conf / currentSegment.pages.length).toFixed(3));
          delete currentSegment.total_conf;
          segments.push(currentSegment);
        }
        currentSegment = {
          segment_id: segId++,
          document_type: p.document_type,
          pages: [p.page_number],
          total_conf: p.confidence
        };
      } else {
        currentSegment.pages.push(p.page_number);
        currentSegment.total_conf += p.confidence;
      }
    });
    
    if (currentSegment) {
      currentSegment.average_confidence = parseFloat((currentSegment.total_conf / currentSegment.pages.length).toFixed(3));
      delete currentSegment.total_conf;
      segments.push(currentSegment);
    }
    doc.segments = segments;

    // 3. Update overall document status if all pages are now resolved
    const hasUnresolvedPages = doc.pages.some(p => p.status === 'Pending Review');
    if (!hasUnresolvedPages) {
      doc.status = "Approved"; // or Human Validated
    }

    docs[docIdx] = doc;
    localStorage.setItem('mock_documents', JSON.stringify(docs));
    return true;
  },

  getDashboardMetrics: () => {
    const docs = mockDataService.getDocuments();
    let total = docs.length;
    let underReview = 0;
    let approved = 0;
    let rejected = 0;

    docs.forEach(doc => {
      if (doc.status === 'Pending Review') {
        underReview++;
      } else if (doc.status === 'Approved' || doc.status === 'Human Validated' || doc.status === 'Processed') {
        approved++;
      } else if (doc.status === 'Rejected') {
        rejected++;
      }
    });

    return {
      total,
      underReview,
      approved,
      rejected
    };
  }
};
