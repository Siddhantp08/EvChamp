import os
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings.

    Only secrets come from .env (GEMINI_API_KEY, PINECONE_API_KEY).
    All other configuration is hardcoded here.

    Architecture mirrors ZipsureAI: LangChain RAG chain, Google embeddings,
    Pinecone vector store, in-memory session history.
    """

    # ---------- API ----------
    API_V1_STR: str = "/python_api"      # Mirror ZipsureAI route prefix
    PROJECT_NAME: str = "EV Champ API"
    PROJECT_DESCRIPTION: str = "RAG-powered chatbot for EVChamp"
    PROJECT_VERSION: str = "0.2.0"

    # ---------- CORS ----------
    CORS_ORIGINS: List[str] = ["*"]

    # ---------- Gemini (LLM + embeddings) ----------
    # Secret — required, must come from .env
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    # ZipsureAI uses gemini-3-flash-preview; we default to the stable 2.5-flash
    # — swap if the preview model is GA in your account.
    GEMINI_CHAT_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    GEMINI_EMBEDDING_DIM: int = 3072

    # ---------- Pinecone ----------
    # Secret — required, must come from .env
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = "evchampai"   # new 3072-d index
    PINECONE_CLOUD: str = "aws"
    PINECONE_REGION: str = "us-east-1"
    PINECONE_NAMESPACE: str = "default"
    # Higher TOP_K so the model sees content from multiple product pages
    # (battery, investyz, rsa, franchise, etc.) and can cite each with its
    # own URL instead of collapsing every claim to `evchamp.in/about`.
    RAG_TOP_K: int = 10

    # ---------- Session memory (mirrors ZipsureAI _session_cache) ----------
    SESSION_TTL_SECONDS: int = 60 * 60   # 1 hour

    # ---------- Sources for ingestion ----------
    # Order matters loosely (earlier = higher recall priority on duplicate
    # content). Includes ZipSureAI sites since Gemini cited them heavily.
    INGEST_URLS: List[str] = [
        # EVChamp marketing pages
        "https://www.evchamp.in",
        "https://evchamp.in/",
        "https://evchamp.in/about",
        "https://evchamp.in/investyz",
        "https://evchamp.in/zipbattery",
        "https://evchamp.in/zeflash",
        "https://evchamp.in/charging-network",
        "https://evchamp.in/buy-plans",
        "https://evchamp.in/buy-used-ev",
        "https://evchamp.in/sell-ev",
        "https://evchamp.in/franchise",
        "https://evchamp.in/ev-assistance",
        "https://evchamp.in/rsa-plans",
        "https://evchamp.in/service-centres",
        "https://evchamp.in/contact",
        # Sister products / parent
        "https://www.zeflash.app",
        "https://zeflash.app/",
        "https://zipsureai.com/",
        "https://www.zipsureai.com/",
        "https://insights.zipsureai.com/",
        "https://insights.zipsureai.com/stations",
        "https://insights.zipsureai.com/dashboard",
    ]

    # ---------- Security ----------
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Legacy / optional — kept so old .env files don't error
    GROQ_API_KEY: Optional[str] = None
    LLM_PROVIDER: Optional[str] = None
    LLM_MODEL_NAME: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    AWS_REGION: Optional[str] = None
    RAG_MODEL_NAME: Optional[str] = None
    CHAT_MODEL_NAME: Optional[str] = None

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
