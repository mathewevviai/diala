# File: tests/train_sentiment_model_from_audio.py (Definitive Version)

import os
import pandas as pd
import numpy as np
from pathlib import Path
import logging
import sys
import asyncio
import re
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils import resample
import joblib
from tqdm import tqdm
import torch
import torchaudio

# --- Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
env_path = project_root / ".env"
if env_path.exists(): load_dotenv(dotenv_path=env_path)

from src.services.audio_separation_service import audio_separation_service
from src.services.prosody_analysis_service import prosody_encoder_instance

BASE_DIR = project_root
DATA_DIR = BASE_DIR / "tests" / "data" / "sentiment_datasets"
MODEL_DIR = BASE_DIR / "models" / "sentiment_classifier"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

CONCURRENT_GPU_TASKS = 2
MAX_AUDIO_FILES_TO_PROCESS = None
CHUNK_DURATION_S = 3.0

def load_labels() -> dict:
    logger.info("Loading sentiment labels from CSV...")
    try:
        path = DATA_DIR / "call_recordings.csv"
        df = pd.read_csv(path)
        df['id'] = df['id'].astype(str).str.strip()
        labels_map = pd.Series(df.Sentiment.values, index=df.id).to_dict()
        cleaned_labels_map = {}
        for key, value in labels_map.items():
            label = str(value).lower().strip()
            if label in ['happy', 'satisfied']: cleaned_labels_map[key] = 'positive'
            elif label in ['dissatisfied', 'frustrated', 'angry']: cleaned_labels_map[key] = 'negative'
            elif label == 'neutral': cleaned_labels_map[key] = 'neutral'
        logger.info(f"Loaded and standardized {len(cleaned_labels_map)} labels.")
        return cleaned_labels_map
    except Exception as e:
        logger.error(f"Error loading labels: {e}", exc_info=True)
        return {}

async def process_audio_file(file_path: Path, label: str, semaphore: asyncio.Semaphore) -> list:
    async with semaphore:
        logger.info(f"Starting processing for {file_path.name}...")
        features_with_labels = []
        try:
            separation_result = await audio_separation_service.separate_and_diarize(str(file_path))
            vocal_track_path = separation_result.get("vocals_path")
            if not vocal_track_path: return []

            # --- START OF DEFINITIVE FIX: Resample ONCE, on the GPU ---
            vocal_waveform, orig_sr = torchaudio.load(vocal_track_path)
            target_sr = 16000
            
            if orig_sr != target_sr:
                logger.warning(f"Resampling {file_path.name} from {orig_sr}Hz to {target_sr}Hz...")
                # Use torchaudio's GPU-accelerated resampler if possible
                resampler = torchaudio.transforms.Resample(orig_sr, target_sr).to(vocal_waveform.device)
                vocal_waveform = resampler(vocal_waveform)
            
            sr = target_sr # All subsequent operations use the correct sample rate
            # --- END OF DEFINITIVE FIX ---

            chunk_len = int(CHUNK_DURATION_S * sr)
            chunks = [vocal_waveform[:, i:i + chunk_len] for i in range(0, vocal_waveform.shape[1], chunk_len)]
            if not chunks: return []

            np_chunks = [chunk.cpu().numpy().squeeze() for chunk in chunks]
            feature_list = prosody_encoder_instance.extract_features_batch(np_chunks, sr)

            for features in feature_list:
                features_with_labels.append({"features": features, "label": label})
        except Exception as e:
            logger.error(f"Failed to process {file_path.name}: {e}")
        
        logger.info(f"Finished processing for {file_path.name}.")
        return features_with_labels

def main():
    labels = load_labels()
    if not labels: return

    audio_files = list(DATA_DIR.glob("call_recording_*.wav"))
    if MAX_AUDIO_FILES_TO_PROCESS:
        audio_files = audio_files[:MAX_AUDIO_FILES_TO_PROCESS]
    
    logger.info(f"Preparing to process {len(audio_files)} audio files...")
    
    async def run_tasks():
        semaphore = asyncio.Semaphore(CONCURRENT_GPU_TASKS)
        tasks = []
        for file_path in audio_files:
            file_id_key = file_path.stem
            if file_id_key in labels:
                tasks.append(process_audio_file(file_path, labels[file_id_key], semaphore))

        if not tasks:
            logger.error("Failed to match any audio files to labels.")
            return []

        results = []
        for future in tqdm(asyncio.as_completed(tasks), total=len(tasks), desc="Processing Audio Files"):
            result = await future
            results.extend(result)
        return results

    all_data = asyncio.run(run_tasks())
        
    logger.info(f"Generated a dataset of {len(all_data)} feature sets from audio chunks.")
    if not all_data:
        logger.error("No data was generated. Aborting training.")
        return

    feature_keys = ["duration_sec", "avg_pitch", "pitch_std", "avg_energy", "voiced_ratio"]
    X = np.array([[item["features"][key] for key in feature_keys] for item in all_data])
    y_labels = np.array([item["label"] for item in all_data])

    df_features = pd.DataFrame(X, columns=feature_keys)
    df_features['label'] = y_labels
    
    counts = df_features['label'].value_counts()
    if len(counts) <= 1:
        logger.error("Not enough classes to train a model. Need at least 2.")
        return

    max_count = counts.max()
    df_list = [resample(df_features[df_features.label == label], replace=True, n_samples=max_count, random_state=42) for label in counts.index]
    df_resampled = pd.concat(df_list)
    
    logger.info(f"Resampled dataset size: {len(df_resampled)}")
    
    X = df_resampled[feature_keys].values
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(df_resampled['label'].values)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    logger.info("Training sentiment classifier (RandomForest)...")
    model = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1, class_weight='balanced')
    model.fit(X_train_scaled, y_train)
    
    logger.info("Evaluating model performance...")
    y_pred = model.predict(X_test_scaled)
    
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=label_encoder.classes_)
    
    logger.info(f"\nModel Accuracy: {accuracy:.4f}\nClassification Report:\n{report}")
    logger.info(f"Saving model artifacts to {MODEL_DIR}...")
    joblib.dump(model, MODEL_DIR / "sentiment_model.pkl")
    joblib.dump(scaler, MODEL_DIR / "scaler.pkl")
    joblib.dump(label_encoder, MODEL_DIR / "label_encoder.pkl")
    
    logger.info("✅ Training and saving complete.")

if __name__ == "__main__":
    main()
