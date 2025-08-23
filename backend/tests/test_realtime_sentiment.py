# File: tests/test_realtime_sentiment.py (Updated Version)

import os
import json
import asyncio
from pathlib import Path
import logging
import sys
import numpy as np
import torch
import librosa
import tempfile
import soundfile as sf
import time
import joblib
import textwrap
from tqdm import tqdm
import langextract as lx

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

# --- Setup and Imports ---
log_format = '%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
logging.basicConfig(level=logging.INFO, format=log_format)
logger = logging.getLogger(__name__)

project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
env_path = project_root / ".env"
if env_path.exists(): load_dotenv(dotenv_path=env_path)

from src.services.realtime_analysis_service import get_realtime_analysis_service

# Define paths
BASE_DIR = project_root
INPUT_DIR = BASE_DIR / "tests" / "data" / "GlenCoco"
OUTPUT_DIR = BASE_DIR / "results"
OUTPUT_FILE = OUTPUT_DIR / "realtime_sentiment_analysis_V2.json"
MODEL_DIR = BASE_DIR / "models" / "sentiment_classifier" # Path to trained model

# --- START: NEW Trained Sentiment Classifier ---
class SentimentClassifier:
    """
    Loads and uses a pre-trained scikit-learn model to classify sentiment
    based on prosody features.
    """
    def __init__(self, model_path: Path):
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.feature_keys = ["duration_sec", "avg_pitch", "pitch_std", "avg_energy", "voiced_ratio"]
        
        try:
            logger.info(f"Loading sentiment model from {model_path}...")
            self.model = joblib.load(model_path / "sentiment_model.pkl")
            self.scaler = joblib.load(model_path / "scaler.pkl")
            self.label_encoder = joblib.load(model_path / "label_encoder.pkl")
            logger.info("Sentiment model loaded successfully.")
        except FileNotFoundError:
            logger.error(f"Model artifacts not found in {model_path}. Please run tests/train_sentiment_model.py first.")
            raise
    
    def classify(self, features: dict) -> str:
        if not all([self.model, self.scaler, self.label_encoder]):
            return "MODEL_NOT_LOADED"
        if not features:
            return "NO_FEATURES"
            
        try:
            # 1. Create feature vector in the correct order
            feature_vector = np.array([[features.get(key, 0) for key in self.feature_keys]])
            
            # 2. Scale the features using the loaded scaler
            scaled_features = self.scaler.transform(feature_vector)
            
            # 3. Predict the numerical label
            prediction_numeric = self.model.predict(scaled_features)
            
            # 4. Convert the numerical label back to a string label (e.g., "positive")
            prediction_label = self.label_encoder.inverse_transform(prediction_numeric)
            
            return prediction_label[0].upper()
        except Exception as e:
            logger.error(f"Error during classification: {e}")
            return "CLASSIFICATION_ERROR"

# Initialize the new classifier
try:
    sentiment_classifier = SentimentClassifier(MODEL_DIR)
except FileNotFoundError:
    sentiment_classifier = None # Handle case where model is not trained yet

