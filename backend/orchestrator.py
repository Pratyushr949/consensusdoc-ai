from pathlib import Path

# Module imports for each pipeline stage
# 1. PDF Splitter
from backend.pdf_splitter import PDFSplitter
# 2. OCR Engine
from backend.ocr_engine import OCREngine
# 3. Text Preprocessing
from backend.preprocess import preprocess_text
# 4. Ray Parallel ADK Agents
from agents.ray_manager import classify_page
# 5. Voting Engine
from backend.voting_engine import determine_winning_category
# 6. Confidence Engine
from backend.confidence_engine import calculate_final_confidence
# 7. Reason Aggregator
from backend.reason_aggregator import aggregate_reasoning
# 8 & 9. Confidence Threshold Checker & Human Review Queue
from backend.confidence_threshold import check_threshold_and_route
# 10. Override Engine
from backend.override_engine import override_classification
# 11. Boundary Detector
from backend.boundary_detector import detect_boundaries
# 12. Segment Builder
from backend.segment_builder import build_segments
# 13. JSON Generator
from backend.json_generator import generate_json_report
# 14. Excel Generator
from backend.excel_generator import generate_excel_report

def finalize_pipeline_outputs(document_id: str, page_records: list[dict], has_flagged_pages: bool) -> dict:
    """
    Coordinates stages 11 to 14 of the pipeline:
    - Stage 11: Boundary Detector
    - Stage 12: Segment Builder (mapping segment IDs back to pages)
    - Stage 13: JSON Generator
    - Stage 14: Excel Generator
    """
    # 11. Boundary Detector
    boundaries = detect_boundaries(page_records)
    
    # 12. Segment Builder
    segments = build_segments(page_records)
    
    # Map segment_id back to individual page records
    for segment in segments:
        seg_id = segment["segment_id"]
        for p_num in segment["pages"]:
            for record in page_records:
                if record["page_number"] == p_num:
                    record["segment_id"] = seg_id
                    
    report_data = {
        "document_id": document_id,
        "has_flagged_pages": has_flagged_pages,
        "boundaries": boundaries,
        "segments": segments,
        "pages": page_records
    }
    
    # 13. JSON Generator
    json_path = generate_json_report(document_id, report_data)
    
    # 14. Excel Generator
    excel_path = generate_excel_report(document_id, page_records)
    
    return {
        "report_data": report_data,
        "json_path": str(json_path),
        "excel_path": str(excel_path)
    }

def run_pipeline(pdf_path: str, document_id: str, filename: str) -> dict:
    """
    Coordinates the full classification pipeline execution on a single PDF file (Stages 1-9 & 11-14).
    """
    # 1. PDF Splitter
    splitter = PDFSplitter(pdf_path)
    pages = splitter.split()
    
    # Instantiate 2. OCR Engine
    ocr_engine = OCREngine()
    
    page_records = []
    has_flagged_pages = False
    
    try:
        for idx, page_obj in enumerate(pages, 1):
            # 2. OCR Engine
            raw_text = ocr_engine.extract_text(page_obj)
            
            # 3. Text Preprocessing
            clean_text = preprocess_text(raw_text)
            
            # 4. Ray Parallel ADK Agents
            agent_outputs = classify_page(clean_text)
            
            # 5. Voting Engine
            winning_cat = determine_winning_category(agent_outputs)
            
            # 6. Confidence Engine
            final_conf = calculate_final_confidence(agent_outputs, winning_cat)
            
            # 7. Reason Aggregator
            agg_reasoning = aggregate_reasoning(agent_outputs, winning_cat)
            
            # 8. Confidence Threshold Checker & 9. Human Review Queue
            is_flagged = check_threshold_and_route(
                document_id=document_id,
                filename=filename,
                page_number=idx,
                document_type=winning_cat,
                confidence=final_conf,
                reasoning=agg_reasoning
            )
            
            status = "Pending Review" if is_flagged else "Processed"
            if is_flagged:
                has_flagged_pages = True
                
            page_records.append({
                "page_number": idx,
                "document_type": winning_cat,
                "confidence": final_conf,
                "reasoning": agg_reasoning,
                "status": status,
                "segment_id": None
            })
    finally:
        splitter.close()
        
    # Finalize outputs (Stages 11-14)
    return finalize_pipeline_outputs(document_id, page_records, has_flagged_pages)

def execute_override(
    document_id: str,
    page_number: int,
    selected_category: str,
    page_records: list[dict]
) -> dict:
    """
    Coordinates the human override stage (Stage 10) and regenerates report outputs (Stages 11-14).
    """
    # 10. Override Engine
    success = override_classification(document_id, page_number, selected_category)
    if not success:
        raise ValueError(f"Page {page_number} for document {document_id} not found in human review queue.")
        
    # Update classification record in-memory
    for record in page_records:
        if record["page_number"] == page_number:
            record["document_type"] = selected_category
            record["status"] = "Human Validated"
            record["confidence"] = 1.0
            
    # Recalculate if there are still any pending reviews
    has_flagged_pages = any(r["status"] == "Pending Review" for r in page_records)
    
    # Regenerate outputs (Stages 11-14)
    return finalize_pipeline_outputs(document_id, page_records, has_flagged_pages)
