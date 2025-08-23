import asyncio
import logging
from fastapi import FastAPI, BackgroundTasks
from uvicorn import Config, Server

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a test app
app = FastAPI()

# Global flag to check if task ran
task_executed = False

async def test_background_task(task_id: str):
    """Test background task that should execute."""
    global task_executed
    logger.info(f"[BACKGROUND] Task {task_id} starting...")
    await asyncio.sleep(1)  # Simulate some work
    logger.info(f"[BACKGROUND] Task {task_id} completed!")
    task_executed = True

@app.post("/test")
async def test_endpoint(background_tasks: BackgroundTasks):
    """Test endpoint that adds a background task."""
    logger.info("[ENDPOINT] Adding background task...")
    background_tasks.add_task(test_background_task, "test123")
    logger.info("[ENDPOINT] Background task added")
    return {"status": "task_added"}

@app.get("/check")
async def check_task():
    """Check if the background task executed."""
    global task_executed
    return {"task_executed": task_executed}

async def main():
    """Run the test server."""
    config = Config(app=app, host="127.0.0.1", port=8001, log_level="info")
    server = Server(config)
    
    # Start server
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())