#!/usr/bin/env python3
"""
Telephony Monitoring API
Provides endpoints for tracking phone number flow through services
"""

import os
import sys
import logging
import json
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Import services
from src.services.telephony_service import telephony_service
from src.services.gstreamer_service import gstreamer_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/monitoring", tags=["Telephony Monitoring"])

# Global call tracking storage
call_flow_tracker = {}

class CallFlowTracker:
    """Tracks phone number flow through all services"""
    
    def __init__(self):
        self.tracked_calls = {}
    
    def track_call_start(self, call_id: str, phone_number: str, user_id: str, direction: str):
        """Track when a call starts"""
        self.tracked_calls[call_id] = {
            "call_id": call_id,
            "phone_number": phone_number,
            "user_id": user_id,
            "direction": direction,
            "start_time": datetime.now().isoformat(),
            "flow_steps": [
                {
                    "step": "call_initiated",
                    "service": "convex",
                    "phone_number": phone_number,
                    "timestamp": datetime.now().isoformat(),
                    "metadata": {"user_id": user_id, "direction": direction}
                }
            ],
            "current_step": "call_initiated",
            "status": "initiated"
        }
        logger.info(f"[FLOW TRACKER] Call {call_id} initiated for {phone_number}")
    
    def track_bandwidth_call(self, call_id: str, bandwidth_call_id: str, phone_number: str):
        """Track when call reaches Bandwidth"""
        if call_id in self.tracked_calls:
            self.tracked_calls[call_id]["bandwidth_call_id"] = bandwidth_call_id
            self.tracked_calls[call_id]["flow_steps"].append({
                "step": "bandwidth_call_created",
                "service": "bandwidth",
                "phone_number": phone_number,
                "timestamp": datetime.now().isoformat(),
                "metadata": {"bandwidth_call_id": bandwidth_call_id}
            })
            self.tracked_calls[call_id]["current_step"] = "bandwidth_call_created"
            logger.info(f"[FLOW TRACKER] Bandwidth call created: {bandwidth_call_id} for {phone_number}")
    
    def track_bxml_generation(self, call_id: str, phone_number: str, bxml_url: str):
        """Track BXML generation"""
        if call_id in self.tracked_calls:
            self.tracked_calls[call_id]["flow_steps"].append({
                "step": "bxml_generated",
                "service": "fastapi",
                "phone_number": phone_number,
                "timestamp": datetime.now().isoformat(),
                "metadata": {"bxml_url": bxml_url}
            })
            self.tracked_calls[call_id]["current_step"] = "bxml_generated"
            logger.info(f"[FLOW TRACKER] BXML generated for {phone_number} in call {call_id}")
    
    def track_websocket_connection(self, call_id: str, phone_number: str, websocket_url: str):
        """Track WebSocket connection"""
        if call_id in self.tracked_calls:
            self.tracked_calls[call_id]["flow_steps"].append({
                "step": "websocket_connected",
                "service": "websocket",
                "phone_number": phone_number,
                "timestamp": datetime.now().isoformat(),
                "metadata": {"websocket_url": websocket_url}
            })
            self.tracked_calls[call_id]["current_step"] = "websocket_connected"
            logger.info(f"[FLOW TRACKER] WebSocket connected for {phone_number} in call {call_id}")
    
    def track_audio_processing(self, call_id: str, phone_number: str, chunk_id: str):
        """Track audio processing"""
        if call_id in self.tracked_calls:
            self.tracked_calls[call_id]["flow_steps"].append({
                "step": "audio_processing",
                "service": "asr_service",
                "phone_number": phone_number,
                "timestamp": datetime.now().isoformat(),
                "metadata": {"chunk_id": chunk_id}
            })
    
    def track_call_complete(self, call_id: str, phone_number: str, duration: float):
        """Track call completion"""
        if call_id in self.tracked_calls:
            self.tracked_calls[call_id]["flow_steps"].append({
                "step": "call_completed",
                "service": "telephony",
                "phone_number": phone_number,
                "timestamp": datetime.now().isoformat(),
                "metadata": {"duration": duration}
            })
            self.tracked_calls[call_id]["current_step"] = "call_completed"
            self.tracked_calls[call_id]["status"] = "completed"
            self.tracked_calls[call_id]["end_time"] = datetime.now().isoformat()
            logger.info(f"[FLOW TRACKER] Call {call_id} completed for {phone_number}")
    
    def get_call_flow(self, call_id: str) -> Dict[str, Any]:
        """Get complete call flow for debugging"""
        return self.tracked_calls.get(call_id, {"error": "Call not found"})
    
    def get_all_tracked_calls(self) -> List[Dict[str, Any]]:
        """Get all tracked calls"""
        return list(self.tracked_calls.values())
    
    def validate_phone_number_flow(self, call_id: str) -> Dict[str, Any]:
        """Validate that phone number is correctly passed through all services"""
        if call_id not in self.tracked_calls:
            return {"valid": False, "error": "Call not found"}
        
        call_data = self.tracked_calls[call_id]
        phone_number = call_data["phone_number"]
        
        validation_result = {
            "call_id": call_id,
            "phone_number": phone_number,
            "valid": True,
            "issues": [],
            "steps_validated": []
        }
        
        # Check each step for phone number consistency
        for step in call_data["flow_steps"]:
            step_phone = step.get("phone_number")
            if step_phone != phone_number:
                validation_result["valid"] = False
                validation_result["issues"].append({
                    "step": step["step"],
                    "service": step["service"],
                    "expected": phone_number,
                    "actual": step_phone,
                    "issue": "Phone number mismatch"
                })
            else:
                validation_result["steps_validated"].append({
                    "step": step["step"],
                    "service": step["service"],
                    "phone_number": step_phone,
                    "status": "validated"
                })
        
        return validation_result

