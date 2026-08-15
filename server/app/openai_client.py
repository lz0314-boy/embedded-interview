from __future__ import annotations

import json
import uuid
from collections.abc import Iterator

from openai import OpenAI

from .config import Settings
from .prompts import build_instructions
from .retrieval import SearchHit
from .schemas import ChatRequest


def _sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def stream_chat(
    settings: Settings,
    request: ChatRequest,
    hits: list[SearchHit],
) -> Iterator[str]:
    request_id = uuid.uuid4().hex
    sources = [
        {
            "id": hit.document.id,
            "title": hit.document.title,
            "category": hit.document.category,
            "sourceType": hit.document.source_type,
            "status": hit.document.status,
            "score": hit.score,
        }
        for hit in hits
    ]
    yield _sse("meta", {"requestId": request_id, "model": settings.openai_model})
    yield _sse("sources", {"items": sources})

    if settings.openai_api_key is None or not settings.openai_api_key.get_secret_value():
        yield _sse("error", {"message": "服务端尚未配置 OPENAI_API_KEY", "requestId": request_id})
        return

    messages = [message.model_dump() for message in request.history]
    messages.append({"role": "user", "content": request.message})
    client_options = {
        "api_key": settings.openai_api_key.get_secret_value(),
        "timeout": settings.openai_timeout_seconds,
    }
    if settings.openai_base_url:
        client_options["base_url"] = settings.openai_base_url.rstrip("/")
    client = OpenAI(**client_options)

    try:
        instructions = build_instructions(request.mode, hits)
        if settings.openai_api_mode == "chat_completions":
            completion_messages = [{"role": "system", "content": instructions}, *messages]
            stream = client.chat.completions.create(
                model=settings.openai_model,
                messages=completion_messages,
                stream=True,
            )
            response_id = None
            for chunk in stream:
                response_id = response_id or getattr(chunk, "id", None)
                choices = getattr(chunk, "choices", [])
                if choices:
                    delta = getattr(choices[0], "delta", None)
                    text = getattr(delta, "content", None) if delta else None
                    if text:
                        yield _sse("delta", {"text": text})
        else:
            with client.responses.stream(
                model=settings.openai_model,
                instructions=instructions,
                input=messages,
                store=False,
            ) as stream:
                for event in stream:
                    if event.type == "response.output_text.delta":
                        yield _sse("delta", {"text": event.delta})
                    elif event.type == "response.refusal.delta":
                        yield _sse("delta", {"text": event.delta})
                response = stream.get_final_response()
            response_id = getattr(response, "id", None)
        yield _sse(
            "done",
            {
                "requestId": request_id,
                "responseId": response_id,
            },
        )
    except Exception as error:
        error_message = "AI 服务暂时不可用，请检查后端配置或稍后重试"
        if settings.local_only:
            error_message = f"本地 AI 请求失败：{error}"
        yield _sse(
            "error",
            {
                "message": error_message,
                "requestId": request_id,
                "type": error.__class__.__name__,
            },
        )
