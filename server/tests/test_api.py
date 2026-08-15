from pathlib import Path

from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.config import Settings
from app.main import create_app


def build_client(tmp_path: Path) -> TestClient:
    public_path = tmp_path / "knowledge.json"
    public_path.write_text("[]", encoding="utf-8")
    settings = Settings(
        _env_file=None,
        openai_api_key=None,
        assistant_access_token=SecretStr("test-token"),
        public_knowledge_path=public_path,
        private_knowledge_path=tmp_path / "private",
        cors_origins="http://localhost:8000",
    )
    return TestClient(create_app(settings))


def test_health_is_public(tmp_path: Path):
    response = build_client(tmp_path).get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_search_requires_access_token(tmp_path: Path):
    client = build_client(tmp_path)
    assert client.post("/v1/knowledge/search", json={"query": "CAN"}).status_code == 401
    response = client.post(
        "/v1/knowledge/search",
        headers={"X-Assistant-Token": "test-token"},
        json={"query": "CAN"},
    )
    assert response.status_code == 200


def test_chat_stream_reports_missing_api_key(tmp_path: Path):
    response = build_client(tmp_path).post(
        "/v1/chat",
        headers={"X-Assistant-Token": "test-token"},
        json={"message": "怎么实现 OTA 回滚？", "history": [], "mode": "answer"},
    )
    assert response.status_code == 200
    assert "event: error" in response.text
    assert "OPENAI_API_KEY" in response.text
