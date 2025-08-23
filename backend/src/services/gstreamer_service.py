#!/usr/bin/env python3
"""
Service for handling real-time audio streams via WebSocket.
Receives audio from Bandwidth's <StartStream> verb and forwards it for processing.
"""

import os
import sys
import asyncio
import json
import logging
from typing import Dict, Any
from pathlib import Path
import websockets
import websockets.server

# Add project root to path
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the main telephony service
from src.services.telephony_service import telephony_service

class WebSocketHandler:
    """Handles WebSocket connections for real-time audio streaming from Bandwidth."""
    
    async def handle_connection(self, websocket, path):
        """Handle incoming WebSocket connection from Bandwidth."""
        
        try:
            # The path will contain the callId, e.g., /ws/c-1234...
            call_id = path.strip("/").split("/")[-1]
            logger.info(f"WebSocket connection established for call {call_id}")
            
            if call_id not in telephony_service.active_calls:
                await websocket.close(code=1008, reason="Call not found")
                logger.warning(f"WebSocket connection for unknown callId {call_id} rejected.")
                return

            async for message in websocket:
                try:
                    data = json.loads(message)
                    
                    # Process incoming media from Bandwidth stream
                    if data.get("event") == "media":
                        chunk_id = f"chunk_{data['sequence']}"
                        audio_data = data["media"]["payload"] # Base64 encoded audio
                        
                        # Pass to telephony service for processing
                        await telephony_service.process_audio_chunk(
                            call_id,
                            chunk_id,
                            audio_data,
                            data['sequence']
                        )
                        
                except json.JSONDecodeError:
                    logger.warning(f"Received non-JSON message on WebSocket for call {call_id}")
                except Exception as e:
                    logger.error(f"WebSocket message error for call {call_id}: {e}")

        except websockets.exceptions.ConnectionClosed:
            logger.info(f"WebSocket disconnected for call {call_id}")
        except Exception as e:
            logger.error(f"WebSocket handler error for call {call_id}: {e}")

class GStreamerService:
    """Service to manage the WebSocket server."""
    
    def __init__(self):
        self.websocket_server = None

    async def start_websocket_server(self, port: int = 8765):
        """Start WebSocket server to listen for Bandwidth audio streams."""
        handler = WebSocketHandler()
        logger.info(f"Starting WebSocket server on port {port}")
        
        self.websocket_server = await websockets.serve(
            handler.handle_connection,
            "0.0.0.0",
            port
        )
        return self.websocket_server

    async def stop_websocket_server(self):
        """Stop the WebSocket server."""
        if self.websocket_server:
            self.websocket_server.close()
            await self.websocket_server.wait_closed()
            logger.info("WebSocket server stopped")

# Global service instance
gstreamer_service = GStreamerService()