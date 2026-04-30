from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from hr_agent import answer_hr_query


class ChatRequest(BaseModel):
    employeeId: str = Field(..., min_length=1)
    query: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    answer: str


app = FastAPI(
    title="LeaveWise HR API",
    description="Backend API for LeaveWise HR assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        answer = answer_hr_query(request.employeeId, request.query)
        return ChatResponse(answer=answer)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process chat: {exc}") from exc
