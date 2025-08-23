import io
import os
import sys
import wave
import numpy as np

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware


if sys.platform == "darwin":
    os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

now_dir = os.getcwd()
sys.path.append(now_dir)

from typing import Optional

import ChatTTS

from tools.audio import pcm_arr_to_mp3_view
from tools.logger import get_logger
import torch


from pydantic import BaseModel
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from tools.normalizer.zh import normalizer_zh_tn

logger = get_logger("Command")

app = FastAPI()

# CORS Middleware Configuration START
origins = [
    "http://localhost",
    "http://localhost:8000", # Assuming your frontend runs on port 8000
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    # Add any other origins your frontend might be served from
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
# CORS Middleware Configuration END

@app.on_event("startup")
async def startup_event():
    global chat

    chat = ChatTTS.Chat(get_logger("ChatTTS"))
    
    try:
        from tools.normalizer.en import normalizer_en_nemo_text
        chat.normalizer.register("en", normalizer_en_nemo_text())
        logger.info("Registered Nemo English normalizer.")
    except ModuleNotFoundError:
        logger.warn("Module 'nemo_text_processing' not found. Skipping English normalizer registration. English TTS might have reduced quality or errors.")
    except Exception as e:
        logger.error(f"Error registering English normalizer: {e}. English TTS might be affected.")

    # Chinese normalizer (assuming tn_chinese is available or has no such OS-specific issues)
    try:
        chat.normalizer.register("zh", normalizer_zh_tn())
        logger.info("Registered Chinese normalizer.")
    except Exception as e:
        logger.error(f"Error registering Chinese normalizer: {e}")

    logger.info("Initializing ChatTTS...")
    if chat.load(source="huggingface"):
        logger.info("Models loaded successfully.")
    else:
        logger.error("Models load failed.")
        sys.exit(1)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


class ChatTTSParams(BaseModel):
    text: str
    lang: Optional[str] = None
    params_refine_text: Optional[ChatTTS.Chat.RefineTextParams] = None
    params_infer_code: Optional[ChatTTS.Chat.InferCodeParams] = None


def generate_wav_header(sample_rate, bits_per_sample, channels, datasize):
    o = bytes()
    o += b'RIFF' # ChunkID
    o += (datasize + 36).to_bytes(4, 'little') # ChunkSize
    o += b'WAVE' # Format
    o += b'fmt ' # Subchunk1ID
    o += (16).to_bytes(4, 'little') # Subchunk1Size (16 for PCM)
    o += (1).to_bytes(2, 'little') # AudioFormat (1 for PCM)
    o += channels.to_bytes(2, 'little') # NumChannels
    o += sample_rate.to_bytes(4, 'little') # SampleRate
    byte_rate = sample_rate * channels * bits_per_sample // 8
    o += byte_rate.to_bytes(4, 'little') # ByteRate
    block_align = channels * bits_per_sample // 8
    o += block_align.to_bytes(2, 'little') # BlockAlign
    o += bits_per_sample.to_bytes(2, 'little') # BitsPerSample
    o += b'data' # Subchunk2ID
    o += datasize.to_bytes(4, 'little') # Subchunk2Size
    return o

async def audio_streamer(text_input: str, lang_input: Optional[str], params_infer_code_input: Optional[ChatTTS.Chat.InferCodeParams], params_refine_text_input: Optional[ChatTTS.Chat.RefineTextParams]):
    global chat
    sample_rate = 24000 # ChatTTS default
    bits_per_sample = 16
    channels = 1

    # Use provided infer_code params or create default if None
    p_infer_code = params_infer_code_input if params_infer_code_input is not None else ChatTTS.Chat.InferCodeParams()
    # Use provided refine_text params or create default if None (or decide if it should be mandatory/simpler)
    p_refine_text = params_refine_text_input if params_refine_text_input is not None else ChatTTS.Chat.RefineTextParams()

    # Text refining (optional, based on whether params_refine_text is substantially populated or a flag)
    # For simplicity, this example assumes client might not always send p_refine_text for refinement.
    # If p_refine_text is an empty default, refine_text_only might not be what's intended.
    # A clearer flag like `perform_refinement: bool` might be better if this logic is kept.
    refined_text_to_infer = text_input
    if p_refine_text and p_refine_text.prompt: # crude check if refinement is intended
        logger.info(f"Refining text: {text_input} with prompt: {p_refine_text.prompt}")
        refined_text_to_infer = chat.infer(
            text=[text_input], # chat.infer expects a list for text
            skip_refine_text=False, 
            refine_text_only=True,
            params_refine_text=p_refine_text
        )
        if isinstance(refined_text_to_infer, list): refined_text_to_infer = refined_text_to_infer[0]
        logger.info(f"Refined text for inference: {refined_text_to_infer}")
    
    # Main inference to get audio
    # ChatTTS.infer typically returns a list of numpy arrays (wavs)
    wav_list = chat.infer(
        text=[refined_text_to_infer], # chat.infer expects a list
        lang=lang_input,
        # skip_refine_text should be True here if text was already refined, or handle appropriately
        skip_refine_text=True, # Assuming text is now ready for pure inference
        use_decoder=True, # Default
        params_infer_code=p_infer_code,
        # params_refine_text should ideally be minimal or None if text is already refined
        # If refinement happened above, passing full p_refine_text again might be redundant or have unintended effects
        params_refine_text=ChatTTS.Chat.RefineTextParams() # Pass a minimal one if refinement done
    )

    if not wav_list or not isinstance(wav_list, list) or len(wav_list) == 0:
        logger.error("ChatTTS inference did not return valid audio data.")
        # Yield nothing or an error indicator if possible with StreamingResponse
        return

    # Process the first audio result
    wav_data_float = wav_list[0] # Get the first numpy array
    if not isinstance(wav_data_float, np.ndarray):
        logger.error("ChatTTS audio data is not a numpy array.")
        return

    # Normalize and convert to 16-bit PCM
    wav_data_int16 = (wav_data_float * 32767).astype(np.int16)
    pcm_data = wav_data_int16.tobytes()

    header = generate_wav_header(sample_rate, bits_per_sample, channels, len(pcm_data))
    yield header
    
    # Stream PCM data in chunks (optional, can yield all at once if not too large)
    chunk_size = 4096 # Bytes
    for i in range(0, len(pcm_data), chunk_size):
        yield pcm_data[i:i+chunk_size]

@app.post("/generate_voice")
async def generate_voice(params: ChatTTSParams):
    logger.info(f"Text input for WAV: {params.text}")

    if params.params_infer_code and params.params_infer_code.manual_seed is not None:
        torch.manual_seed(params.params_infer_code.manual_seed)
        if chat.speaker:
             # Ensure spk_emb is set if manual_seed is used for speaker sampling
            params.params_infer_code.spk_emb = chat.sample_random_speaker()
        else:
            logger.warn("ChatTTS 'chat' object or 'speaker' attribute not initialized. Cannot sample random speaker.")

    # Log speaker details if available
    if params.params_infer_code and params.params_infer_code.spk_emb:
        logger.info(f"Using speaker embedding: {params.params_infer_code.spk_emb[:30]}...") # Log first few chars
    else:
        logger.info("No specific speaker embedding provided in params_infer_code, using default or random.")

    return StreamingResponse(
        audio_streamer(params.text, params.lang, params.params_infer_code, params.params_refine_text),
        media_type="audio/wav"
    )
