#!/usr/bin/env python3
"""
Enhanced Telephony API with Monitoring
Provides REST API for telephony operations with comprehensive monitoring
"""

import os
import sys
import logging
from typing import Dict, Any
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from pydantic import BaseModel, Field

# Import enhanced services
from src.services.telephony_service_monitoring import telephony_service_with_monitoring
from src.services.gstreamer_service import gstreamer_service
from src.api.public.telephony_monitoring import call_tracker

# Import Bandwidth BXML models
from bandwidth.models.bxml.response import Response as BxmlResponse
from bandwidth.models.bxml.verbs.start_stream import StartStream

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/telephony", tags=["Telephony (Enhanced with Monitoring)"])

# Pydantic models
class StartCallRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    phone_number: str = Field(..., description="Phone number to call")

class EndCallRequest(BaseModel):
    call_id: str = Field(..., description="Call identifier")

class ProcessChunkRequest(BaseModel):
    call_id: str = Field(..., description="Call identifier")
    chunk_id: str = Field(..., description="Audio chunk identifier")
    audio_data: str = Field(..., description="Base64 encoded audio data")
    sequence: int = Field(..., description="Sequence number")

# --- BXML Generation Endpoint ---
@router.post("/bxml/start-stream", response_class=Response)
async def serve_start_stream_bxml(body: Dict[str, Any]):
    """
    Serves BXML to Bandwidth to start streaming audio to our WebSocket server.
    Enhanced with monitoring to track phone number flow.
    """
    call_id = body.get("callId")
    if not call_id:
        raise HTTPException(status_code=400, detail="callId is required")

    # Extract phone number from call data if available
    phone_number = body.get("to", "unknown")
    
    logger.info(f"[MONITORING] Generating BXML for callId: {call_id}, phone: {phone_number}")
    
    # Track BXML generation
    websocket_url = f"{os.environ.get('WEBSOCKET_URL', 'wss://localhost:8000')}/ws/{call_id}"
    call_tracker.track_bxml_generation(call_id, phone_number, websocket_url)

    response = BxmlResponse()
    start_stream = StartStream(
        name=f"stream-{call_id}",
        tracks="inbound",
        destination=websocket_url
    )
    response.add_verb(start_stream)
    
    return Response(content=response.to_bxml(), media_type="application/xml")

# --- Enhanced API Endpoints with Monitoring ---
@router.post("/start-call")
async def start_call(request: StartCallRequest):
    """Start a new telephony call with monitoring"""
    try:
        logger.info(f"[API] Starting call request: user={request.user_id}, phone={request.phone_number}")
        
        result = await telephony_service_with_monitoring.start_call(
            request.user_id,
            request.phone_number,
            "outbound"
        )
        
        logger.info(f"[API] Successfully started call: {result.get('call_id')} for {request.phone_number}")
        return {"success": True, "data": result}
        
    except Exception as e:
        logger.error(f"[API] Failed to start call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/end-call")
async def end_call(request: EndCallRequest):
    """End telephony call with monitoring"""
    try:
        logger.info(f"[API] Ending call request: {request.call_id}")
        
        result = await telephony_service_with_monitoring.end_call(request.call_id)
        
        logger.info(f"[API] Successfully ended call: {request.call_id}")
        return {"success": True, "data": result}
        
    except Exception as e:
        logger.error(f"[API] Failed to end call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-chunk")
async def process_chunk(request: ProcessChunkRequest):
    """Process audio chunk with monitoring"""
    try:
        logger.info(f"[API] Processing chunk {request.chunk_id} for call {request.call_id}")
        
        result = await telephony_service_with_monitoring.process_audio_chunk(
            request.call_id,
            request.chunk_id,
            request.audio_data,
            request.sequence
        )
        
        return {"success": True, "data": result}
        
    except Exception as e:
        logger.error(f"[API] Failed to process chunk: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{call_id}")
async def get_status(call_id: str):
    """Get call status with monitoring info"""
    try:
        result = await telephony_service_with_monitoring.get_call_status(call_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return {"success": True, "data": result}
        
    except Exception as e:
        logger.error(f"[API] Failed to get status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/call/{call_id}/details")
async def get_call_details(call_id: str):
    """Get detailed call information including monitoring data"""
    try:
        # Get call status from telephony service
        status = await telephony_service_with_monitoring.get_call_status(call_id)
        
        # Get call flow from monitoring
        flow = call_tracker.get_call_flow(call_id)
        
        # Validate phone number flow
        validation = call_tracker.validate_phone_number_flow(call_id)
        
        return {
            "success": True,
            "data": {
                "status": status,
                "flow": flow,
                "validation": validation,
                "monitoring": {
                    "tracked": call_id in call_tracker.tracked_calls,
                    "steps": len(flow.get("flow_steps", [])) if "error" not in flow else 0
                }
            }
        }
        
    except Exception as e:
        logger.error(f"[API] Failed to get call details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time communication
@router.websocket("/ws/{call_id}")
async def websocket_endpoint(websocket: WebSocket, call_id: str):
    await websocket.accept()
    logger.info(f"[WEBSOCKET] Connected for call {call_id}")
    
    try:
        await telephony_service_with_monitoring.handle_websocket_connection(websocket, f"/{call_id}")
    except WebSocketDisconnect:
        logger.info(f"[WEBSOCKET] Disconnected for call {call_id}")
    except Exception as e:
        logger.error(f"[WEBSOCKET] Error: {e}")

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint for enhanced telephony service"""
    return {
        "status": "healthy",
        "service": "telephony-enhanced",
        "monitoring": {
            "enabled": True,
            "tracked_calls": len(call_tracker.get_all_tracked_calls())
        },
        "bandwidth_sdk": "connected",
        "timestamp": datetime.now().isoformat()
    }

# Debug endpoint for testing
@router.get("/debug")
async def debug_info():
    """Debug information for development"""
    return {
        "service": "telephony-enhanced",
        "environment": {
            "BW_USERNAME": bool(os.environ.get("BW_USERNAME")),
            "BW_PASSWORD": bool(os.environ.get("BW_PASSWORD")),
            "BW_ACCOUNT_ID": bool(os.environ.get("BW_ACCOUNT_ID")),
            "BW_VOICE_APPLICATION_ID": bool(os.environ.get("BW_VOICE_APPLICATION_ID")),
            "BW_NUMBER": bool(os.environ.get("BW_NUMBER")),
            "BASE_CALLBACK_URL": os.environ.get("BASE_CALLBACK_URL")
        },
        "monitoring": {
            "tracked_calls": len(call_tracker.get_all_tracked_calls()),
            "active_calls": len(telephony_service_with_monitoring.active_calls)
        }
    }
