import os
from core.llm.ollama_provider import OllamaProvider
from core.llm.workersai_provider import WorkersAIProvider

_PROVIDERS = {"ollama": OllamaProvider, "workersai": WorkersAIProvider}


def get_provider():
    return _PROVIDERS[os.environ.get("LLM_PROVIDER", "ollama")]()