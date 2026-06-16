import yaml
from pathlib import Path
import ray

# Import all 5 ADK agents
import agents.adk_agent_1
import agents.adk_agent_2
import agents.adk_agent_3
import agents.adk_agent_4
import agents.adk_agent_5

def load_ray_config() -> dict:
    """Loads Ray configuration from config.yaml."""
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
                    if config and "ray" in config:
                        return config["ray"]
            except Exception:
                pass
    return {}

def initialize_ray():
    """Initializes Ray if not already initialized, using config settings."""
    if not ray.is_initialized():
        ray_cfg = load_ray_config()
        address = ray_cfg.get("address", "local")
        
        if address == "local" or not address:
            ray.init(ignore_reinit_error=True)
        else:
            try:
                ray.init(address=address, ignore_reinit_error=True)
            except Exception:
                # Fallback to local execution if connecting to remote cluster fails
                ray.init(ignore_reinit_error=True)

# Define Ray remote task wrappers for the 5 agents
@ray.remote
def run_agent_1(text: str) -> dict:
    return agents.adk_agent_1.classify(text)

@ray.remote
def run_agent_2(text: str) -> dict:
    return agents.adk_agent_2.classify(text)

@ray.remote
def run_agent_3(text: str) -> dict:
    return agents.adk_agent_3.classify(text)

@ray.remote
def run_agent_4(text: str) -> dict:
    return agents.adk_agent_4.classify(text)

@ray.remote
def run_agent_5(text: str) -> dict:
    return agents.adk_agent_5.classify(text)

def classify_page(text: str) -> list:
    """
    Executes the 5 ADK agents in parallel using Ray to classify a single page of text.
    Returns:
        list: A list of dict responses from the 5 agents.
    """
    initialize_ray()

    # Launch Ray remote tasks in parallel
    futures = [
        run_agent_1.remote(text),
        run_agent_2.remote(text),
        run_agent_3.remote(text),
        run_agent_4.remote(text),
        run_agent_5.remote(text)
    ]

    # Resolve and return all results synchronously (blocking until all complete)
    try:
        return ray.get(futures)
    except Exception as e:
        raise RuntimeError(f"Error during parallel Ray execution of classification agents: {str(e)}")
