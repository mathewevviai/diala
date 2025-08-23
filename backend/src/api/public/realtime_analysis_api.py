from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
from src.services.realtime_analysis_service import get_realtime_analysis_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/analyze-stream")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio analysis.
    
    Receives raw audio chunks (16-bit, 16kHz PCM) and returns a JSON object
    containing the transcription, sentiment, and relevant documents retrieved
    from the vector knowledge base.
    """
    await websocket.accept()
    analysis_service = get_realtime_analysis_service()
    logger.info("WebSocket client connected for real-time analysis.")
    try:
        while True:
            audio_bytes = await websocket.receive_bytes()
            
            # Process the chunk using our dedicated service
            result = await analysis_service.process_audio_chunk(audio_bytes)
            
            # Only send a message back if text was transcribed
            if result.get("text"):
                logger.info(f"Sending analysis: Sentiment={result['sentiment']}, Text='{result['text']}'")
                await websocket.send_json(result)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"Error in analysis websocket: {e}", exc_info=True)
        await websocket.close(code=1011, reason=f"Internal Server Error: {e}")
