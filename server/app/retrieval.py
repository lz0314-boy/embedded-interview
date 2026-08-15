from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass

from .knowledge import KnowledgeDocument


TOKEN_RUNS = re.compile(r"[\u4e00-\u9fff]+|[a-z0-9][a-z0-9_+.#/-]*", re.IGNORECASE)


def tokenize(value: str) -> list[str]:
    tokens: list[str] = []
    for run in TOKEN_RUNS.findall(value.lower()):
        if "\u4e00" <= run[0] <= "\u9fff":
            tokens.extend(run)
            tokens.extend(run[index:index + 2] for index in range(len(run) - 1))
            if len(run) <= 8:
                tokens.append(run)
        else:
            tokens.append(run.strip("./-"))
    return [token for token in tokens if token]


@dataclass(slots=True)
class SearchHit:
    document: KnowledgeDocument
    score: float
    snippet: str


class BM25Index:
    def __init__(self, documents: list[KnowledgeDocument], k1: float = 1.5, b: float = 0.72):
        self.documents = documents
        self.k1 = k1
        self.b = b
        self.term_frequencies: list[Counter[str]] = []
        self.document_frequencies: dict[str, int] = defaultdict(int)
        self.lengths: list[int] = []

        for document in documents:
            terms = tokenize(f"{document.title} {document.title} {document.category} {document.text}")
            frequencies = Counter(terms)
            self.term_frequencies.append(frequencies)
            self.lengths.append(len(terms))
            for term in frequencies:
                self.document_frequencies[term] += 1
        self.average_length = sum(self.lengths) / len(self.lengths) if self.lengths else 1.0

    def search(self, query: str, limit: int = 6) -> list[SearchHit]:
        query_terms = Counter(tokenize(query))
        if not query_terms or not self.documents:
            return []
        scored: list[tuple[float, int]] = []
        document_count = len(self.documents)
        normalized_query = query.lower().strip()

        for index, frequencies in enumerate(self.term_frequencies):
            score = 0.0
            length = self.lengths[index]
            for term, query_frequency in query_terms.items():
                frequency = frequencies.get(term, 0)
                if frequency == 0:
                    continue
                document_frequency = self.document_frequencies[term]
                inverse_frequency = math.log(1 + (document_count - document_frequency + 0.5) / (document_frequency + 0.5))
                denominator = frequency + self.k1 * (1 - self.b + self.b * length / self.average_length)
                score += inverse_frequency * frequency * (self.k1 + 1) / denominator * min(query_frequency, 2)
            document = self.documents[index]
            if normalized_query and normalized_query in document.title.lower():
                score += 5.0
            if score > 0:
                scored.append((score, index))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [
            SearchHit(
                document=self.documents[index],
                score=round(score, 4),
                snippet=self._snippet(self.documents[index].text, query),
            )
            for score, index in scored[:limit]
        ]

    @staticmethod
    def _snippet(text: str, query: str, length: int = 360) -> str:
        compact = re.sub(r"\s+", " ", text).strip()
        if len(compact) <= length:
            return compact
        positions = [compact.lower().find(term) for term in TOKEN_RUNS.findall(query.lower())]
        positions = [position for position in positions if position >= 0]
        start = max(0, (min(positions) if positions else 0) - 80)
        end = min(len(compact), start + length)
        prefix = "…" if start else ""
        suffix = "…" if end < len(compact) else ""
        return f"{prefix}{compact[start:end].strip()}{suffix}"
