from fastapi import APIRouter, Body
from Service.groq import GroqService
from Model.metrics import ChatRequest

router = APIRouter(prefix="/groq",
    tags=["groq"]
)
print("Groq controller1: ")
groq_service = GroqService()
@router.post("/chat")
async def chat(metrics: ChatRequest = Body(...)):
    print("Groq controller2: ")
    # response = await groq_service.generate_and_store(metrics.userPrompt, metrics.systemPrompt, metrics.expectedOutput)
    # return {"detail": "Success", "result": response}
    response = await groq_service.evaluate_response(metrics.userPrompt, metrics.systemPrompt, metrics.expectedOutput, metrics.model)
    print("Groq controller3: ")
    return {"detail": "Success", "result": response}

# @router.post("/chat")
# async def chat(metrics: CreateMetrics = Body(...)):
#     response = await groq_service.generate_response(metrics.userPrompt)
#     return {"detail": "Success", "result": response}