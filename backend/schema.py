from typing import List,TypeVar, Optional, Generic
from pydantic import BaseModel

T = TypeVar('T')
class GroqChoice(BaseModel):
    index: int
    message: dict
    finish_reason: str

class ResponseSchema(BaseModel, Generic[T]):
    detail: str
    result: Optional[T] = None

class GroqResponseSchema(BaseModel):
    id: str
    object: str
    created: int
    model: str
    choices: List[GroqChoice]
