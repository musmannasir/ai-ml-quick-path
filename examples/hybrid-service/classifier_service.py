"""Python AI service called by an ASP.NET Core application (hybrid architecture).

Runtime prerequisites: Python 3.10+, `pip install fastapi uvicorn scikit-learn`.
Run:  uvicorn classifier_service:app --port 8001
Status here: syntax-checked (FastAPI is not installed in the build environment).
The contract (request/response JSON) is versioned under /v1 so both sides can evolve.
"""
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="ticket-classifier", version="1.0.0")
MODEL_VERSION = "spam-tfidf-logreg-2026-10-30"


class ClassifyRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    request_id: str = Field(min_length=1, max_length=64)


class ClassifyResponse(BaseModel):
    label: str
    score: float = Field(ge=0, le=1)
    model_version: str
    request_id: str


def predict(text: str) -> tuple[str, float]:
    # Replace with a model loaded once at startup (for example joblib.load).
    spam_words = {"free", "prize", "click", "winner", "urgent"}
    hits = sum(word in text.lower() for word in spam_words)
    score = min(1.0, hits / 3)
    return ("spam" if score >= 0.5 else "not_spam"), score


@app.post("/v1/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest, x_api_key: str = Header(...)) -> ClassifyResponse:
    # Service-to-service authentication; load the expected key from a secret store.
    import os
    if x_api_key != os.environ.get("SERVICE_API_KEY"):
        raise HTTPException(status_code=401, detail="invalid service credentials")
    label, score = predict(req.text)
    return ClassifyResponse(label=label, score=score, model_version=MODEL_VERSION, request_id=req.request_id)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_version": MODEL_VERSION}
