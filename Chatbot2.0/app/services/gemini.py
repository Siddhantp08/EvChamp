"""Minimal LangChain wrappers around the slim `google-genai` SDK.

Replaces `langchain-google-genai`, which pulls in `google-generativeai` +
`grpcio` + protobufs (~200 MB), with a thin layer over `google-genai`
(~5 MB). Plugs into `create_stuff_documents_chain` and `PineconeVectorStore`
unchanged.

Two classes:
- GeminiEmbeddings  -> implements langchain_core.embeddings.Embeddings
- GeminiChatModel   -> implements langchain_core.language_models.BaseChatModel
"""
from __future__ import annotations

from typing import Any, List, Optional, Tuple

from google import genai
from google.genai import types as genai_types

from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
)
from langchain_core.outputs import ChatGeneration, ChatResult


# ─────────────────────────────────────────────────────────── Embeddings ─────

class GeminiEmbeddings(Embeddings):
    """Embeddings using google-genai's `models.embed_content`.

    Document embeddings use task_type="RETRIEVAL_DOCUMENT"; query embeddings
    use task_type="RETRIEVAL_QUERY" — same convention `langchain-google-genai`
    uses, so vectors in Pinecone stay compatible.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "models/gemini-embedding-001",
        output_dim: int = 3072,
        batch_size: int = 100,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._output_dim = output_dim
        self._batch_size = batch_size

    def _embed(self, texts: List[str], task_type: str) -> List[List[float]]:
        client = genai.Client(api_key=self._api_key)
        cfg = genai_types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=self._output_dim,
        )
        out: List[List[float]] = []
        for i in range(0, len(texts), self._batch_size):
            batch = texts[i:i + self._batch_size]
            resp = client.models.embed_content(
                model=self._model,
                contents=batch,
                config=cfg,
            )
            for e in resp.embeddings:
                out.append(list(e.values))
        return out

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self._embed(list(texts), "RETRIEVAL_DOCUMENT")

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text], "RETRIEVAL_QUERY")[0]


# ─────────────────────────────────────────────────────────── Chat model ─────

class GeminiChatModel(BaseChatModel):
    """Chat model wrapping `google-genai.models.generate_content`.

    Maps LangChain SystemMessage/HumanMessage/AIMessage into the genai
    `Content`/`Part` shape, hands off to Gemini, and returns the text wrapped
    in a `ChatResult`. Single non-streaming call — sufficient for the RAG
    chain `create_stuff_documents_chain` builds.
    """

    api_key: str
    model: str = "gemini-2.5-flash"
    temperature: float = 0.7
    max_output_tokens: int = 2048

    @property
    def _llm_type(self) -> str:
        return "gemini-direct"

    @staticmethod
    def _to_genai(
        messages: List[BaseMessage],
    ) -> Tuple[Optional[str], List[genai_types.Content]]:
        system: Optional[str] = None
        contents: List[genai_types.Content] = []
        for m in messages:
            text = str(m.content)
            if isinstance(m, SystemMessage):
                system = f"{system}\n\n{text}" if system else text
            elif isinstance(m, HumanMessage):
                contents.append(genai_types.Content(
                    role="user",
                    parts=[genai_types.Part(text=text)],
                ))
            elif isinstance(m, AIMessage):
                contents.append(genai_types.Content(
                    role="model",
                    parts=[genai_types.Part(text=text)],
                ))
            # Other roles (Function/Tool) are unused in our RAG flow.
        return system, contents

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        system, contents = self._to_genai(messages)
        cfg = genai_types.GenerateContentConfig(
            system_instruction=system,
            temperature=self.temperature,
            max_output_tokens=self.max_output_tokens,
            stop_sequences=stop or None,
        )
        client = genai.Client(api_key=self.api_key)
        resp = client.models.generate_content(
            model=self.model,
            contents=contents,
            config=cfg,
        )
        text = (resp.text or "").strip()
        return ChatResult(
            generations=[ChatGeneration(message=AIMessage(content=text))]
        )
