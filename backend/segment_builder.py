def build_segments(page_classifications: list[dict]) -> list[dict]:
    """
    Groups consecutive pages sharing the same document type into document segments.
    Returns:
        list[dict]: A list of document segments, each containing:
            - 'segment_id': sequential ID of the segment
            - 'document_type': category of the segment
            - 'pages': list of sorted page numbers in this segment
            - 'start_page': starting page number of the segment
            - 'end_page': ending page number of the segment
            - 'average_confidence': mean confidence score of pages in this segment
    """
    segments = []
    if not page_classifications:
        return segments
        
    # Sort pages by page_number to ensure correct sequential grouping
    sorted_pages = sorted(page_classifications, key=lambda p: p.get("page_number", 0))
    
    current_segment = None
    segment_counter = 1
    
    for page in sorted_pages:
        page_num = page.get("page_number")
        doc_type = page.get("document_type")
        confidence = page.get("confidence", 0.0)
        
        if current_segment is None:
            # Start the very first segment
            current_segment = {
                "segment_id": segment_counter,
                "document_type": doc_type,
                "pages": [page_num],
                "start_page": page_num,
                "end_page": page_num,
                "confidences": [confidence]
            }
        elif doc_type == current_segment["document_type"]:
            # Extend current segment with consecutive page of same type
            current_segment["pages"].append(page_num)
            current_segment["end_page"] = page_num
            current_segment["confidences"].append(confidence)
        else:
            # Finalize the completed segment
            current_segment["average_confidence"] = sum(current_segment["confidences"]) / len(current_segment["confidences"])
            del current_segment["confidences"]
            segments.append(current_segment)
            
            # Initialize next segment
            segment_counter += 1
            current_segment = {
                "segment_id": segment_counter,
                "document_type": doc_type,
                "pages": [page_num],
                "start_page": page_num,
                "end_page": page_num,
                "confidences": [confidence]
            }
            
    # Finalize and append the last segment in the sequence
    if current_segment:
        current_segment["average_confidence"] = sum(current_segment["confidences"]) / len(current_segment["confidences"])
        del current_segment["confidences"]
        segments.append(current_segment)
        
    return segments
