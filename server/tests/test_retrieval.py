from app.knowledge import KnowledgeDocument
from app.retrieval import BM25Index, tokenize


def test_chinese_and_latin_tokenization():
    tokens = tokenize("如何调试 CAN 总线和状态机？")
    assert "调试" in tokens
    assert "can" in tokens
    assert "状态" in tokens


def test_retrieval_prefers_matching_document():
    documents = [
        KnowledgeDocument("ota", "OTA 升级状态机", "穿戴项目", "镜像校验、双分区和回滚"),
        KnowledgeDocument("can", "CAN 报文解析", "CAN", "SocketCAN 过滤器和时间戳"),
    ]
    hits = BM25Index(documents).search("升级失败如何回滚", limit=1)
    assert hits
    assert hits[0].document.id == "ota"
