from groq import Groq

def create_client(api_key: str) -> Groq:
    """Creates and returns a Groq API client instance."""
    return Groq(api_key=api_key)

def run_inference(api_key: str, instruction: str, text: str, model: str = "llama-3.3-70b-versatile") -> str:
    """
    Runs chat completion using Groq and the llama-3.3-70b-versatile model.
    Temperature is set to 0.
    """
    client = create_client(api_key)
    response = client.chat.completions.create(
        model=model,
        temperature=0,
        messages=[
            {"role": "system", "content": instruction},
            {"role": "user", "content": text}
        ]
    )
    return response.choices[0].message.content
