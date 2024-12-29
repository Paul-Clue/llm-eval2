from fastapi import APIRouter, Path, Body
from schema import ResponseSchema
from Service.metrics import MetricsService
from Model.metrics import CreateMetrics

router = APIRouter(
    prefix="/metrics",
    tags=["metrics"]
)

@router.get("/", response_model=ResponseSchema, response_model_exclude_none=True)
async def get_all_metrics():
    print("get_all_metrics")
    result = await MetricsService.get_all_metrics()
    return ResponseSchema(detail="Metrics fetched successfully", result=result)

@router.get("/{id}", response_model=ResponseSchema, response_model_exclude_none=True)
async def get_metrics_by_id(id: str = Path(..., alias="id")):
    result = await MetricsService.get_metrics_by_id(id)
    return ResponseSchema(detail="Metrics fetched successfully", result=result)

@router.post("/", response_model=ResponseSchema, response_model_exclude_none=True)
async def create_metrics(metrics: CreateMetrics):
    await MetricsService.create_metrics(metrics)
    return ResponseSchema(detail="Metrics created successfully")

@router.put("/{id}", response_model=ResponseSchema, response_model_exclude_none=True)
async def update_metrics(id: str = Path(..., alias="id"), metrics: CreateMetrics = Body(...)):
    await MetricsService.update_metrics(id, metrics)
    return ResponseSchema(detail="Metrics updated successfully")

@router.delete("/{id}", response_model=ResponseSchema, response_model_exclude_none=True)
async def delete_metrics(id: str = Path(..., alias="id")):
    await MetricsService.delete_metrics(id)
    return ResponseSchema(detail="Metrics deleted successfully")