"""Ingest EVChamp web content into Pinecone — mirrors ZipsureAI's
backend/index_to_pinecone.py.

Pipeline:
  1. fetch each INGEST_URL  (httpx → fallback to Playwright for SPA pages)
  2. strip to plain text
  3. RecursiveCharacterTextSplitter -> chunks
  4. GoogleGenerativeAIEmbeddings (gemini-embedding-001, 3072-d)
  5. PineconeVectorStore.from_documents -> upsert into `evchampai`

Usage:
    cd Chatbot2.0
    python -m scripts.ingest              # incremental upsert
    python -m scripts.ingest --reset      # delete + recreate index, then upsert
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys
import time
from typing import List
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Allow `python -m scripts.ingest` from the Chatbot2.0/ root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from app.core.config import settings  # noqa: E402

from langchain_core.documents import Document  # noqa: E402
from langchain_text_splitters import RecursiveCharacterTextSplitter  # noqa: E402
from langchain_google_genai import GoogleGenerativeAIEmbeddings  # noqa: E402
from langchain_pinecone import PineconeVectorStore  # noqa: E402
from pinecone import Pinecone, ServerlessSpec  # noqa: E402


UPSERT_BATCH = 50
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 150


# ───────────────────────────────────────────────────────────── Pinecone setup

def ensure_index(pc: Pinecone, reset: bool) -> None:
    names = [i.name for i in pc.list_indexes()]
    if reset and settings.PINECONE_INDEX_NAME in names:
        print(f"Resetting index '{settings.PINECONE_INDEX_NAME}' …")
        pc.delete_index(settings.PINECONE_INDEX_NAME)
        names.remove(settings.PINECONE_INDEX_NAME)

    if settings.PINECONE_INDEX_NAME not in names:
        print(
            f"Creating index '{settings.PINECONE_INDEX_NAME}' "
            f"(dim={settings.GEMINI_EMBEDDING_DIM}, metric=cosine) …"
        )
        pc.create_index(
            name=settings.PINECONE_INDEX_NAME,
            dimension=settings.GEMINI_EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=settings.PINECONE_CLOUD,
                region=settings.PINECONE_REGION,
            ),
        )
        while not pc.describe_index(settings.PINECONE_INDEX_NAME).status["ready"]:
            time.sleep(1)
        print("  index ready.")
    else:
        print(f"Index '{settings.PINECONE_INDEX_NAME}' already exists.")


# ───────────────────────────────────────────────────────────── fetch + parse

async def fetch_via_playwright(url: str) -> str:
    """Render an SPA fully: load, wait, scroll-to-bottom, wait again, snapshot.

    Most evchamp.in pages are client-rendered React apps that lazy-mount sections
    on scroll. Without scrolling we get a 200-char shell; with scrolling we get
    the full content.
    """
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1366, "height": 900},
        )
        page = await context.new_page()
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        except Exception:
            await browser.close()
            return ""

        # Give React time to mount.
        await page.wait_for_timeout(2500)

        # Best-effort wait for network to quiet — many SPAs never reach it,
        # so don't fail if it times out.
        try:
            await page.wait_for_load_state("networkidle", timeout=8000)
        except Exception:
            pass

        # Scroll to bottom in steps to trigger lazy-loaded sections.
        try:
            await page.evaluate(
                """async () => {
                    const sleep = ms => new Promise(r => setTimeout(r, ms));
                    const step = window.innerHeight * 0.8;
                    let y = 0;
                    while (y < document.body.scrollHeight) {
                        window.scrollTo(0, y);
                        await sleep(400);
                        y += step;
                    }
                    window.scrollTo(0, document.body.scrollHeight);
                    await sleep(800);
                    window.scrollTo(0, 0);
                }"""
            )
        except Exception:
            pass

        await page.wait_for_timeout(1500)
        html = await page.content()
        await browser.close()
        return html


def _text_from_html(html: str) -> tuple[str, str]:
    """Extract a (title, plain_text) tuple from rendered HTML.

    We prefer `<main>` or the largest `<section>` when present, falling back to
    full body text. This gives Playwright-rendered SPA pages a fairer shake than
    stripping nav/footer alone.
    """
    soup = BeautifulSoup(html, "lxml")
    title = (soup.title.string if soup.title and soup.title.string else "").strip()
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    # Strip pure-chrome elements but keep their text in fallback if needed.
    for tag in soup(["header", "footer", "nav"]):
        tag.decompose()

    container = soup.find("main") or soup.find("article") or soup.body or soup
    text = " ".join(container.get_text(" ").split())
    return title, text


async def fetch_text(url: str) -> tuple[str, str]:
    """Return (title, plain_text). httpx first, Playwright for SPA shells."""
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            r = await client.get(url, headers={"User-Agent": "EVChampBot/1.0"})
            r.raise_for_status()
            html = r.text
    except Exception as e:
        print(f"  httpx failed: {e} — trying Playwright")
        html = await fetch_via_playwright(url)

    title, text = _text_from_html(html)

    if len(text) < 500:
        print(f"  thin HTML ({len(text)} chars) — retrying with Playwright")
        html = await fetch_via_playwright(url)
        title, text = _text_from_html(html)

    return title or url, text


# ───────────────────────────────────────────────────────────── ingest pipeline

async def collect_documents() -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    docs: List[Document] = []
    for url in settings.INGEST_URLS:
        print(f"Fetching {url} …")
        try:
            title, text = await fetch_text(url)
        except Exception as e:
            print(f"  skipped: {e}")
            continue
        if not text or len(text) < 100:
            print(f"  skipped: empty/too-thin ({len(text)} chars)")
            continue
        chunks = splitter.split_text(text)
        print(f"  → {len(chunks)} chunks ({len(text)} chars)")
        for i, chunk in enumerate(chunks):
            docs.append(Document(
                page_content=chunk,
                metadata={
                    "source": url,
                    "title": title,
                    "chunk_index": i,
                    "domain": urlparse(url).netloc,
                },
            ))
    return docs


async def main(reset: bool) -> None:
    if not settings.PINECONE_API_KEY:
        sys.exit("PINECONE_API_KEY missing — add it to Chatbot2.0/.env")
    if not settings.GEMINI_API_KEY:
        sys.exit("GEMINI_API_KEY missing — add it to Chatbot2.0/.env")
    os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY

    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    ensure_index(pc, reset=reset)

    docs = await collect_documents()
    if not docs:
        print("No documents — nothing to ingest.")
        return

    print(f"Embedding & upserting {len(docs)} chunks via "
          f"{settings.GEMINI_EMBEDDING_MODEL} …")
    embeddings = GoogleGenerativeAIEmbeddings(
        model=settings.GEMINI_EMBEDDING_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
    )

    for i in range(0, len(docs), UPSERT_BATCH):
        batch = docs[i:i + UPSERT_BATCH]
        PineconeVectorStore.from_documents(
            documents=batch,
            embedding=embeddings,
            index_name=settings.PINECONE_INDEX_NAME,
            namespace=settings.PINECONE_NAMESPACE,
        )
        print(f"  upserted {i + len(batch)}/{len(docs)}")
    print("Done.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete and recreate the index before ingest (destructive).",
    )
    args = parser.parse_args()
    asyncio.run(main(args.reset))
