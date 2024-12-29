from groq import Groq
from openai import AsyncOpenAI
from os import getenv
from dotenv import load_dotenv
from Service.metrics import MetricsService
from Model.metrics import CreateMetrics
from fastapi import HTTPException
from asyncio import get_event_loop
import json
# import logging

# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
# )
# logger = logging.getLogger(__name__)

load_dotenv()
groq_key = getenv('GROQ_API_KEY')

class GroqService:
    def __init__(self):
        self.client = Groq(
            api_key=groq_key,
            # base_url="https://api.groq.com/openai/v1"
        )
        self.openai_client = AsyncOpenAI(  # Add OpenAI client
            api_key=getenv('OPENAI_API_KEY')
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
                evaluationFeedback="",
                hallucinationScore=0.0,
                hallucinationFeedback=""
            )
            
            await self.metrics_service.create_metrics(metrics)
            return content

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    async def evaluate_response(self, userPrompt: str, systemPrompt: str, expectedOutput: str):
        # evaluation_prompt = f"""
        # You are a helpful assistant that evaluates the response of a model.
        # You will be given a response and an expected output.
        # You will then evaluate the response and return a score and feedback.
        # """
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
            
            evaluation_prompt = f"""
        You are a helpful assistant that evaluates the response of a model.
        You will be given a user prompt, a system prompt, and an expected output.
        You will then evaluate the model response, paying special attention to hallucinations.

        User Prompt: {userPrompt}
        System Prompt: {systemPrompt}
        Expected Output: {expectedOutput}
        Model Response: {content}

        Carefully analyze the response for:
        1. Factual accuracy compared to the expected output
        2. Information fabrication or hallucinations
        3. Claims made without basis in the input prompts
        4. Consistency with the given context

        Return your evaluation in the following JSON format:
        {{
            "relevanceScore": <float 0-1>,
            "accuracyScore": <float 0-1>,
            "clarityScore": <float 0-1>,
            "coherenceScore": <float 0-1>,
            "creativityScore": <float 0-1>,
            "alignmentScore": <float 0-1>,
            "hallucinationScore": <float 0-1>,  // 0 = many hallucinations, 1 = no hallucinations
            "evaluation": "<detailed evaluation text>",
            "evaluationScore": <float 0-1>,
            "evaluationFeedback": "<specific feedback and suggestions>",
            "hallucinationFeedback": "<specific examples of any hallucinations found. If none, return 'None'"
        }}

        IMPORTANT: Respond ONLY with the JSON object, no additional text or explanation.
        Ensure all scores are between 0 and 1, where 1 is the best possible score.
        """
            # evaluation_response = await loop.run_in_executor(None, lambda: self.client.chat.completions.create(
            #     messages=[
            #         {"role": "system", "content": evaluation_prompt},
            #         {"role": "user", "content": content}
            #     ],
            #     model="mixtral-8x7b-32768"
            # ))
            evaluation_response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": evaluation_prompt},
                    {"role": "user", "content": content}
                ],
                response_format={"type": "json_object"}
            )
            evaluation_content = evaluation_response.choices[0].message.content
            # print("Evaluation Content: ", evaluation_content)
            if not evaluation_content:
                raise HTTPException(status_code=500, detail="No evaluation response from Groq")
            scores = json.loads(evaluation_content)
            print("Evaluation Content: ", scores)
            # print("Evaluation Content: ", scores['evaluationScore'])
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
                relevanceScore=scores['relevanceScore'],
                accuracyScore=scores['accuracyScore'],
                clarityScore=scores['clarityScore'],
                coherenceScore=scores['coherenceScore'],
                creativityScore=scores['creativityScore'],
                alignmentScore=scores['alignmentScore'],
                evaluation=scores['evaluation'],
                evaluationScore=scores['evaluationScore'],
                evaluationFeedback=scores['evaluationFeedback'],
                hallucinationScore=0.0,
                hallucinationFeedback=""
            )
            
            await self.metrics_service.create_metrics(metrics)
            # return content
            return evaluation_content

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
