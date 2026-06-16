import os
import sys
import yaml
from pathlib import Path
import uvicorn
import ray
from dotenv import load_dotenv

load_dotenv()
def validate_folders(config: dict) -> None:
    """
    Validates and creates storage folders required by the classification pipeline.
    """
    storage_cfg = config.get("storage", {})
    required_folders = [
        storage_cfg.get("uploads_dir", "storage/uploads"),
        storage_cfg.get("json_dir", "storage/json"),
        storage_cfg.get("excel_dir", "storage/excel"),
        storage_cfg.get("review_queue_dir", "storage/review_queue")
    ]
    
    for folder_name in required_folders:
        folder_path = Path(folder_name)
        if not folder_path.exists():
            print(f"[INIT] Creating folder: {folder_path.resolve()}")
            folder_path.mkdir(parents=True, exist_ok=True)
        else:
            print(f"[INIT] Verified folder: {folder_path.resolve()}")

def validate_adk_config() -> None:
    """
    Validates Google ADK environment keys.
    """
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("[WARNING] Neither GEMINI_API_KEY nor GOOGLE_API_KEY found in the environment variables.")
        print("[WARNING] Google ADK Agent classification calls will fail without API authorization.")
    else:
        print("[INIT] Google ADK authorization keys present.")

def main() -> None:
    """
    Main entry point for local project run.
    """
    config_path = Path("config/config.yaml")
    if not config_path.exists():
        print(f"[ERROR] Configuration file not found at: {config_path.resolve()}")
        sys.exit(1)
        
    try:
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load config.yaml: {str(e)}")
        sys.exit(1)

    print("=" * 60)
    print("ConsensusDoc AI Local Entrypoint Initialization")
    print("=" * 60)
    
    # 1. Check/create storage directories
    validate_folders(config)
    
    # 2. Validate Google ADK config
    validate_adk_config()
    
    # 3. Initialize Ray Cluster
    print("[INIT] Spinning up local Ray cluster...")
    ray_cfg = config.get("ray", {})
    address = ray_cfg.get("address", "local")
    try:
        if address == "local" or not address:
            ray.init(ignore_reinit_error=True)
        else:
            ray.init(address=address, ignore_reinit_error=True)
        print("[INIT] Ray cluster initialized successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to spin up Ray cluster: {str(e)}")
        sys.exit(1)
        
    # 4. Start backend server using uvicorn
    print("[INIT] Starting FastAPI backend server on 127.0.0.1:8000...")
    try:
        # Start server synchronously
        uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Keyboard interrupt received.")
    finally:
        print("[SHUTDOWN] Shutting down Ray...")
        ray.shutdown()
        print("[SHUTDOWN] Clean exit completed.")

if __name__ == "__main__":
    main()
