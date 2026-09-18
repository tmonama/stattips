import os
import requests
from core.llm.base import LLMProvider


class OllamaProvider(LLMProvider):
    def __init__(self):
        self.host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
        self.model = os.environ.get("OLLAMA_MODEL", "qwen2.5:3b-instruct-q4_K_M")
        self.timeout = int(os.environ.get("OLLAMA_TIMEOUT", "300"))

    def generate(self, prompt, max_tokens=512):
        r = requests.post(
            f"{self.host}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {"num_ctx": 4096, "temperature": 0.1, "num_predict": max_tokens},
            },
            timeout=self.timeout,
        )
        r.raise_for_status()
        return r.json()["response"].strip()