from __future__ import annotations

import json
import math
import uuid
from collections.abc import Iterator
from typing import Any

from openai import BadRequestError, OpenAI

from .config import Settings
from .prompts import build_instructions
from .retrieval import SearchHit
from .schemas import ChatRequest


def _sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _estimate_text_tokens(text: str) -> int:
    if not text:
        return 0
    cjk = 0
    ascii_chars = 0
    other = 0
    for character in text:
        codepoint = ord(character)
        if (
            0x3400 <= codepoint <= 0x4DBF
            or 0x4E00 <= codepoint <= 0x9FFF
            or 0xF900 <= codepoint <= 0xFAFF
        ):
            cjk += 1
        elif codepoint <= 0x7F:
            ascii_chars += 1
        else:
            other += 1
    return max(1, cjk + math.ceil(ascii_chars / 4) + math.ceil(other / 2))


def _estimated_usage(instructions: str, messages: list[dict], output: str) -> dict:
    serialized_messages = "\n".join(
        f"{message.get('role', '')}: {message.get('content', '')}" for message in messages
    )
    input_tokens = (
        _estimate_text_tokens(instructions)
        + _estimate_text_tokens(serialized_messages)
        + len(messages) * 4
        + 2
    )
    output_tokens = _estimate_text_tokens(output)
    return {
        "inputTokens": input_tokens,
        "outputTokens": output_tokens,
        "totalTokens": input_tokens + output_tokens,
        "cachedInputTokens": 0,
        "exact": False,
        "source": "estimated",
    }


def _usage_value(usage: Any, *names: str) -> int | None:
    for name in names:
        value = getattr(usage, name, None)
        if isinstance(value, int):
            return value
    return None


def _provider_usage(usage: Any) -> dict | None:
    if usage is None:
        return None
    input_tokens = _usage_value(usage, "input_tokens", "prompt_tokens")
    output_tokens = _usage_value(usage, "output_tokens", "completion_tokens")
    if input_tokens is None or output_tokens is None:
        return None
    total_tokens = _usage_value(usage, "total_tokens")
    input_details = getattr(usage, "input_tokens_details", None)
    if input_details is None:
        input_details = getattr(usage, "prompt_tokens_details", None)
    cached_input_tokens = _usage_value(input_details, "cached_tokens") or 0
    return {
        "inputTokens": input_tokens,
        "outputTokens": output_tokens,
        "totalTokens": total_tokens if total_tokens is not None else input_tokens + output_tokens,
        "cachedInputTokens": cached_input_tokens,
        "exact": True,
        "source": "provider",
    }


def _usage_option_rejected(error: BadRequestError) -> bool:
    message = str(error).lower()
    return "stream_options" in message or "include_usage" in message


def _chat_completion_stream(client: OpenAI, model: str, messages: list[dict]):
    try:
        return client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            stream_options={"include_usage": True},
        )
    except BadRequestError as error:
        if not _usage_option_rejected(error):
            raise
        return client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
        )


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
        output_parts: list[str] = []
        raw_usage = None
        if settings.openai_api_mode == "chat_completions":
            completion_messages = [{"role": "system", "content": instructions}, *messages]
            stream = _chat_completion_stream(client, settings.openai_model, completion_messages)
            response_id = None
            for chunk in stream:
                response_id = response_id or getattr(chunk, "id", None)
                raw_usage = getattr(chunk, "usage", None) or raw_usage
                choices = getattr(chunk, "choices", [])
                if choices:
                    delta = getattr(choices[0], "delta", None)
                    text = getattr(delta, "content", None) if delta else None
                    if text:
                        output_parts.append(text)
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
                        output_parts.append(event.delta)
                        yield _sse("delta", {"text": event.delta})
                    elif event.type == "response.refusal.delta":
                        output_parts.append(event.delta)
                        yield _sse("delta", {"text": event.delta})
                response = stream.get_final_response()
            response_id = getattr(response, "id", None)
            raw_usage = getattr(response, "usage", None)
        usage = _provider_usage(raw_usage) or _estimated_usage(
            instructions,
            messages,
            "".join(output_parts),
        )
        yield _sse(
            "usage",
            {
                "requestId": request_id,
                "model": settings.openai_model,
                **usage,
            },
        )
        yield _sse(
            "done",
            {
                "requestId": request_id,
                "responseId": response_id,
            },
        )
    except Exception as error:
        if "output_parts" in locals() and output_parts:
            usage = _estimated_usage(instructions, messages, "".join(output_parts))
            yield _sse(
                "usage",
                {
                    "requestId": request_id,
                    "model": settings.openai_model,
                    "incomplete": True,
                    **usage,
                },
            )
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
