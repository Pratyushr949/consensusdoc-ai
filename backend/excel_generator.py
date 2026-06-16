import yaml
import pandas as pd
from pathlib import Path

def get_excel_dir() -> Path:
    """
    Resolves absolute path to excel directory based on yaml configurations.
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
            
    excel_dir = Path("storage/excel")
    if config_path:
        try:
            with open(config_path, "r") as f:
                config = yaml.safe_load(f)
                if config and "storage" in config and "excel_dir" in config["storage"]:
                    excel_dir = config_path.parent.parent / config["storage"]["excel_dir"]
        except Exception:
            pass
            
    excel_dir.mkdir(parents=True, exist_ok=True)
    return excel_dir

def generate_excel_report(document_id: str, page_records: list[dict]) -> Path:
    """
    Generates and saves the classification results to Excel format using pandas + openpyxl.
    Columns exported: page_number, document_type, confidence, reasoning, status, segment_id.
    Returns:
        Path: Path to the generated Excel report.
    """
    excel_dir = get_excel_dir()
    file_path = excel_dir / f"{document_id}.xlsx"
    
    # Define exact columns in the specified ordering
    columns = [
        "page_number",
        "document_type",
        "confidence",
        "reasoning",
        "status",
        "segment_id"
    ]
    
    # Process actual pipeline outputs without placeholders
    rows = []
    for p in page_records:
        rows.append({
            "page_number": p.get("page_number"),
            "document_type": p.get("document_type"),
            "confidence": p.get("confidence", 0.0),
            "reasoning": p.get("reasoning", ""),
            "status": p.get("status", "Processed"),
            "segment_id": p.get("segment_id")
        })
        
    df = pd.DataFrame(rows, columns=columns)
    
    # Write using openpyxl engine
    df.to_excel(file_path, index=False, engine="openpyxl")
    
    return file_path
