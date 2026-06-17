import yaml
from pathlib import Path
from backend.human_review_queue import add_to_queue

DEFAULT_THRESHOLD = 0.75

def check_threshold_and_route(
    document_id: str,
    filename: str,
    page_number: int,
    document_type: str,
    confidence: float,
    reasoning: str
) -> bool:
    """
    Checks if classification confidence is below the configured threshold (default 75%).
    If below threshold, routes the page details to the human review queue and returns True.
    Otherwise, returns False.
    """
    threshold = DEFAULT_THRESHOLD
    
    # Attempt to load threshold dynamically from config
    possible_paths = [
        Path("config/config.yaml"),
        Path("project2/config/config.yaml"),
        Path("../config/config.yaml")
    ]
    for p in possible_paths:
        if p.exists():
            try:
                with open(p, "r") as f:
                    config = yaml.safe_load(f)
                    if config and "classification" in config and "threshold" in config["classification"]:
                        threshold = config["classification"]["threshold"]
                        break
            except Exception:
                pass

    if confidence < threshold:
        add_to_queue(
            document_id=document_id,
            filename=filename,
            page_number=page_number,
            document_type=document_type,
            confidence=confidence,
            reasoning=reasoning,
            status="Pending Review"
        )
        return True
        
    return False
