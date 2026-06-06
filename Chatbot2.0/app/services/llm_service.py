"""Placeholder — RAG logic now lives in app.services.rag_service.

The router (app/routers/v1/chat.py) imports build_rag_chain and health_check
from rag_service directly. This module is kept only to avoid breaking any
old imports.
"""
from app.services.rag_service import build_rag_chain, health_check  # noqa: F401
