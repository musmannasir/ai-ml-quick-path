"""Retrieval-augmented generation (RAG) skeleton: an employee leave-policy assistant.

What this shows: chunking -> indexing -> ACCESS CHECK -> retrieval -> grounded,
cited answer -> "no answer" when evidence is weak -> a small evaluation set.

To run fully offline, TF-IDF vectors stand in for neural embeddings and the
"answer" is the retrieved passage itself (extractive). In production you would
swap in an embedding model and send the printed prompt to an LLM. The retrieval,
permission and evaluation logic stays the same.

Runtime prerequisites: Python 3.10+, scikit-learn 1.3+.
Run:  python rag_leave_policy.py
All policy text is synthetic.
"""
from dataclasses import dataclass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

MIN_SCORE = 0.20   # below this similarity we refuse to answer (tune on your eval set)


@dataclass(frozen=True)
class Chunk:
    id: str
    text: str
    allowed_roles: frozenset[str]


DOCUMENTS = {
    "leave-policy": (
        {"employee", "hr"},
        [
            "Annual leave: full-time employees receive 25 days of paid annual leave per calendar year. "
            "Part-time employees receive leave in proportion to their contracted hours.",
            "Carry over: up to 5 unused annual leave days can be carried into the next year. "
            "Carried days must be used by 31 March or they expire.",
            "Requesting leave: submit requests in the HR portal at least 10 working days in advance. "
            "Your manager approves or declines within 3 working days.",
            "Sick leave is separate from annual leave. Report sickness to your manager on the first day of absence.",
        ],
    ),
    "parental-leave": (
        {"employee", "hr"},
        [
            "Parental leave: employees with at least 6 months of service may take up to 16 weeks of paid parental leave.",
        ],
    ),
    "hr-salary-bands": (
        {"hr"},   # restricted document: must never reach an ordinary employee
        [
            "Salary bands: level 5 engineers are paid within the confidential band agreed by the compensation committee.",
        ],
    ),
}


def build_chunks() -> list[Chunk]:
    chunks = []
    for doc_id, (roles, paragraphs) in DOCUMENTS.items():
        for i, para in enumerate(paragraphs, start=1):
            chunks.append(Chunk(f"{doc_id}#{i}", para, frozenset(roles)))
    return chunks


class Retriever:
    def __init__(self, chunks: list[Chunk]):
        self.chunks = chunks
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.matrix = self.vectorizer.fit_transform([c.text for c in chunks])

    def search(self, question: str, role: str, k: int = 2) -> list[tuple[Chunk, float]]:
        scores = cosine_similarity(self.vectorizer.transform([question]), self.matrix)[0]
        # Access check happens BEFORE ranking, so restricted text can never be returned
        # or leak into a prompt for a user who is not allowed to read it.
        allowed = [(c, float(s)) for c, s in zip(self.chunks, scores) if role in c.allowed_roles]
        allowed.sort(key=lambda pair: pair[1], reverse=True)
        return allowed[:k]


def answer(retriever: Retriever, question: str, role: str) -> dict:
    hits = retriever.search(question, role)
    if not hits or hits[0][1] < MIN_SCORE:
        return {"answer": "I can't find this in the policies you have access to. "
                          "Please contact HR.", "sources": [], "score": hits[0][1] if hits else 0.0}
    best, score = hits[0]
    return {"answer": best.text, "sources": [best.id], "score": score}


def build_prompt(question: str, hits: list[tuple[Chunk, float]]) -> str:
    context = "\n".join(f"[{c.id}] {c.text}" for c, _ in hits)
    return (
        "Answer using ONLY the sources below. Cite source ids in square brackets. "
        "If the sources do not contain the answer, say you don't know.\n\n"
        f"Sources:\n{context}\n\nQuestion: {question}"
    )


EVAL_SET = [
    # (question, role, expected source id or None for "should not answer")
    ("How many leave days do I get?", "employee", "leave-policy#1"),
    ("Can I carry over unused holiday days?", "employee", "leave-policy#2"),
    ("How far in advance must I request leave?", "employee", "leave-policy#3"),
    ("How long is paid parental leave?", "employee", "parental-leave#1"),
    ("What is the salary band for level 5 engineers?", "employee", None),   # not permitted
    ("What is the salary band for level 5 engineers?", "hr", "hr-salary-bands#1"),
    ("What is the office wifi password?", "employee", None),                 # not in corpus
]


def main() -> None:
    retriever = Retriever(build_chunks())

    q = "How many leave days do I get?"
    result = answer(retriever, q, "employee")
    print(f"Q: {q}")
    print(f"A: {result['answer']} {result['sources']} (score {result['score']:.2f})")
    print("\nPrompt that would be sent to an LLM:\n" + build_prompt(q, retriever.search(q, "employee")))

    print("\nEvaluation:")
    correct = 0
    for question, role, expected in EVAL_SET:
        got = answer(retriever, question, role)
        got_source = got["sources"][0] if got["sources"] else None
        ok = got_source == expected
        correct += ok
        print(f"  [{'PASS' if ok else 'FAIL'}] ({role}) {question} -> {got_source} (score {got['score']:.2f})")
    print(f"Passed {correct}/{len(EVAL_SET)}")


if __name__ == "__main__":
    main()
