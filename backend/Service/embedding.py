from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from groq import Groq
from openai import AsyncOpenAI
import google.generativeai as genai
from Service.metrics import MetricsService
from Model.metrics import CreateMetrics
from fastapi import HTTPException
from asyncio import get_event_loop
import json
# from Service.groq import GroqService
from os import getenv
import os
from dotenv import load_dotenv

load_dotenv()
groq_key = getenv('GROQ_API_KEY')
genai.configure(api_key=getenv('GEMINI_API_KEY'))
os.environ["TOKENIZERS_PARALLELISM"] = "false"

class EmbeddingService:
    def __init__(self):
        # Initialize HuggingFace model
        # self.groq_service = GroqService()
        os.environ["TOKENIZERS_PARALLELISM"] = "false"
        self.client = Groq(
            api_key=groq_key,
            # base_url="https://api.groq.com/openai/v1"
        )
        self.openai_client = AsyncOpenAI(
            api_key=getenv('OPENAI_API_KEY')
        )
        # self.gemini_client = genai.get_model("gemini-1.5-flash-latest")
        self.gemini_client = genai.GenerativeModel("gemini-1.5-flash")
        self.metrics_service = MetricsService()
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize Pinecone with new syntax
        pc = Pinecone(api_key=getenv('PINECONE_API_KEY'))
        self.index = pc.Index(getenv('PINECONE_INDEX'))
        self.namespace = getenv('PINECONE_NAMESPACE', 'default')

    async def embed_and_store(self, text: str, metadata: dict = {}) -> bool:
        try:
            print("Creating embedding for text:", text[:100] + "...")  # Log first 100 chars
            embedding = self.model.encode(text)
            
            print("Storing in Pinecone with metadata:", metadata)
            self.index.upsert(
                vectors=[
                    {
                        'id': metadata.get('id', 'default-id'),
                        'values': embedding.tolist(),
                        'metadata': metadata
                    }
                ],
                namespace=self.namespace
            )
            print("Successfully stored in Pinecone")
            return True
        except Exception as e:
            print(f"Error in embed_and_store: {str(e)}")
            return False
        
    async def search_similar(self, systemPrompt: str, userPrompt: str, expectedOutput: str, model: str, top_k: int = 5):
        try:
            print("Creating query embedding for:", userPrompt)
            query_embedding = self.model.encode(userPrompt)
            
            print("Searching Pinecone...")
            search_results = self.index.query(
                vector=query_embedding.tolist(),
                top_k=top_k,
                namespace=self.namespace,
                include_metadata=True
            )
            print("Raw search results:", search_results)

            if not search_results['matches']:
                print("No matches found in search results")
                return None

            context = ""
            for match in search_results['matches']:
                print(f"Processing match metadata: {match['metadata']}")  # Debug log
                if 'text' not in match['metadata']:
                    print(f"Warning: No text found in metadata for match {match['id']}")
                    continue
                    
                context += f"\nDocument (score: {match['score']}): {match['metadata']['text']}"
                print(f"Added match with score {match['score']}")

            if not context:
                print("No text content found in any matches")
                return None

            # print("SEARCH RESULTS: ", context)
            # print("SEARCH RESULTS: ", search_results)

            new_system_prompt = f"""
            {systemPrompt}

            Please use the following context to inform your response about the quality of the feedback from the model:
            {context}

            Please think step to provide an accurate response.
            """

            loop = get_event_loop()
            content = None
            if model == "mixtral-8x7b-32768":
                response = await loop.run_in_executor(None, lambda: self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": new_system_prompt},
                        {"role": "user", "content": userPrompt}
                    ],
                    model="mixtral-8x7b-32768"
                ))
                content = response.choices[0].message.content
            elif model == "gpt-3.5-turbo":
                response = await self.openai_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": new_system_prompt},
                    {"role": "user", "content": userPrompt}
                ],
                    model="gpt-3.5-turbo"
                )   
                content = response.choices[0].message.content
                print("GPT-3.5-TURBO RESPONSE: ", content)
            elif model == "gemini-1.5-flash":
                response = await loop.run_in_executor(None, lambda: self.gemini_client.generate_content(
                    [new_system_prompt, userPrompt]
                ))
                content = response.candidates[0].content.parts[0].text
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
            if not evaluation_content:
                raise HTTPException(status_code=500, detail="No evaluation response from Groq")
            scores = json.loads(evaluation_content)
            # print("Evaluation Content: ", scores['evaluationScore'])
            metrics = CreateMetrics(
                modelName=model,
                modelProvider="Groq",
                systemPrompt=systemPrompt,
                userPrompt=userPrompt,
                response=content,
                modelType="llm",
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
                hallucinationScore=scores['hallucinationScore'],
                hallucinationFeedback=scores['hallucinationFeedback']
            )
            
            await self.metrics_service.create_metrics(metrics)
            # return content
            return evaluation_content

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        # except Exception as e:
        #     print(f"Error in search_similar: {str(e)}")
        #     return None

# class EmbeddingService:
#     def __init__(self):
#         # Initialize HuggingFace model
#         self.model = SentenceTransformer('all-MiniLM-L6-v2')
#         
#         # Initialize Pinecone
#         pinecone.init(
#             api_key=getenv('PINECONE_API_KEY'),
#             environment=getenv('PINECONE_ENV')
#         )
#         self.index = pinecone.Index(getenv('PINECONE_INDEX'))

#     async def embed_and_store(self, text: str, metadata: dict = None):
#         try:
#             # Create embedding
#             embedding = self.model.encode(text)
#             
#             # Store in Pinecone
#             self.index.upsert(
#                 vectors=[
#                     {
#                         'id': metadata.get('id', 'default-id'),
#                         'values': embedding.tolist(),
#                         'metadata': metadata
#                     }
#                 ]
#             )
#             
#             return True
#         except Exception as e:
#             print(f"Error in embed_and_store: {str(e)}")
#             return False 
