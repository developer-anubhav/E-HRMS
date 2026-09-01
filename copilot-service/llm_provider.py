import json
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import httpx
from config import settings

logger = logging.getLogger("copilot.llm")

SYSTEM_PROMPT = """You are the Vektra AI Co-Pilot, an enterprise HR intelligence assistant for Vektra E-HRMS.

NON-NEGOTIABLE OPERATING DIRECTIVES:
1. Answer ONLY using the official Company Documentation provided below.
2. If the provided context does not contain sufficient facts to answer the question completely, you MUST state: "This information is not available in official records."
3. NEVER speculate, guess, hallucinate, or use external knowledge beyond the provided documents.
4. Always cite your sources with document name, page number, and section.
5. Maintain a professional, concise HR tone."""

NOT_AVAILABLE_FALLBACK = "This information is not available in official records."

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        pass

    def build_prompt(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        context_parts = []
        for i, chunk in enumerate(retrieved_chunks):
            doc = chunk.get("source_doc", "Document")
            page = chunk.get("page_number", 1)
            sec = chunk.get("section", "General")
            text = chunk.get("content", "")
            context_parts.append(
                f"[Source {i+1}: {doc}, Page {page}, Section: '{sec}']\n{text}"
            )

        context_str = "\n\n".join(context_parts) if context_parts else "No company documentation found."

        history_str = ""
        if conversation_history:
            lines = []
            for msg in conversation_history[-5:]:
                r = msg.get("role", "user")
                c = msg.get("content", "")
                lines.append(f"{r.capitalize()}: {c}")
            history_str = "\nConversation History:\n" + "\n".join(lines)

        prompt = f"""{SYSTEM_PROMPT}

=== PROVIDED COMPANY DOCUMENTATION ===
{context_str}
======================================
{history_str}

User Question: {query}

Answer:"""
        return prompt

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL or "gemini-1.5-flash"
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

    async def generate_response(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        if not retrieved_chunks:
            return {
                "answer": NOT_AVAILABLE_FALLBACK,
                "citations": [],
                "grounded": False,
                "provider": "gemini",
            }

        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not configured. Falling back to grounded synthesizer.")
            return FallbackProvider().generate_grounded_fallback(query, retrieved_chunks)

        prompt = self.build_prompt(query, retrieved_chunks, conversation_history)
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 800},
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(self.api_url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        text = "".join(p.get("text", "") for p in content_parts).strip()
                        citations = [
                            {
                                "document": c.get("source_doc"),
                                "source_doc": c.get("source_doc"),
                                "page": c.get("page_number", 1),
                                "page_number": c.get("page_number", 1),
                                "section": c.get("section", "General"),
                            }
                            for c in retrieved_chunks
                        ]
                        return {
                            "answer": text or NOT_AVAILABLE_FALLBACK,
                            "citations": citations,
                            "grounded": True,
                            "provider": "gemini",
                        }
                logger.error(f"Gemini API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")

        return FallbackProvider().generate_grounded_fallback(query, retrieved_chunks)

class OllamaProvider(BaseLLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL or "llama3"

    async def generate_response(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        if not retrieved_chunks:
            return {
                "answer": NOT_AVAILABLE_FALLBACK,
                "citations": [],
                "grounded": False,
                "provider": "ollama",
            }

        prompt = self.build_prompt(query, retrieved_chunks, conversation_history)
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1},
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(f"{self.base_url}/api/generate", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data.get("response", "").strip()
                    citations = [
                        {
                            "document": c.get("source_doc"),
                            "source_doc": c.get("source_doc"),
                            "page": c.get("page_number", 1),
                            "page_number": c.get("page_number", 1),
                            "section": c.get("section", "General"),
                        }
                        for c in retrieved_chunks
                    ]
                    return {
                        "answer": text or NOT_AVAILABLE_FALLBACK,
                        "citations": citations,
                        "grounded": True,
                        "provider": "ollama",
                    }
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")

        return FallbackProvider().generate_grounded_fallback(query, retrieved_chunks)

class FallbackProvider(BaseLLMProvider):
    """
    Deterministic grounded fallback provider when external LLM endpoints are unreachable/unconfigured.
    """
    async def generate_response(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        return self.generate_grounded_fallback(query, retrieved_chunks)

    def generate_grounded_fallback(self, query: str, retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not retrieved_chunks:
            return {
                "answer": NOT_AVAILABLE_FALLBACK,
                "citations": [],
                "grounded": False,
                "provider": "fallback",
            }

        citations = [
            {
                "document": c.get("source_doc"),
                "source_doc": c.get("source_doc"),
                "page": c.get("page_number", 1),
                "page_number": c.get("page_number", 1),
                "section": c.get("section", "General"),
            }
            for c in retrieved_chunks
        ]

        top_chunk = retrieved_chunks[0]
        summary = (
            f"Based on {top_chunk.get('source_doc')} (Page {top_chunk.get('page_number', 1)}, "
            f"Section: '{top_chunk.get('section', 'General')}'): {top_chunk.get('content')}"
        )

        return {
            "answer": summary,
            "citations": citations,
            "grounded": True,
            "provider": "grounded_synthesizer",
        }

def get_llm_provider() -> BaseLLMProvider:
    provider_name = settings.LLM_PROVIDER.lower()
    if provider_name == "ollama":
        return OllamaProvider()
    elif provider_name == "gemini":
        return GeminiProvider()
    return FallbackProvider()
