from Repository.metrics import MetricsRepository
from Model.metrics import CreateMetrics
from fastapi import HTTPException

class MetricsService:
  @staticmethod
  async def get_all_metrics():
    return await MetricsRepository.get_all_metrics()

  @staticmethod
  async def get_metrics_by_id(id: str):
    return await MetricsRepository.get_metrics_by_id(id)

  # @staticmethod
  # async def create_metrics(metrics: CreateMetrics):
  #   return await MetricsRepository.create_metrics(metrics)
  @staticmethod
  async def create_metrics(metrics: CreateMetrics):
    try:
        return await MetricsRepository.create_metrics(metrics)
    except Exception as e:
        print(f"Error: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=str(e))
  
  @staticmethod
  async def update_metrics(id: str, metrics: CreateMetrics):
    return await MetricsRepository.update_metrics(id, metrics)
  
  @staticmethod
  async def delete_metrics(id: str):
    return await MetricsRepository.delete_metrics(id)
