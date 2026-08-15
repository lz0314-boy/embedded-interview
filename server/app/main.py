from __future__ import annotations

from typing import Annotated

from fastapi import Depends, FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .auth import verify_access_token
from .config import Settings, get_settings
from .knowledge import load_knowledge
from .openai_client import stream_chat
from .retrieval import BM25Index
from .schemas import ChatRequest, SearchRequest, SearchResult


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    documents = load_knowledge(settings.public_knowledge_path, settings.private_knowledge_path)
    index = BM25Index(documents)

    app = FastAPI(
        title="Embedded Interview AI",
        version="1.0.0",
        docs_url=None,
        redoc_url=None,
    )
    app.state.settings = settings
    app.state.knowledge_index = index
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins(),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-Assistant-Token"],
    )

    def authorize(
        x_assistant_token: Annotated[str | None, Header()] = None,
    ) -> None:
        verify_access_token(x_assistant_token, settings)

    @app.get("/health")
    def health() -> dict:
        return {
            "status": "ok",
            "knowledgeCount": len(documents),
            "aiConfigured": bool(
                settings.openai_api_key and settings.openai_api_key.get_secret_value()
            ),
        }

    @app.post(
        "/v1/knowledge/search",
        response_model=list[SearchResult],
        dependencies=[Depends(authorize)],
    )
    def search(request: SearchRequest) -> list[SearchResult]:
        return [
            SearchResult(
                id=hit.document.id,
                title=hit.document.title,
                category=hit.document.category,
                snippet=hit.snippet,
                score=hit.score,
                source_type=hit.document.source_type,
                status=hit.document.status,
            )
            for hit in index.search(request.query, request.limit)
        ]

    @app.post("/v1/chat", dependencies=[Depends(authorize)])
    def chat(request: ChatRequest) -> StreamingResponse:
        hits = index.search(request.message, settings.retrieval_limit)
        return StreamingResponse(
            stream_chat(settings, request, hits),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "X-Accel-Buffering": "no",
            },
        )

    return app


app = create_app()
