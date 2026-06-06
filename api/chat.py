"""Vercel Python Serverless Function — entry for the EVChamp chatbot.

Vercel routes /api/v1/chat/* to this file (see rewrites in vercel.json).
The original request path is preserved, so FastAPI's routes under
/api/v1/chat/... match directly.
"""
import os
import sys

# Make Chatbot2.0/ importable (its `app/` package lives there, packaged via
# vercel.json `functions.includeFiles`).
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_CHATBOT_DIR = os.path.abspath(os.path.join(_THIS_DIR, "..", "Chatbot2.0"))
if _CHATBOT_DIR not in sys.path:
    sys.path.insert(0, _CHATBOT_DIR)

from app.main import app  # noqa: E402  ASGI app for Vercel's Python runtime
