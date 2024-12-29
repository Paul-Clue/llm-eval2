from groq import Groq
from openai import AsyncOpenAI
from os import getenv
from dotenv import load_dotenv
from Service.metrics import MetricsService
from Model.metrics import CreateMetrics
from fastapi import HTTPException
from asyncio import get_event_loop

load_dotenv()
groq_key = getenv('GROQ_API_KEY')

class GroqService:
    def __init__(self):
        self.client = Groq(
            api_key=groq_key,
            # base_url="https://api.groq.com/openai/v1"
        )
        self.metrics_service = MetricsService()

    async def generate_and_store(self, userPrompt: str, systemPrompt: str, expectedOutput: str):
    # async def generate_response(self, prompt: str):
        try:
            loop = get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": systemPrompt},
                    {"role": "user", "content": userPrompt}
                ],
                model="mixtral-8x7b-32768"
            ))
            content = response.choices[0].message.content
            if not content:
                raise HTTPException(status_code=500, detail="No response from Groq")

            metrics = CreateMetrics(
                modelName="mixtral-8x7b-32768",
                modelProvider="Groq",
                systemPrompt=systemPrompt,
                userPrompt=userPrompt,
                response=content,
                modelType="chat",
                modelVersion="1.0",
                modelConfig="default",
                expectedOutput=expectedOutput,
                relevanceScore=0.0,
                accuracyScore=0.0,
                clarityScore=0.0,
                coherenceScore=0.0,
                creativityScore=0.0,
                alignmentScore=0.0,
                evaluation="",
                evaluationScore=0.0,
                evaluationFeedback=""
            )
            
            await self.metrics_service.create_metrics(metrics)
            return content

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))