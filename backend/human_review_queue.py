import json
import yaml
from pathlib import Path
from typing import List, Dict

def get_queue_file_path() -> Path:
    """
    Resolves the absolute path to queue.json based on configuration settings.
    """
    possible_paths = [
        Path("config/config.yaml"),
        Path("project2/config/config.yaml"),
        Path("../config/config.yaml")
    ]
    config_path = None
    for p in possible_paths:
        if p.exists():
            config_path = p
            break
            
    queue_dir = Path("storage/review_queue")
    if config_path:
        try:
            with open(config_path, "r") as f:
                config = yaml.safe_load(f)
                if config and "storage" in config and "review_queue_dir" in config["storage"]:
                    queue_dir = config_path.parent.parent / config["storage"]["review_queue_dir"]
        except Exception:
            pass
            
    queue_dir.mkdir(parents=True, exist_ok=True)
    return queue_dir / "queue.json"

def load_queue() -> List[Dict]:
    """
    Loads list of review entries from the JSON persistence layer.
    """
    path = get_queue_file_path()
    if not path.exists():
        return []
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_queue(queue: List[Dict]) -> None:
    """
    Saves queue data back to persistence queue.json file.
    """
    path = get_queue_file_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(queue, f, indent=2)

def add_to_queue(
    document_id: str,
    filename: str,
    page_number: int,
    document_type: str,
    confidence: float,
    reasoning: str,
    status: str = "Pending Review"
) -> None:
    """
    Adds a new page entry to the queue, or updates an existing one if the page matches.
    """
    queue = load_queue()
    
    # Overwrite if document_id and page_number combination already exists
    for item in queue:
        if item["document_id"] == document_id and item["page_number"] == page_number:
            item.update({
                "filename": filename,
                "document_type": document_type,
                "confidence": confidence,
                "reasoning": reasoning,
                "status": status
            })
            save_queue(queue)
            return
            
    entry = {
        "document_id": document_id,
        "filename": filename,
        "page_number": page_number,
        "document_type": document_type,
        "confidence": confidence,
        "reasoning": reasoning,
        "status": status
    }
    
    queue.append(entry)
    save_queue(queue)
