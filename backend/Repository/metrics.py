from Config.Connection import prisma
from Model.metrics import CreateMetrics, RetrieveMetrics
from prisma.models import evaluation_metrics
# from prisma.types import evaluation_metricsCreateInput
from prisma.types import evaluation_metricsCreateInput, evaluation_metricsUpdateInput
from typing import Union, Dict

class MetricsRepository:
  @staticmethod
  async def get_all_metrics():
    print("Getting all metrics")
    return await prisma.evaluation_metrics.find_many()

  @staticmethod
  async def get_metrics_by_id(id: str):
    return await prisma.evaluation_metrics.find_unique(where={"id": id})
  
  @staticmethod
  async def create_metrics(metrics: CreateMetrics):
    data: evaluation_metricsCreateInput = {
        'modelName': metrics.modelName,
        'modelVersion': metrics.modelVersion,
        'modelType': metrics.modelType,
        'modelProvider': metrics.modelProvider,
        'modelConfig': metrics.modelConfig,
        'systemPrompt': metrics.systemPrompt,
        'userPrompt': metrics.userPrompt,
        'expectedOutput': metrics.expectedOutput,
        'relevanceScore': metrics.relevanceScore,
        'accuracyScore': metrics.accuracyScore,
        'clarityScore': metrics.clarityScore,
        'coherenceScore': metrics.coherenceScore,
        'creativityScore': metrics.creativityScore,
        'alignmentScore': metrics.alignmentScore,
        'response': metrics.response,
        'evaluation': metrics.evaluation,
        'evaluationScore': metrics.evaluationScore,
        'evaluationFeedback': metrics.evaluationFeedback,
        'hallucinationScore': metrics.hallucinationScore,
        'hallucinationFeedback': metrics.hallucinationFeedback
    }
    return await prisma.evaluation_metrics.create(data=data)
  
  @staticmethod
  async def update_metrics(id: str, metrics: CreateMetrics):
    data: evaluation_metricsUpdateInput = {
        'modelName': metrics.modelName,
        'modelVersion': metrics.modelVersion,
        'modelType': metrics.modelType,
        'modelProvider': metrics.modelProvider,
        'modelConfig': metrics.modelConfig,
        'systemPrompt': metrics.systemPrompt,
        'userPrompt': metrics.userPrompt,
        'expectedOutput': metrics.expectedOutput,
        'relevanceScore': metrics.relevanceScore,
        'accuracyScore': metrics.accuracyScore,
        'clarityScore': metrics.clarityScore,
        'coherenceScore': metrics.coherenceScore,
        'creativityScore': metrics.creativityScore,
        'alignmentScore': metrics.alignmentScore,
        'response': metrics.response,
        'evaluation': metrics.evaluation,
        'evaluationScore': metrics.evaluationScore,
        'evaluationFeedback': metrics.evaluationFeedback,
        'hallucinationScore': metrics.hallucinationScore,
        'hallucinationFeedback': metrics.hallucinationFeedback
    }
    return await prisma.evaluation_metrics.update(where={"id": id}, data=data)
  
  @staticmethod
  async def delete_metrics(id: str):
    return await prisma.evaluation_metrics.delete(where={"id": id})

  @staticmethod
  async def get_metrics_by_model(model_name: str):
    return await prisma.evaluation_metrics.find_many(
        where={
            "modelName": model_name
        }
    )
