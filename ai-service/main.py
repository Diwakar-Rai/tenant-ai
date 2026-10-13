
from fastapi import FastAPI
from pydantic import BaseModel, Field
from telemetry import setup_telemetry

app = FastAPI(title="TenantAI AI Service")
setup_telemetry(app)

class PredictRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    project_name: str = Field(min_length=1, max_length=100)


class PredictResponse(BaseModel):
    answer: str
    mode: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    answer = (
        f"You asked about '{request.project_name}': "
        f"{request.question}\n\n"
        "This is a mock AI response. "
        "A real model will be connected later."
    )

    return PredictResponse(answer=answer, mode="mock")
