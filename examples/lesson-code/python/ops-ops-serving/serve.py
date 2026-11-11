# From lesson 'ops-serving' (ops). Code status: Python executed 2026-11-02 (quickpath.py serving, standard-library HTTP server); FastAPI and C# not run (FastAPI not installed and no .NET SDK in the build environment)
import joblib
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()
model = joblib.load("model.joblib")          # once, at start-up
MODEL_VERSION = "churn-logreg-v3"

class Customer(BaseModel):
    tenure_months: float = Field(ge=0, le=600)
    monthly_charge: float = Field(ge=0)
    support_calls: int = Field(ge=0, le=100)

@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}

@app.post("/predict")
def predict(c: Customer):                    # invalid input -> automatic 422 error
    p = model.predict_proba([[c.tenure_months, c.monthly_charge, c.support_calls]])[0, 1]
    return {"churn_probability": round(float(p), 3), "model_version": MODEL_VERSION}

# run: uvicorn serve:app --port 8000
