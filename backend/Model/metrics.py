from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    systemPrompt: str
    userPrompt: str
    expectedOutput: str
class CreateMetrics(BaseModel):
    modelName: str
    modelVersion: str
    modelType: str
    modelProvider: str
    modelConfig: str
    systemPrompt: str
    userPrompt: str
    expectedOutput: str
    relevanceScore: float
    accuracyScore: float
    clarityScore: float
    coherenceScore: float
    creativityScore: float
    alignmentScore: float
    response: str
    evaluation: str
    evaluationScore: float
    evaluationFeedback: str

class RetrieveMetrics(BaseModel):
    id: str
    modelName: str
    modelVersion: str
    modelType: str
    modelProvider: str
    modelConfig: str
    systemPrompt: str
    userPrompt: str
    expectedOutput: str
    relevanceScore: float
    accuracyScore: float
    clarityScore: float
    coherenceScore: float
    creativityScore: float
    alignmentScore: float
    response: str
    evaluation: str
    evaluationScore: float
    evaluationFeedback: str
    