# Global tracker instance
call_tracker = CallFlowTracker()

# Pydantic models
class DebugRequest(BaseModel):
    call_id: str = Field(..., description="Call ID to debug")

class ValidationRequest(BaseModel):
    call_id: str = Field(..., description="Call ID to validate")

# --- Monitoring Endpoints ---

@router.get("/calls")
async def get_all_calls():
    """Get all tracked calls with their flow data"""
    return {
        "success": True,
        "data": call_tracker.get_all_tracked_calls(),
        "total_calls": len(call_tracker.get_all_tracked_calls())
    }

@router.get("/call/{call_id}")
async def get_call_flow(call_id: str):
    """Get detailed call flow for a specific call"""
    flow = call_tracker.get_call_flow(call_id)
    if "error" in flow:
        raise HTTPException(status_code=404, detail=flow["error"])
    return {"success": True, "data": flow}

@router.post("/validate")
async def validate_call_flow(request: ValidationRequest):
    """Validate phone number flow for a specific call"""
    validation = call_tracker.validate_phone_number_flow(request.call_id)
    return {"success": True, "data": validation}

@router.get("/health")
async def monitoring_health():
    """Health check for monitoring service"""
    return {
        "status": "healthy",
        "service": "telephony-monitoring",
        "tracked_calls": len(call_tracker.get_all_tracked_calls()),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/debug/{call_id}")
async def debug_call(call_id: str):
    """Debug endpoint with detailed call information"""
    flow = call_tracker.get_call_flow(call_id)
    if "error" in flow:
        raise HTTPException(status_code=404, detail=flow["error"])
    
    # Add additional debug info
    debug_info = {
        "call_flow": flow,
        "validation": call_tracker.validate_phone_number_flow(call_id),
        "active_calls": len(telephony_service.active_calls),
        "gstreamer_jobs": len(gstreamer_service.active_jobs) if hasattr(gstreamer_service, 'active_jobs') else 0,
        "timestamp": datetime.now().isoformat()
    }
    
    return {"success": True, "data": debug_info}

@router.get("/recent")
async def get_recent_calls(limit: int = 10):
    """Get recent calls sorted by start time"""
    all_calls = call_tracker.get_all_tracked_calls()
    sorted_calls = sorted(all_calls, key=lambda x: x.get("start_time", ""), reverse=True)
    return {
        "success": True,
        "data": sorted_calls[:limit],
        "total": len(sorted_calls)
    }

# Export the tracker for use in other services
__all__ = ['call_tracker', 'CallFlowTracker']
