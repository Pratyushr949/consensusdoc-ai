from backend.human_review_queue import load_queue, save_queue

def override_classification(
    document_id: str,
    page_number: int,
    selected_category: str
) -> bool:
    """
    Accepts a human selected category for a flagged page, updates the category
    and sets its status to 'Human Validated'. Persists changes back to queue.json.
    Returns:
        bool: True if the entry was found and updated, False otherwise.
    """
    queue = load_queue()
    updated = False
    
    for item in queue:
        if item["document_id"] == document_id and item["page_number"] == page_number:
            item["document_type"] = selected_category
            item["status"] = "Human Validated"
            item["confidence"] = 1.0  # Force confidence to 100% upon human validation
            updated = True
            break
            
    if updated:
        save_queue(queue)
        return True
        
    return False
