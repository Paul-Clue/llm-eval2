from pydantic import BaseModel

class SearchRequest(BaseModel):
    systemPrompt: str
    userPrompt: str
    expectedOutput: str
    model: str