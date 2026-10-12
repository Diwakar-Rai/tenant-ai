
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="TenantAI AI Service")


class Question(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.post("/predict")
def predict(question: Question):
    # Temporary mock: no paid API or model required.
    return {
        "answer": f"AI service received: {question.text}",
        "mode": "mock"
    }
