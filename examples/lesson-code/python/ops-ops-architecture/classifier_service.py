# From lesson 'ops-architecture' (ops). Code status: C# and FastAPI service not compiled or run (no .NET SDK or FastAPI in the build environment); Dockerfile not built (no Docker in the build environment)
import os
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="ticket-classifier", version="1.0.0")
MODEL_VERSION = "ticket-tfidf-logreg-2026-10"

class ClassifyRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    request_id: str = Field(min_length=1, max_length=64)

class ClassifyResponse(BaseModel):
    label: str
    score: float = Field(ge=0, le=1)
    model_version: str
    request_id: str

@app.post("/v1/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest, x_api_key: str = Header(...)):
    if x_api_key != os.environ.get("SERVICE_API_KEY"):
        raise HTTPException(status_code=401, detail="invalid service credentials")
    label, score = predict(req.text)          # model loaded once at start-up
    return ClassifyResponse(label=label, score=score, model_version=MODEL_VERSION, request_id=req.request_id)

@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}
