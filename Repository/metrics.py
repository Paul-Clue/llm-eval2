from Config.Connection import prisma
from Model.metrics import CreateMetrics, RetrieveMetrics

class MetricsRepository:
  @staticmethod
  async def get_all_metrics():
    return await prisma.evaluation_metrics.find_many()

  @staticmethod
  async def get_metrics_by_id(id: str):
    return await prisma.evaluation_metrics.find_unique(where={"id": id})
  
  @staticmethod
  async def create_metrics(metrics: CreateMetrics):
    return await prisma.evaluation_metrics.create(data=metrics.model_dump())
  
  @staticmethod
  async def update_metrics(id: str, metrics: CreateMetrics):
    return await prisma.evaluation_metrics.update(where={"id": id}, data=metrics.model_dump())
  
  @staticmethod
  async def delete_metrics(id: str):
    return await prisma.evaluation_metrics.delete(where={"id": id})
