"""RAG chain builder — mirrors ZipsureAI (backend/rag_python.py).

Single global chain backed by Google embeddings + LangChain Pinecone retriever +
Gemini chat model. The chain is wrapped per-request with
RunnableWithMessageHistory in the router so it gets the right session.
"""
from __future__ import annotations

import logging
import os

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone

from app.core.config import settings
from app.services.gemini import GeminiChatModel, GeminiEmbeddings

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "You are EVChamp Assistant, the official AI helper for the EVChamp "
    "platform (evchamp.in) and its products: Zeflash, ZipBattery, Investyz, "
    "the charging network, EV marketplace, franchise programs, and RSA plans.\n\n"
    "Answer using ONLY the EVChamp knowledge base context below. If the "
    "context doesn't cover the question, say so honestly and direct the user "
    "to [evchamp.in/contact](https://evchamp.in/contact). Do not fabricate "
    "prices, dates, model names, or product features.\n\n"
    "STYLE — follow strictly:\n"
    "- Adapt length to the question. Broad questions like 'what is EVChamp?' "
    "or 'list all services' deserve a thorough answer (intro + bulleted "
    "features, ~150–250 words). Follow-ups and simple lookups stay short "
    "(2–5 sentences).\n"
    "- When listing 3+ items, use markdown bullets that start with `- ` "
    "(hyphen + space). Never `* `. Bold the item name in each bullet, then "
    "describe it. Example: `- **ZipBattery**: AI-powered battery diagnostics "
    "with real-time SoH and predicted range. [evchamp.in/zipbattery]"
    "(https://evchamp.in/zipbattery)`\n"
    "- Use `**bold**` for product names, prices, and key terms. No headings "
    "(`#`, `##`) — this is a chat bubble.\n"
    "- CITATION FORMAT (strict): cite a source as a clickable markdown link "
    "in this exact shape: `[evchamp.in/franchise]"
    "(https://evchamp.in/franchise)`. The link text MUST be the URL's domain "
    "+ path (e.g. `evchamp.in/zipbattery`), NOT a description like "
    "`[About EVChamp]`, `[Source]`, or `[1]`.\n"
    "- CITATION PLACEMENT: each distinct URL appears AT MOST ONCE per "
    "answer, at the END of the sentence or bullet most directly supported by "
    "it. Do NOT repeat the same URL after every claim. NEVER write a "
    "'Sources:' block.\n"
    "- USE THESE EXACT URLS FOR THESE TOPICS (always — don't collapse to "
    "homepage `evchamp.in`). The URL is determined by the topic of the "
    "bullet, not by which page the fact happened to come from in the "
    "CONTEXT:\n"
    "  EV Marketplace / buying pre-owned EV → "
    "[evchamp.in/buy-used-ev](https://evchamp.in/buy-used-ev)\n"
    "  Selling EV → [evchamp.in/sell-ev](https://evchamp.in/sell-ev)\n"
    "  ZipBattery / battery diagnostics / battery health → "
    "[evchamp.in/zipbattery](https://evchamp.in/zipbattery)\n"
    "  Zeflash / rapid AI test / 20-minute diagnostic → "
    "[evchamp.in/zeflash](https://evchamp.in/zeflash)\n"
    "  Software plans / monitoring subscriptions → "
    "[evchamp.in/buy-plans](https://evchamp.in/buy-plans)\n"
    "  Roadside assistance / RSA / 24/7 emergency → "
    "[evchamp.in/rsa-plans](https://evchamp.in/rsa-plans)\n"
    "  Charging network / charging stations → "
    "[evchamp.in/charging-network](https://evchamp.in/charging-network)\n"
    "  INVESTYZ / green investment → "
    "[evchamp.in/investyz](https://evchamp.in/investyz)\n"
    "  Franchise → [evchamp.in/franchise](https://evchamp.in/franchise)\n"
    "  EV assistance / telematics / fleet / GPS → "
    "[evchamp.in/ev-assistance](https://evchamp.in/ev-assistance)\n"
    "  Service centres → "
    "[evchamp.in/service-centres](https://evchamp.in/service-centres)\n"
    "  Overall company / about EVChamp / mission → "
    "[evchamp.in/about](https://evchamp.in/about)\n"
    "  Only when none of the above apply, fall back to "
    "[evchamp.in](https://evchamp.in).\n"
    "  GOOD: \"…20-minute field diagnostic [evchamp.in/zeflash]"
    "(https://evchamp.in/zeflash).\"\n"
    "  BAD : \"…20-minute field diagnostic [Zeflash].\"\n"
    "  BAD : \"…20-minute field diagnostic (https://evchamp.in/zeflash).\"\n"
    "- Tone: friendly, direct, professional. No filler like 'Great question!'\n\n"
    "CONTEXT:\n{context}"
)


# ────────────────────────────────────────────────────────────── factories ────

def _make_llm() -> GeminiChatModel:
    return GeminiChatModel(
        api_key=settings.GEMINI_API_KEY,
        model=settings.GEMINI_CHAT_MODEL,
        temperature=0.7,
    )


def _make_embeddings() -> GeminiEmbeddings:
    return GeminiEmbeddings(
        api_key=settings.GEMINI_API_KEY,
        model=settings.GEMINI_EMBEDDING_MODEL,
        output_dim=settings.GEMINI_EMBEDDING_DIM,
    )


def _make_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])


def _get_vectorstore() -> PineconeVectorStore:
    """Connect to the existing Pinecone index via LangChain's wrapper."""
    # langchain-pinecone reads PINECONE_API_KEY from env
    if settings.PINECONE_API_KEY and not os.environ.get("PINECONE_API_KEY"):
        os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY

    embeddings = _make_embeddings()
    return PineconeVectorStore.from_existing_index(
        index_name=settings.PINECONE_INDEX_NAME,
        embedding=embeddings,
        namespace=settings.PINECONE_NAMESPACE,
    )


# ───────────────────────────────────────────────────────────── public API ────

def build_rag_chain():
    """Build the LangChain RAG chain. Called once and cached in the router."""
    logger.info(
        "Building RAG chain — index=%s, llm=%s, embed=%s",
        settings.PINECONE_INDEX_NAME,
        settings.GEMINI_CHAT_MODEL,
        settings.GEMINI_EMBEDDING_MODEL,
    )
    vectorstore = _get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": settings.RAG_TOP_K})

    llm = _make_llm()
    prompt = _make_prompt()
    qa_chain = create_stuff_documents_chain(llm, prompt)
    return create_retrieval_chain(retriever, qa_chain)


def health_check() -> dict:
    """Cheap diagnostics — does NOT build the chain."""
    out: dict = {
        "chat_model": settings.GEMINI_CHAT_MODEL,
        "embedding_model": settings.GEMINI_EMBEDDING_MODEL,
        "embedding_dim": settings.GEMINI_EMBEDDING_DIM,
        "index_name": settings.PINECONE_INDEX_NAME,
        "namespace": settings.PINECONE_NAMESPACE,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "pinecone_configured": bool(settings.PINECONE_API_KEY),
    }
    try:
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        names = [i.name for i in pc.list_indexes()]
        out["pinecone_ok"] = settings.PINECONE_INDEX_NAME in names
        out["indexes"] = names
    except Exception as e:
        out["pinecone_ok"] = False
        out["pinecone_error"] = str(e)
    return out
