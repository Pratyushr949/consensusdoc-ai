import os
from dotenv import load_dotenv

load_dotenv()

API_KEYS = {
    "agent_1": os.getenv("GROQ_API_KEY_1"),
    "agent_2": os.getenv("GROQ_API_KEY_2"),
    "agent_3": os.getenv("GROQ_API_KEY_3"),
    "agent_4": os.getenv("GROQ_API_KEY_4"),
    "agent_5": os.getenv("GROQ_API_KEY_5"),
}


def get_api_key(agent_name: str):
    key = API_KEYS.get(agent_name)

    if not key:
        raise ValueError(f"No API key found for {agent_name}")

    return key
