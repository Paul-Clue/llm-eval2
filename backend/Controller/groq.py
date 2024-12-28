from fastapi import APIRouter
from Service.groq import GroqService

router = APIRouter(prefix="/groq")
groq_service = GroqService()

@router.post("/chat")
async def chat(prompt: str):
    # response = await groq_service.generate_and_store(prompt)
    response = await groq_service.generate_response(prompt)
    return {"detail": "Success", "result": response}
