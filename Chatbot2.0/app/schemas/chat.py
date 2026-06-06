"""Request / response schemas — match ZipsureAI's contract.

GET  /python_api/chatbot  -> ChatbotResponse { session_id }
POST /python_api/ask      -> AskResponse    { session_id, question, response }
"""
from typing import Optional
from pydantic import BaseModel, Field


class ChatbotResponse(BaseModel):
    session_id: str


class AskRequest(BaseModel):
    question: str = Field(..., description="The user's question")
    session_id: Optional[str] = Field(
        default=None,
        description="Existing session id; if absent a new one is created.",
    )


class AskResponse(BaseModel):
    session_id: str
    question: str
    response: str
