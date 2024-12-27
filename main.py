import uvicorn
from fastapi import FastAPI
from Config.Connection import connect_db, disconnect_db
from Controller import metrics

def init_app():
  app = FastAPI(
    title="LLM Evaluation API",
    description="API for evaluating LLMs",
    version="1.0.0",
  )

  @app.on_event("startup")
  async def startup():
    print("Starting up server!")
    await connect_db()

  @app.on_event("shutdown")
  async def shutdown():
    print("Shutting down server!")
    await disconnect_db()

  @app.get("/")
  async def home():
    return {"message": "Hello World"}
  
  app.include_router(metrics.router)

  return app
app = init_app()

if __name__ == "__main__":
  uvicorn.run("main:app", host="localhost", port=8000, reload=True)

