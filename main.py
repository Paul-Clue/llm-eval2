import uvicorn
from fastapi import FastAPI

def init_app():
  app = FastAPI(
    title="LLM Evaluation API",
    description="API for evaluating LLMs",
    version="1.0.0",
  )

  @app.on_event("startup")
  async def startup():
    print("Starting up server!")
    # await prisma.connect()

  @app.on_event("shutdown")
  async def shutdown():
    print("Shutting down server!")
    # await prisma.disconnect()

  @app.get("/")
  async def home():
    return {"message": "Hello World"}

  return app
app = init_app()

if __name__ == "__main__":
  uvicorn.run("main:app", host="localhost", port=8000, reload=True)

