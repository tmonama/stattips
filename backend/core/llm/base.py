from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt, max_tokens=512):
        ...