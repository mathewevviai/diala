from fastapi import FastAPI, UploadFile
from pydantic import BaseModel
from tasks.voice import stub as clone_and_generate

app = FastAPI(title="Diala Gateway")

class JobResponse(BaseModel):
    job_id: str

@app.post("/voice/generate", response_model=JobResponse)
async def generate_voice(text: str, prompt: UploadFile):
    _ = await prompt.read()       # we’ll wire this properly later
    job = clone_and_generate.delay(text)
    return {"job_id": job.id}
