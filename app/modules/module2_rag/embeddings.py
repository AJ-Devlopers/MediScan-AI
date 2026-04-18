import requests
import os
import time
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.getenv("HF_API_KEY")
API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
headers = {"Authorization": f"Bearer {HF_API_KEY}"}

print(f"[embeddings] HF_API_KEY loaded: {'YES' if HF_API_KEY else 'NO — KEY MISSING!'}")

def embed_text(text: str):
    for attempt in range(5):
        try:
            response = requests.post(
                API_URL,
                headers=headers,
                json={"inputs": text},
                timeout=30
            )

            # Empty body — model cold starting or auth failure
            if not response.text.strip():
                print(f"[embed_text] Empty response, status={response.status_code}, attempt {attempt+1}. Retrying...")
                time.sleep(5)
                continue

            data = response.json()

            # Model still loading
            if isinstance(data, dict) and "error" in data:
                if "loading" in data["error"].lower():
                    wait = float(data.get("estimated_time", 5))
                    print(f"[embed_text] Model loading, waiting {wait}s...")
                    time.sleep(wait)
                    continue
                raise Exception(f"HuggingFace error: {data['error']}")

            # ✅ HF returns [[0.1, 0.2, ...]] — unwrap to flat list
            if isinstance(data, list) and len(data) > 0:
                if isinstance(data[0], list):
                    return data[0]   # unwrap outer list
                return data          # already flat

            raise Exception(f"Unexpected embedding format: {type(data)} — {str(data)[:200]}")

        except requests.exceptions.Timeout:
            print(f"[embed_text] Timeout on attempt {attempt+1}, retrying...")
            time.sleep(3)

    raise Exception("HuggingFace model not ready after 5 attempts. Check HF_API_KEY.")