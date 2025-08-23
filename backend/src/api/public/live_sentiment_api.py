from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import time
from src.services.realtime_analysis_service import get_realtime_analysis_service

router = APIRouter()
# Use a dedicated logger for this module for better filtering
logger = logging.getLogger("live_sentiment_api")
logger.setLevel(logging.INFO) # Ensure we capture INFO level logs

@router.websocket("/ws/live-sentiment")
async def websocket_live_sentiment_endpoint(websocket: WebSocket, job_id: str = None):
    """
    WebSocket endpoint for real-time transcription and sentiment analysis from a live audio stream.
    """
    await websocket.accept()
    analysis_service = get_realtime_analysis_service()
    client_id = f"{websocket.client.host}:{websocket.client.port}"
    session_id = job_id or client_id
    
    logger.info(f"[{session_id}] Client connected for live sentiment analysis.")
    
    try:
        while True:
            # --- START OF VERBOSE LOGGING ---
            receive_start_time = time.perf_counter()
            audio_bytes = await websocket.receive_bytes()
            receive_end_time = time.perf_counter()
            
            logger.info(f"[{session_id}] Received {len(audio_bytes)} bytes of audio. (Receive time: {(receive_end_time - receive_start_time)*1000:.2f} ms)")
            
            processing_start_time = time.perf_counter()
            result = await analysis_service.process_sentiment_chunk(audio_bytes)
            processing_end_time = time.perf_counter()
            
            logger.info(f"[{session_id}] AI processing complete. (Processing time: {(processing_end_time - processing_start_time)*1000:.2f} ms)")
            # --- END OF VERBOSE LOGGING ---
            
            if result:
                send_start_time = time.perf_counter()
                await websocket.send_json(result)
                send_end_time = time.perf_counter()
                
                logger.info(f"[{session_id}] Sent result: Sentiment={result['sentiment']}, Text='{result['text']}'. (Send time: {(send_end_time - send_start_time)*1000:.2f} ms)")

    except WebSocketDisconnect:
        logger.info(f"[{session_id}] Client disconnected from live sentiment session.")
    except Exception as e:
        logger.error(f"[{session_id}] Error in live sentiment websocket: {e}", exc_info=True)
        await websocket.close(code=1011, reason=f"Internal Server Error: {str(e)}")
