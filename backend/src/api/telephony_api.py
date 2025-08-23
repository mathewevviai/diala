#!/usr/bin/env python3
"""
Telephony API Endpoints
Provides REST API for telephony operations and serves BXML for call control.
"""

import os
import sys
import logging
from typing import Dict, Any
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from pydantic import BaseModel, Field
import uvicorn

# Import services and Bandwidth BXML models
from src.services.telephony_service import telephony_service
from src.services.gstreamer_service import gstreamer_service
from bandwidth.models.bxml.response import Response as BxmlResponse
from bandwidth.models.bxml.verbs.start_stream import StartStream

# --- Environment Variables ---
WEBSOCKET_URL = os.environ.get("WEBSOCKET_URL") # e.g., wss://myapp.com/ws

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Diala Telephony API", version="1.0.0")

# Pydantic models (rest of the models are the same)
class StartCallRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    phone_number: str = Field(..., description="Phone number to call")

class EndCallRequest(BaseModel):
    call_id: str = Field(..., description="Call identifier")

# --- BXML Generation Endpoint ---
@app.post("/bxml/start-stream", response_class=Response)
async def serve_start_stream_bxml(body: Dict[str, Any]):
    """
    Serves BXML to Bandwidth to start streaming audio to our WebSocket server.
    This endpoint is used as the 'answerUrl' in the create_call request.
    """
    call_id = body.get("callId")
    if not call_id:
        raise HTTPException(status_code=400, detail="callId is required")

    logger.info(f"Generating BXML for callId: {call_id}")
    
    # Construct the full WebSocket destination URL
    destination_url = f"{WEBSOCKET_URL}/{call_id}"

    response = BxmlResponse()
    start_stream = StartStream(
        name=f"stream-{call_id}",
        tracks="inbound",  # Stream audio from the callee (the person who answers the phone)
        destination=destination_url
    )
    response.add_verb(start_stream)
    
    return Response(content=response.to_bxml(), media_type="application/xml")

# --- API Endpoints ---
@app.post("/api/telephony/start-call")
async def start_call(request: StartCallRequest):
    """Start a new telephony call"""
    try:
        result = await telephony_service.start_call(
            request.user_id,
            request.phone_number,
            "outbound"
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Failed to start call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/telephony/end-call")
async def end_call(request: EndCallRequest):
    """End telephony call"""
    try:
        result = await telephony_service.end_call(request.call_id)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Failed to end call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/telephony/status/{call_id}")
async def get_status(call_id: str):
    """Get call status"""
    result = await telephony_service.get_call_status(call_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return {"success": True, "data": result}

# WebSocket endpoint is now managed by gstreamer_service
@app.websocket("/ws/{call_id}")
async def websocket_endpoint(websocket: WebSocket, call_id: str):
    await gstreamer_service.websocket_server.handler(websocket, f"/{call_id}")

@app.on_event("startup")
async def startup_event():
    """Startup tasks"""
    logger.info("Starting Telephony API")
    # The GStreamer service now starts its own WebSocket server
    try:
        await gstreamer_service.start_websocket_server(8766) # Use port 8766 to avoid conflicts
        logger.info("WebSocket server started on port 8766")
    except Exception as e:
        logger.error(f"Failed to start WebSocket server: {e}")

if __name__ == "__main__":
    uvicorn.run("telephony_api:app", host="0.0.0.0", port=8000, reload=True)