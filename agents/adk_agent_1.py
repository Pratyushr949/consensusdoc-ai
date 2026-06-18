import os
import re
import json
import yaml
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from config.key_manager import get_api_key
from config.llm_client import run_inference

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
                    if config and "groq" in config and "model" in config["groq"]:
                        return config["groq"]["model"]
            except Exception:
                pass
    return "llama-3.3-70b-versatile"

async def classify(text: str) -> dict:
    """
    Classifies the provided text using Groq with temperature 0.00.
    Returns:
        dict: {"document_type": str, "confidence": float, "reasoning": str}
    """
    if not text.strip():
        raise ValueError("Cannot classify empty document text.")

    api_key = get_api_key("agent_1")
    model_name = load_model_name()
    
    # Execute with retry logic
    MAX_RETRIES = 3
    raw_response = None
    for attempt in range(MAX_RETRIES):
        try:
            print(f"Agent attempt {attempt+1}/{MAX_RETRIES}")
            raw_response = await asyncio.to_thread(
                run_inference,
                api_key,
                INSTRUCTION,
                text,
                model_name
            )
            if not raw_response:
                raise ValueError("Empty response received from agent")
            raw_response = raw_response.strip()
            break
        except Exception as e:
            print(f"Attempt {attempt+1} failed: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                print("Retrying in 5 seconds...")
                await asyncio.sleep(5)
            else:
                raise RuntimeError(
                    f"Agent failed after {MAX_RETRIES} attempts: {str(e)}"
                )

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
