import json
from types import SimpleNamespace

from pydantic import SecretStr

from app.config import Settings
from app.openai_client import stream_chat
from app.schemas import ChatRequest


def _events(stream: str) -> dict[str, list[dict]]:
    parsed: dict[str, list[dict]] = {}
    for block in stream.strip().split("\n\n"):
        lines = block.splitlines()
        event = next(line[6:].strip() for line in lines if line.startswith("event:"))
        data = next(line[5:].strip() for line in lines if line.startswith("data:"))
        parsed.setdefault(event, []).append(json.loads(data))
    return parsed


def _settings(api_mode: str) -> Settings:
    return Settings(
        _env_file=None,
        openai_api_key=SecretStr("test-key"),
        openai_model="test-model",
        openai_api_mode=api_mode,
    )


def _request() -> ChatRequest:
    return ChatRequest(message="解释一下 OTA 回滚", history=[], mode="answer")


def test_chat_completions_emits_provider_usage(monkeypatch):
    usage = SimpleNamespace(
        prompt_tokens=120,
        completion_tokens=30,
        total_tokens=150,
        prompt_tokens_details=SimpleNamespace(cached_tokens=20),
    )
    chunks = [
        SimpleNamespace(
            id="response-1",
            choices=[SimpleNamespace(delta=SimpleNamespace(content="回答"))],
            usage=None,
        ),
        SimpleNamespace(id="response-1", choices=[], usage=usage),
    ]

    class FakeCompletions:
        def create(self, **kwargs):
            assert kwargs["stream_options"] == {"include_usage": True}
            return iter(chunks)

    fake_client = SimpleNamespace(
        chat=SimpleNamespace(completions=FakeCompletions()),
    )
    monkeypatch.setattr("app.openai_client.OpenAI", lambda **_: fake_client)

    events = _events("".join(stream_chat(_settings("chat_completions"), _request(), [])))
    assert events["usage"][0] == {
        "requestId": events["meta"][0]["requestId"],
        "model": "test-model",
        "inputTokens": 120,
        "outputTokens": 30,
        "totalTokens": 150,
        "cachedInputTokens": 20,
        "exact": True,
        "source": "provider",
    }


def test_chat_completions_estimates_usage_when_provider_omits_it(monkeypatch):
    chunks = [
        SimpleNamespace(
            id="response-2",
            choices=[SimpleNamespace(delta=SimpleNamespace(content="这是回答"))],
            usage=None,
        )
    ]

    class FakeCompletions:
        def create(self, **_kwargs):
            return iter(chunks)

    fake_client = SimpleNamespace(
        chat=SimpleNamespace(completions=FakeCompletions()),
    )
    monkeypatch.setattr("app.openai_client.OpenAI", lambda **_: fake_client)

    events = _events("".join(stream_chat(_settings("chat_completions"), _request(), [])))
    usage = events["usage"][0]
    assert usage["exact"] is False
    assert usage["source"] == "estimated"
    assert usage["inputTokens"] > 0
    assert usage["outputTokens"] > 0
    assert usage["totalTokens"] == usage["inputTokens"] + usage["outputTokens"]


def test_responses_emits_provider_usage(monkeypatch):
    response = SimpleNamespace(
        id="response-3",
        usage=SimpleNamespace(
            input_tokens=80,
            output_tokens=25,
            total_tokens=105,
            input_tokens_details=SimpleNamespace(cached_tokens=12),
        ),
    )

    class FakeResponseStream:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def __iter__(self):
            return iter([SimpleNamespace(type="response.output_text.delta", delta="回答")])

        def get_final_response(self):
            return response

    fake_client = SimpleNamespace(
        responses=SimpleNamespace(stream=lambda **_kwargs: FakeResponseStream()),
    )
    monkeypatch.setattr("app.openai_client.OpenAI", lambda **_: fake_client)

    events = _events("".join(stream_chat(_settings("responses"), _request(), [])))
    usage = events["usage"][0]
    assert usage["inputTokens"] == 80
    assert usage["outputTokens"] == 25
    assert usage["totalTokens"] == 105
    assert usage["cachedInputTokens"] == 12
    assert usage["exact"] is True
