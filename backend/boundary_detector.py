def detect_boundaries(page_classifications: list[dict]) -> list[dict]:
    """
    Analyzes page classifications (which must contain 'page_number' and 'document_type')
    and detects transitions where the document type changes between consecutive pages.
    Returns:
        list[dict]: A list of boundaries, each containing:
            - 'boundary_after_page': page number after which transition occurs
            - 'boundary_before_page': page number of the next document segment start
            - 'transition': transition description (e.g. 'invoice -> bank_statement')
    """
    boundaries = []
    if len(page_classifications) < 2:
        return boundaries
        
    # Sort pages by page_number to ensure correct sequential evaluation
    sorted_pages = sorted(page_classifications, key=lambda p: p.get("page_number", 0))
    
    for i in range(len(sorted_pages) - 1):
        current_page = sorted_pages[i]
        next_page = sorted_pages[i + 1]
        
        current_type = current_page.get("document_type")
        next_type = next_page.get("document_type")
        
        if current_type != next_type:
            boundaries.append({
                "boundary_after_page": current_page.get("page_number"),
                "boundary_before_page": next_page.get("page_number"),
                "transition": f"{current_type} -> {next_type}"
            })
            
    return boundaries
