"""Chatbot router — mirrors ZipsureAI's session-based API.

Endpoints:
  GET  /chatbot          -> create a session and return its id
  POST /ask              -> answer a question using RAG + per-session memory
  GET  /health/llm       -> diagnostics

Server-side session memory lives in `_session_cache` with a 1h TTL — exactly
like ZipboltDash/backend/main.py. On Vercel serverless, instances are reused
opportunistically (Fluid Compute) so this is best-effort; clients should
persist their `session_id` and resend it on every /ask to maximize hit rate.
"""
from __future__ import annotations

import logging
import time
import traceback
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

from app.core.config import settings
from app.schemas.chat import AskRequest, AskResponse, ChatbotResponse
from app.services.rag_service import build_rag_chain, health_check

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────────────── module-level caches

_rag_chain = None  # built lazily on first /ask, then reused
_session_cache: dict[str, dict] = {}  # session_id -> {history, last_access}


def _get_chain():
    global _rag_chain
    if _rag_chain is None:
        _rag_chain = build_rag_chain()
    return _rag_chain


def get_or_create_history(session_id: str) -> ChatMessageHistory:
    now = time.time()
    if session_id in _session_cache:
        _session_cache[session_id]["last_access"] = now
        return _session_cache[session_id]["history"]
    history = ChatMessageHistory()
    _session_cache[session_id] = {"history": history, "last_access": now}
    return history


def evict_expired_sessions() -> None:
    cutoff = time.time() - settings.SESSION_TTL_SECONDS
    expired = [sid for sid, v in _session_cache.items() if v["last_access"] < cutoff]
    for sid in expired:
        del _session_cache[sid]
    if expired:
        logger.info("Evicted %d expired session(s)", len(expired))


# ───────────────────────────────────────────────────────────────── routes

@router.get("/chatbot", response_model=ChatbotResponse)
@router.get("/chatbot/", response_model=ChatbotResponse)
async def create_session():
    """Create a new conversational session and return its id."""
    try:
        session_id = str(uuid4())
        get_or_create_history(session_id)
        logger.info("Created session %s", session_id)
        return ChatbotResponse(session_id=session_id)
    except Exception as e:
        logger.exception("Failed to create session")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask", response_model=AskResponse)
async def ask_question(req: AskRequest):
    """Answer a question with RAG + session memory (mirrors ZipsureAI /ask)."""
    evict_expired_sessions()

    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="question required")

    session_id = req.session_id or str(uuid4())

    try:
        chain = _get_chain()
    except Exception:
        logger.exception("RAG chain init failed")
        raise HTTPException(status_code=500, detail="Failed to initialize AI context.")

    history = get_or_create_history(session_id)

    conversational_chain = RunnableWithMessageHistory(
        chain,
        lambda _sid: history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

    try:
        response = conversational_chain.invoke(
            {"input": question},
            {"configurable": {"session_id": session_id}},
        )
        answer = response.get("answer", "No response available.")
        return AskResponse(
            session_id=session_id,
            question=question,
            response=answer,
        )
    except Exception as e:
        logger.exception("Chain invoke failed")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/llm")
async def check_llm_health():
    """Cheap health endpoint — doesn't build the chain."""
    try:
        h = health_check()
        h["chain_built"] = _rag_chain is not None
        h["active_sessions"] = len(_session_cache)
        h["status"] = (
            "healthy"
            if h.get("gemini_configured") and h.get("pinecone_ok")
            else "degraded"
        )
        return h
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
