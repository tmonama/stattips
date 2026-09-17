import os
import requests
from core.llm.base import LLMProvider


class WorkersAIProvider(LLMProvider):
    def __init__(self):
        self.account = os.environ["CF_ACCOUNT_ID"]
        self.token = os.environ["CF_API_TOKEN"]
        self.model = os.environ.get("CF_TEXT_MODEL", "@cf/meta/llama-3.1-8b-instruct")

    def generate(self, prompt):
        url = f"https://api.cloudflare.com/client/v4/accounts/{self.account}/ai/run/{self.model}"
        r = requests.post(
            url,
            headers={"Authorization": f"Bearer {self.token}"},
            json={"messages": [{"role": "user", "content": prompt}], "temperature": 0.1},
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["result"]["response"].strip()