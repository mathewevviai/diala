
import asyncio
import websockets
import json
import wave
import numpy as np
import logging

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_dynamic_generation():
    # The URI of your main backend's Nginx reverse proxy
    uri = "ws://127.0.0.1/api/public/ws/procedural-stream"
    audio_frames = []
    total_chunks_received = 0

    try:
        async with websockets.connect(uri, open_timeout=10) as websocket:
            # --- 1. Start the generation for 60 seconds ---
            start_message = {
                "action": "start",
                "prompt": "A bustling medieval marketplace. People chattering, merchants haggling, distant blacksmith hammer, a horse neighs occasionally.",
                "duration_seconds": 60
            }
            await websocket.send(json.dumps(start_message))
            logger.info(f">>> SENT: Start command with prompt: '{start_message['prompt']}' for {start_message['duration_seconds']}s")

            # --- 2. Receive the first few chunks (20 seconds) ---
            logger.info("<<< RECEIVING: Medieval marketplace ambience...")
            for _ in range(4):
                audio_chunk = await websocket.recv()
                audio_frames.append(audio_chunk)
                total_chunks_received += 1
                logger.info(f"Received chunk {total_chunks_received}")

            # --- 3. Interject with a new prompt ---
            interject_message = {
                "action": "interject",
                "prompt": "The sound of heavy rain starting to fall on the cobblestone, people rushing for cover"
            }
            await websocket.send(json.dumps(interject_message))
            logger.info(f"\n>>> SENT: Interjection with prompt: '{interject_message['prompt']}'\n")

            # --- 4. Receive the remaining chunks ---
            logger.info("<<< RECEIVING: Transitioning to rain...")
            try:
                while len(audio_frames) < 12:
                    audio_chunk = await asyncio.wait_for(websocket.recv(), timeout=20.0)
                    audio_frames.append(audio_chunk)
                    total_chunks_received += 1
                    logger.info(f"Received chunk {total_chunks_received}")
            except (asyncio.TimeoutError, websockets.exceptions.ConnectionClosed):
                logger.info("Stream finished or connection closed by server.")
            
            logger.info(f"<<< Finished receiving audio stream. Total chunks: {len(audio_frames)}")

    except Exception as e:
        logger.error(f"An error occurred during the test: {e}", exc_info=True)

    # --- 5. Save the final combined audio to a file ---
    if audio_frames:
        output_filename = "dynamic_scene_output_1min_FIXED.wav"
        logger.info(f"\nSaving full audio to '{output_filename}'...")
        
        try:
            # Combine all the byte strings into one large byte string
            raw_audio_data = b''.join(audio_frames)
            
            # Convert the raw bytes from float32 format into a NumPy array
            audio_float32 = np.frombuffer(raw_audio_data, dtype=np.float32)
            
            # ===================================================================
            # START OF DEFINITIVE FIX
            # ===================================================================
            # Normalize the audio from float (-1.0 to 1.0) to int16 (-32768 to 32767)
            # This is the standard, universally compatible format for WAV files.
            audio_int16 = (audio_float32 * 32767).astype(np.int16)
            # ===================================================================
            # END OF DEFINITIVE FIX
            # ===================================================================

            with wave.open(output_filename, 'wb') as wf:
                wf.setnchannels(1)       # Mono audio from audiocraft
                # MODIFIED: Set sample width to 2 bytes for int16
                wf.setsampwidth(2)       
                wf.setframerate(16000)   # AudioCraft's native sample rate
                # MODIFIED: Write the correctly formatted int16 bytes
                wf.writeframes(audio_int16.tobytes())
            logger.info(f"Save complete. File '{output_filename}' created successfully.")
        except Exception as e:
            logger.error(f"Failed to save WAV file: {e}", exc_info=True)

if __name__ == "__main__":
    asyncio.run(test_dynamic_generation()
