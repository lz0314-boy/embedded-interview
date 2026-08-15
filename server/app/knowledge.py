from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass(slots=True)
class KnowledgeDocument:
    id: str
    title: str
    category: str
    text: str
    source_type: str = "public"
    status: str = "curated"
    metadata: dict[str, Any] = field(default_factory=dict)


def _public_document(item: dict[str, Any]) -> KnowledgeDocument:
    followups = "\n".join(
        f"追问：{entry.get('question', '')}\n回答：{entry.get('answer', '')}"
        for entry in item.get("followups", [])
    )
    sections = [
        f"问题：{item.get('title', '')}",
        f"简答：{item.get('brief', '')}" if item.get("brief") else "",
        f"完整回答：{item.get('answer', '')}" if item.get("answer") else "",
        followups,
        f"证据：{item.get('evidence', '')}" if item.get("evidence") else "",
        f"边界：{item.get('boundary', '')}" if item.get("boundary") else "",
        f"注意：{item.get('caution', '')}" if item.get("caution") else "",
    ]
    return KnowledgeDocument(
        id=str(item["id"]),
        title=str(item.get("title") or item["id"]),
        category=str(item.get("category") or "未分类"),
        text="\n".join(section for section in sections if section).strip(),
        source_type="public",
        status=str(item.get("status") or "curated"),
        metadata={
            "tags": item.get("tags", []),
            "source": item.get("source", f"website:{item['id']}"),
        },
    )


def _private_json_documents(path: Path) -> list[KnowledgeDocument]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    items = payload if isinstance(payload, list) else payload.get("documents", [payload])
    documents = []
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        document_id = str(item.get("id") or f"private:{path.stem}:{index + 1}")
        title = str(item.get("title") or item.get("question") or path.stem)
        text = str(item.get("text") or item.get("answer") or json.dumps(item, ensure_ascii=False))
        documents.append(KnowledgeDocument(
            id=document_id,
            title=title,
            category=str(item.get("category") or "私有资料"),
            text=text,
            source_type="private",
            status=str(item.get("status") or "private"),
            metadata={"file": path.name},
        ))
    return documents


def _private_file_documents(path: Path) -> list[KnowledgeDocument]:
    if path.suffix.lower() in {".md", ".txt"}:
        text = path.read_text(encoding="utf-8").strip()
        if not text:
            return []
        title = next(
            (line.lstrip("# ").strip() for line in text.splitlines() if line.startswith("#")),
            path.stem,
        )
        return [KnowledgeDocument(
            id=f"private:{path.stem}",
            title=title,
            category="私有资料",
            text=text,
            source_type="private",
            status="private",
            metadata={"file": path.name},
        )]
    if path.suffix.lower() == ".json":
        return _private_json_documents(path)
    return []


def load_knowledge(public_path: Path, private_path: Path) -> list[KnowledgeDocument]:
    documents: list[KnowledgeDocument] = []
    if public_path.exists():
        payload = json.loads(public_path.read_text(encoding="utf-8"))
        documents.extend(_public_document(item) for item in payload)

    if private_path.is_file():
        documents.extend(_private_file_documents(private_path))
    elif private_path.exists():
        for path in sorted(private_path.iterdir()):
            if path.name.startswith(".") or not path.is_file():
                continue
            documents.extend(_private_file_documents(path))
    return documents
