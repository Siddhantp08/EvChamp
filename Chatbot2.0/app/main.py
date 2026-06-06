from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.v1 import chat

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount under /python_api to mirror ZipsureAI route layout:
#   GET  /python_api/chatbot
#   POST /python_api/ask
#   GET  /python_api/health/llm
app.include_router(chat.router, prefix=settings.API_V1_STR, tags=["chat"])


@app.get("/")
async def root():
    return {
        "message": "EVChamp Chatbot API",
        "version": settings.PROJECT_VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
    }
