import json
import yaml
from pathlib import Path

def get_json_dir() -> Path:
    """
    Resolves absolute path to json directory based on yaml configurations.
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
            
    json_dir = Path("storage/json")
    if config_path:
        try:
            with open(config_path, "r") as f:
                config = yaml.safe_load(f)
                if config and "storage" in config and "json_dir" in config["storage"]:
                    json_dir = config_path.parent.parent / config["storage"]["json_dir"]
        except Exception:
            pass
            
    json_dir.mkdir(parents=True, exist_ok=True)
    return json_dir

def generate_json_report(document_id: str, report_data: dict) -> Path:
    """
    Serializes and saves the final classification pipeline output as a JSON file.
    Returns:
        Path: Path to the generated JSON report.
    """
    json_dir = get_json_dir()
    file_path = json_dir / f"{document_id}.json"
    
    with open(file_path, "w") as f:
        json.dump(report_data, f, indent=2)
        
    return file_path
