import asyncio
import websockets
import json
import sounddevice as sd
import numpy as np
import logging

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Configuration ---
WEBSOCKET_URI = "ws://127.0.0.1:8000/api/v1/ws/live-sentiment?job_id=mic_test_123"
SAMPLE_RATE = 16000  # Must match the server's expected sample rate
CHUNK_SECONDS = 2    # Send audio in 2-second chunks
BLOCK_SIZE = int(SAMPLE_RATE * CHUNK_SECONDS)

# --- Shared Queue for Audio Data ---
audio_queue = asyncio.Queue()

def audio_callback(indata, frames, time, status):
    """This function is called by the sounddevice stream for each audio block."""
    if status:
        logger.warning(status)
    # The audio data is in float32, we convert to int16 for the server
    audio_int16 = (indata * 32767).astype(np.int16)
    audio_queue.put_nowait(audio_int16.tobytes())

async def stream_microphone_audio(websocket):
    """Streams audio from the queue to the WebSocket server."""
    logger.info("Starting to stream microphone audio...")
    try:
        while True:
            audio_bytes = await audio_queue.get()
            await websocket.send(audio_bytes)
    except websockets.exceptions.ConnectionClosed:
        logger.info("Connection closed, stopping microphone stream.")
    except Exception as e:
        logger.error(f"Error in microphone streaming task: {e}")

async def receive_analysis_results(websocket):
    """Receives and prints analysis results from the WebSocket server."""
    logger.info("Listening for analysis results...")
    try:
        async for message in websocket:
            data = json.loads(message)
            print(f"\n--- ANALYSIS RECEIVED ---\n  Sentiment: {data['sentiment']}\n  Text: '{data['text']}'\n-------------------------\n")
    except websockets.exceptions.ConnectionClosed:
        logger.info("Connection closed, stopping result listener.")
    except Exception as e:
        logger.error(f"Error in results receiving task: {e}")

async def main():
    """Main function to set up the microphone stream and WebSocket connection."""
    try:
        # Start the microphone input stream
        with sd.InputStream(samplerate=SAMPLE_RATE, blocksize=BLOCK_SIZE, channels=1, dtype='float32', callback=audio_callback):
            logger.info("Microphone is active. Connecting to server...")
            # Connect to the WebSocket server
            async with websockets.connect(WEBSOCKET_URI) as websocket:
                logger.info("Successfully connected to WebSocket server.")
                
                # Run the streaming and receiving tasks concurrently
                streaming_task = asyncio.create_task(stream_microphone_audio(websocket))
                receiving_task = asyncio.create_task(receive_analysis_results(websocket))

                # Wait for either task to complete (e.g., if the connection closes)
                done, pending = await asyncio.wait(
                    [streaming_task, receiving_task],
                    return_when=asyncio.FIRST_COMPLETED,
                )
                
                for task in pending:
                    task.cancel()
        
    except Exception as e:
        logger.error(f"An error occurred: {e}", exc_info=True)

if __name__ == "__main__":
    print("Starting real-time sentiment analysis test from microphone.")
    print("Speak into your microphone. Press Ctrl+C to stop.")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTest stopped by user.")

