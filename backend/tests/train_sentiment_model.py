# File: tests/train_sentiment_model.py

import os
import pandas as pd
import numpy as np
from pathlib import Path
import logging
import sys
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils import resample
import joblib
from tqdm import tqdm

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# --- Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "tests" / "data" / "sentiment_datasets"
MODEL_DIR = BASE_DIR / "models" / "sentiment_classifier"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def ensure_nltk_data():
    try:
        nltk.data.find('sentiment/vader_lexicon.zip')
    except LookupError:
        logger.info("Downloading NLTK VADER lexicon for sentiment analysis...")
        nltk.download('vader_lexicon', quiet=True)

ensure_nltk_data()
vader_analyzer = SentimentIntensityAnalyzer()

# --- Functions ---
def load_and_prepare_data() -> pd.DataFrame:
    logger.info("Loading and preparing datasets...")
    
    # --- START OF FIX: Use only the one valid dataset and its correct columns ---
    try:
        path = DATA_DIR / "call_recordings.csv"
        if not path.exists():
            raise FileNotFoundError(f"Required data file not found: {path}")

        df = pd.read_csv(path)
        
        # Check for required columns
        required_cols = ["Transcript", "Sentiment"]
        if not all(col in df.columns for col in required_cols):
            raise KeyError(f"The file {path.name} is missing required columns: {required_cols}")

        # Keep only the columns we need and rename them to a standard format
        df = df[required_cols]
        df = df.rename(columns={"Transcript": "text", "Sentiment": "sentiment_label"})
        df = df.dropna()
        logger.info(f"Loaded {len(df)} records from {path.name}")
        
    except Exception as e:
        logger.error(f"Error loading datasets: {e}. Please ensure 'call_recordings.csv' is in {DATA_DIR}")
        return pd.DataFrame()
    # --- END OF FIX ---

    # Standardize labels
    df['sentiment_label'] = df['sentiment_label'].str.lower().replace({
        'happy': 'positive', 'satisfied': 'positive', 
        'dissatisfied': 'negative', 'frustrated': 'negative', 'angry': 'negative'
    })
    
    df = df[df['sentiment_label'].isin(['positive', 'negative', 'neutral'])]
    
    logger.info(f"Filtered dataset size: {len(df)}")
    logger.info(f"Class distribution:\n{df['sentiment_label'].value_counts()}")

    # Handle Class Imbalance
    counts = df['sentiment_label'].value_counts()
    if 'neutral' not in counts or len(counts) <= 1:
        logger.warning("Not enough classes to balance. Using data as is.")
        return df

    max_minority_count = counts.drop('neutral').max()
    
    df_majority = df[df.sentiment_label == 'neutral']
    df_minority_pos = df[df.sentiment_label == 'positive']
    df_minority_neg = df[df.sentiment_label == 'negative']

    df_majority_downsampled = resample(
        df_majority, 
        replace=False, 
        n_samples=max_minority_count, 
        random_state=42
    )
    
    df_balanced = pd.concat([df_majority_downsampled, df_minority_pos, df_minority_neg])
    
    logger.info("--- After Downsampling ---")
    logger.info(f"Balanced dataset size: {len(df_balanced)}")
    logger.info(f"New class distribution:\n{df_balanced['sentiment_label'].value_counts()}")

    return df_balanced

def simulate_prosody_features(text: str) -> dict:
    sentiment_scores = vader_analyzer.polarity_scores(text)
    compound_score = sentiment_scores['compound']

    duration = max(1.0, len(text.split()) / 3.0)
    avg_pitch = np.random.uniform(130, 160)
    pitch_std = np.random.uniform(15, 25)
    avg_energy = np.random.uniform(0.08, 0.12)
    voiced_ratio = np.random.uniform(0.65, 0.8)

    if compound_score > 0.3:
        avg_pitch *= (1 + 0.15 * compound_score)
        pitch_std *= (1 + 0.6 * compound_score)
        avg_energy *= (1 + 0.5 * compound_score)
    elif compound_score < -0.3:
        avg_pitch *= (1 + 0.1 * compound_score)
        pitch_std *= (1 - 0.3 * compound_score)
        avg_energy *= (1 - 0.2 * compound_score)

    return {
        "duration_sec": duration,
        "avg_pitch": avg_pitch,
        "pitch_std": pitch_std,
        "avg_energy": avg_energy,
        "voiced_ratio": voiced_ratio,
    }

def main():
    df = load_and_prepare_data()
    if df.empty: return

    logger.info("Simulating prosody feature extraction using VADER sentiment scores...")
    feature_list = [simulate_prosody_features(text) for text in tqdm(df['text'], desc="Generating Features")]
    
    feature_keys = ["duration_sec", "avg_pitch", "pitch_std", "avg_energy", "voiced_ratio"]
    X = np.array([[f[key] for key in feature_keys] for f in feature_list])
    
    y_labels = df['sentiment_label'].values
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_labels)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    logger.info("Training sentiment classifier (RandomForest)...")
    model = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1, class_weight='balanced', max_depth=10)
    model.fit(X_train_scaled, y_train)
    
    logger.info("Evaluating model performance...")
    y_pred = model.predict(X_test_scaled)
    
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=label_encoder.classes_)
    
    logger.info(f"\nModel Accuracy: {accuracy:.4f}")
    logger.info(f"\nClassification Report:\n{report}")
    
    logger.info(f"Saving model artifacts to {MODEL_DIR}...")
    joblib.dump(model, MODEL_DIR / "sentiment_model.pkl")
    joblib.dump(scaler, MODEL_DIR / "scaler.pkl")
    joblib.dump(label_encoder, MODEL_DIR / "label_encoder.pkl")
    
    logger.info("✅ Training and saving complete.")

if __name__ == "__main__":
    main()
