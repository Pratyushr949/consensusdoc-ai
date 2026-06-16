import os
import re
import json
import yaml
from pathlib import Path
from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai import types
import uuid
from dotenv import load_dotenv
load_dotenv()

INSTRUCTION = """You are an intelligent document classification agent. Your task is to analyze the provided text extracted from a single document page and classify it into exactly one of the following categories:
- invoice
- bank_statement
- aadhaar
- pan_card
- passport
- insurance_document

You must return your classification result as a JSON object with the following fields:
1. "document_type": The classification category (must be exactly one of the six categories above).
2. "confidence": A float value between 0.0 and 1.0 representing your classification confidence.
3. "reasoning": A brief explanation justifying your classification decision.

Output must be valid JSON matching this schema. Do not include markdown code blocks or extra text outside the JSON."""

def load_model_name() -> str:
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
                    if config and "gemini" in config and "model" in config["gemini"]:
                        return config["gemini"]["model"]
            except Exception:
                pass
    return "gemini-2.5-flash"

async def classify(text: str) -> dict:
    """
    Classifies the provided text using a Google ADK Agent with temperature 0.10.
    Returns:
        dict: {"document_type": str, "confidence": float, "reasoning": str}
    """
    if not text.strip():
        raise ValueError("Cannot classify empty document text.")

    model_name = load_model_name()
    
    # Configure the agent
    generate_content_config = types.GenerateContentConfig(
        temperature=0.10,
        response_mime_type="application/json"
    )
    
    agent = Agent(
        name="adk_agent_3",
        model=model_name,
        instruction=INSTRUCTION,
        generate_content_config=generate_content_config
    )
    
    # Initialize runner and session
    session_service = InMemorySessionService()
    runner = Runner(
        app_name="consensus_doc_ai",
        agent=agent,
        session_service=session_service
    )
    
    # Create the user message
    user_message = types.Content(
        role="user",
        parts=[types.Part(text=text)]
    )
    session_id = str(uuid.uuid4())

    print("Creating session")

    await session_service.create_session(
        app_name="consensus_doc_ai",
        user_id="system",
        session_id=session_id
    )

    # Execute the runner
    try:
        events = runner.run_async(
            user_id="system",
            session_id=session_id,
            new_message=user_message
        )
        
        text_parts = []

        async for event in events:

            if event.content:

                if event.content.parts:

                    for part in event.content.parts:

                        if hasattr(part, "text") and part.text:
                            text_parts.append(part.text)

        raw_response = "".join(text_parts).strip()

        if not raw_response:
            raise ValueError("Empty response received from the agent.")
    except Exception as e:
        raise RuntimeError(f"Agent execution failed: {str(e)}")
                    
    # Parse and validate response
    clean_text = raw_response
    if clean_text.startswith("```"):
        clean_text = re.sub(r"^```(?:json)?\n", "", clean_text)
        clean_text = re.sub(r"\n```$", "", clean_text)
    clean_text = clean_text.strip()
    
    try:
        data = json.loads(clean_text)
        doc_type = data.get("document_type", "").strip().lower()
        confidence = float(data.get("confidence", 0.0))
        reasoning = data.get("reasoning", "").strip()
        
        allowed_categories = {
            "invoice", "bank_statement", "aadhaar",
            "pan_card", "passport", "insurance_document"
        }
        if doc_type not in allowed_categories:
            raise ValueError(f"Invalid document type returned: {doc_type}")
            
        return {
            "document_type": doc_type,
            "confidence": min(max(confidence, 0.0), 1.0),
            "reasoning": reasoning
        }
    except Exception as e:
        raise ValueError(f"Failed to parse or validate LLM JSON response: {str(e)}. Raw response: {raw_response}")