# --- START: LangExtract Integration ---
class LangExtractSentimentAnalyzer:
    """
    Uses LangExtract to extract structured emotional and contextual information
    from transcribed text using LLM-based information extraction.
    """
    
    def __init__(self):
        self.prompt = textwrap.dedent("""
            Extract emotional states, sentiment indicators, and contextual information from the transcribed text.
            Focus on identifying:
            1. Primary emotional state (e.g., happy, sad, angry, neutral, anxious, excited)
            2. Sentiment polarity (positive, negative, neutral)
            3. Emotional intensity (low, medium, high)
            4. Contextual triggers or topics mentioned
            5. Speaker confidence indicators
            
            Use exact text for extractions and provide meaningful attributes for context.
        """)
        
        self.examples = [
            lx.data.ExampleData(
                text="I'm really frustrated with this customer service experience.",
                extractions=[
                    lx.data.Extraction(
                        extraction_class="emotion",
                        extraction_text="frustrated",
                        attributes={"type": "negative", "intensity": "high"}
                    ),
                    lx.data.Extraction(
                        extraction_class="sentiment",
                        extraction_text="negative",
                        attributes={"confidence": "high", "context": "customer service"}
                    ),
                    lx.data.Extraction(
                        extraction_class="context",
                        extraction_text="customer service experience",
                        attributes={"topic": "support", "sentiment_trigger": "true"}
                    )
                ]
            ),
            lx.data.ExampleData(
                text="This is amazing news, I'm so excited about the opportunity!",
                extractions=[
                    lx.data.Extraction(
                        extraction_class="emotion",
                        extraction_text="excited",
                        attributes={"type": "positive", "intensity": "high"}
                    ),
                    lx.data.Extraction(
                        extraction_class="sentiment",
                        extraction_text="positive",
                        attributes={"confidence": "high", "context": "opportunity"}
                    )
                ]
            )
        ]
    
    def analyze_text(self, text: str) -> dict:
        """Analyze text using LangExtract for detailed sentiment extraction."""
        if not text or not text.strip():
            return {"error": "Empty text provided"}
        
        try:
            result = lx.extract(
                text_or_documents=text,
                prompt_description=self.prompt,
                examples=self.examples,
                model_id="gemini-2.5-flash",
                extraction_passes=2,
                max_workers=5
            )
            
            # Process extractions into structured format
            analysis = {
                "emotions": [],
                "sentiments": [],
                "contexts": [],
                "raw_extractions": []
            }
            
            for extraction in result.extractions:
                extraction_data = {
                    "class": extraction.extraction_class,
                    "text": extraction.extraction_text,
                    "attributes": extraction.attributes or {}
                }
                analysis["raw_extractions"].append(extraction_data)
                
                if extraction.extraction_class == "emotion":
                    analysis["emotions"].append(extraction_data)
                elif extraction.extraction_class == "sentiment":
                    analysis["sentiments"].append(extraction_data)
                elif extraction.extraction_class == "context":
                    analysis["contexts"].append(extraction_data)
            
            return analysis
            
        except Exception as e:
            logger.error(f"LangExtract analysis failed: {e}")
            return {"error": str(e)}

# Initialize LangExtract analyzer
langextract_analyzer = LangExtractSentimentAnalyzer()
# --- END: LangExtract Integration ---

async def simulate_realtime_call_analysis(file_path: Path):
    logger.info(f"Simulating real-time analysis for: {file_path.name}")
    
    # Get realtime analysis service
    realtime_service = await get_realtime_analysis_service()
    
    y, sr = librosa.load(str(file_path), sr=16000, mono=True)
    chunk_len = int(3.0 * sr)
    chunks = [y[i:i + chunk_len] for i in range(0, len(y), chunk_len)]
    
    logger.info(f"Split audio into {len(chunks)} chunks.")
    logger.info("Processing all chunks with realtime analysis service...")
    
    start_time = time.time()
    processing_time = time.time() - start_time
    
    logger.info(f"Batch analysis of {len(chunks)} chunks completed in {processing_time:.2f} seconds.")
    
    chunk_results = []
    for i, chunk_audio in enumerate(tqdm(chunks, desc="Processing chunks")):
        # Convert chunk to bytes for realtime service
        chunk_int16 = (chunk_audio * 32767).astype(np.int16)
        chunk_bytes = chunk_int16.tobytes()
        
        # Use realtime analysis service for transcription and sentiment
        realtime_result = await realtime_service.process_sentiment_chunk(chunk_bytes)
        
        # Get LangExtract analysis for the transcribed text
        transcribed_text = realtime_result.get("text", "")
        langextract_analysis = langextract_analyzer.analyze_text(transcribed_text) if transcribed_text else {}
        
        chunk_result = {
            "chunk_index": i,
            "duration_s": len(chunk_audio) / sr,
            "transcription": transcribed_text,
            "sentiment": realtime_result.get("sentiment", "unknown"),
            "tokens": realtime_result.get("tokens", []),
            "langextract_analysis": langextract_analysis
        }
        chunk_results.append(chunk_result)

    return {
        "file": file_path.name,
        "total_duration_s": len(y) / sr,
        "total_chunks": len(chunks),
        "total_processing_time_s": processing_time,
        "analysis": chunk_results
    }

async def main():
    logger.info("Starting Real-Time Sentiment Analysis E2E Test...")
    wav_file = next(INPUT_DIR.glob("*.wav"), None)
    if not wav_file:
        logger.warning("No .wav files found. Test cannot proceed.")
        return

    final_result = await simulate_realtime_call_analysis(wav_file)

    if "error" in final_result:
        return

    logger.info(f"Analysis complete. Saving results to {OUTPUT_FILE}")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_result, f, indent=4, cls=NumpyEncoder)
    logger.info(f"✅ Test complete. Results saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    asyncio.run(main())
