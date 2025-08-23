#!/usr/bin/env python3
"""
Prosody-sentiment E2E using emotion2vec+large via FunASR.
- Sliding chunks over diarized speaker segments.
- emotion2vec+large (300 M) → 192-D embedding + 9-class logits
- GPU-safe, 8 GB VRAM
"""

import os
import json
import asyncio
import logging
import sys
import time
from pathlib import Path
import tempfile

import numpy as np
import torch
import torchaudio
import joblib
import librosa
import soundfile as sf

# ------------------------------------------------ logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
from dotenv import load_dotenv
load_dotenv(PROJECT_ROOT / ".env")
from src.services.audio_separation_service import audio_separation_service

# ------------------------------------------------ config
DATA_DIR    = PROJECT_ROOT / "tests" / "data" / "GlenCoco"
MODEL_DIR   = PROJECT_ROOT / "models" / "sentiment_classifier"
RESULT_FILE = PROJECT_ROOT / "results" / "prosody_analysis_emotion2vec.json"
TARGET_SR   = 16000
CHUNK_DUR   = 3.0
OVERLAP     = 1.5
MIN_DUR     = 0.5
DEVICE      = "cuda" if torch.cuda.is_available() else "cpu"

# ------------------------------------------------ FunASR emotion2vec
logger.info("Loading emotion2vec+large via FunASR …")
from funasr import AutoModel
emotion_model = AutoModel(
    model="iic/emotion2vec_plus_large",
    hub="hf",
    device=DEVICE,
    disable_update=True,
)

# ------------------------------------------------ sklearn artefacts
clf   = joblib.load(MODEL_DIR / "sentiment_model.pkl")
sc    = joblib.load(MODEL_DIR / "scaler.pkl")
le    = joblib.load(MODEL_DIR / "label_encoder.pkl")
keys  = ["duration_sec", "avg_pitch", "pitch_std", "avg_energy", "voiced_ratio"]

# ------------------------------------------------ helpers
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.floating, np.bool_)):
            return obj.item()
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

def low_level(y, sr):
    f0, voiced_flags, _ = librosa.pyin(
        y, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C7"), frame_length=1024
    )
    f0_values = f0[~np.isnan(f0)]
    if len(f0_values) > 0:
        avg_pitch = float(np.nanmean(f0_values))
        pitch_std = float(np.nanstd(f0_values))
        voiced_ratio = float(np.sum(voiced_flags) / len(voiced_flags))
    else:
        avg_pitch = pitch_std = voiced_ratio = 0.0
    return dict(
        duration_sec=len(y) / sr,
        avg_pitch=avg_pitch,
        pitch_std=pitch_std,
        avg_energy=float(np.mean(y ** 2)),
        energy_std=float(np.std(y ** 2)),
        voiced_ratio=voiced_ratio,
    )

def classify(features):
    vec = np.array([[features.get(k, 0) for k in keys]])
    return le.inverse_transform(clf.predict(sc.transform(vec)))[0]

# ------------------------------------------------ main
async def run_emotion2vec(limit=1):
    wav_files = sorted(DATA_DIR.glob("*.wav"))[:limit]
    results   = []
    min_chunk_samples = int(MIN_DUR * TARGET_SR)

    for wav_path in wav_files:
        logger.info(f"🎧 Processing file: {wav_path.name}")
        t0 = time.time()

        # Step 1: Vocal Separation
        vocals_path = await audio_separation_service.extract_vocals(str(wav_path))
        if not vocals_path:
            logger.error(f"Vocal separation failed for {wav_path.name}, skipping.")
            continue
            
        # Step 2: Load and resample audio ONCE
        waveform, orig_sr = torchaudio.load(vocals_path)
        if orig_sr != TARGET_SR:
            logger.info(f"Resampling from {orig_sr}Hz to {TARGET_SR}Hz")
            resampler = torchaudio.transforms.Resample(orig_freq=orig_sr, new_freq=TARGET_SR)
            waveform = resampler(waveform)

        # Ensure mono for diarization
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
            
        # Step 3: Diarize from the resampled waveform
        diarization_result = await audio_separation_service.diarize_from_waveform(
            waveform,
            sample_rate=TARGET_SR,
            min_duration=MIN_DUR
        )
        segments = diarization_result.get("segments", [])
        if not segments:
            logger.warning(f"Diarization found no segments for {wav_path.name}, skipping analysis.")
            continue

        # Prepare numpy array for slicing
        np_waveform = waveform.squeeze().cpu().numpy()
        
        speaker_results = []
        for seg_idx, seg in enumerate(segments):
            spk, start, end = seg["speaker"], seg["start"], seg["end"]
            logger.debug(f"Processing segment {seg_idx+1}/{len(segments)} for speaker {spk} ({start:.2f}s - {end:.2f}s)")
            
            # Slice the 16kHz numpy array using timestamps from the 16kHz diarization process
            seg_samples = np_waveform[int(start * TARGET_SR) : int(end * TARGET_SR)]

            if seg_samples.size < min_chunk_samples:
                logger.warning(f" -> Segment audio array is too small ({seg_samples.size} samples) even after correct slicing. Skipping.")
                continue

            chunk_len = int(CHUNK_DUR * TARGET_SR)
            hop_len = int((CHUNK_DUR - OVERLAP) * TARGET_SR)

            offset = 0
            while offset < len(seg_samples):
                chunk = seg_samples[offset : offset + chunk_len]
                if len(chunk) < min_chunk_samples:
                    break
                
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp_file:
                    sf.write(tmp_file.name, chunk, TARGET_SR, subtype='PCM_16')
                    rec = emotion_model.generate(
                        tmp_file.name,
                        granularity="utterance",
                        extract_embedding=True,
                    )

                if not rec or "feats" not in rec[0]:
                    offset += hop_len
                    continue
                
                logger.info(f"  -> SUCCESS: Got result for chunk. Label: {rec[0].get('labels', 'N/A')}")
                emb = rec[0]["feats"].astype(np.float32)
                low = low_level(chunk, TARGET_SR)
                low["predicted_sentiment"] = classify(low)
                speaker_results.append({
                    "speaker_id": spk,
                    "chunk_start": round(start + offset / TARGET_SR, 2),
                    "chunk_end": round(start + (offset + len(chunk)) / TARGET_SR, 2),
                    "features": low,
                    "emotion2vec_embedding": emb.tolist(),
                    "emotion2vec_label": rec[0]["labels"],
                    "emotion2vec_scores": rec[0]["scores"],
                })
                offset += hop_len

        results.append({
            "original_file": wav_path.name,
            "processing_time_s": round(time.time() - t0, 2),
            "speaker_analyses": speaker_results,
        })
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    RESULT_FILE.parent.mkdir(exist_ok=True)
    with open(RESULT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, cls=NumpyEncoder)
        
    final_analyses_count = len(results[0].get("speaker_analyses", [])) if results else 0
    if final_analyses_count > 0:
        logger.info(f"✅ Done → {RESULT_FILE} ({final_analyses_count} analyses generated)")
    else:
        logger.error(f"❌ Failed to generate any analyses. Check logs. Output written to {RESULT_FILE}")

    audio_separation_service.cleanup()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=1)
    args = parser.parse_args()
    asyncio.run(run_emotion2vec(limit=args.limit))
