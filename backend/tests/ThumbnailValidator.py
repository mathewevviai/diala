#!/usr/bin/env python3
import os
import json
import shutil
from pathlib import Path
from dotenv import load_dotenv
import logging
import time
import torch
from transformers import AutoProcessor, AutoModelForZeroShotImageClassification
from PIL import Image

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Load Environment Variables ---
ENV_PATH = '/home/bozo/projects/projectBozo/Horses/backend/.env.local'
load_dotenv(ENV_PATH)

class ThumbnailValidator:
    def __init__(self):
        # Use local CLIP model for zero-shot image classification
        self.checkpoint = "openai/clip-vit-large-patch14"
        self.model = None
        self.processor = None
        self._load_model()

        self.thumbnails_dir = Path("thumbnails")
        self.horse_dir = Path("HorseThumbnails")
        self.human_dir = Path("HumanThumbnails")

        self.horse_dir.mkdir(exist_ok=True)
        self.human_dir.mkdir(exist_ok=True)

    def _load_model(self):
        """Load the CLIP model and processor locally"""
        try:
            logger.info(f"Loading model: {self.checkpoint}")
            self.model = AutoModelForZeroShotImageClassification.from_pretrained(self.checkpoint)
            self.processor = AutoProcessor.from_pretrained(self.checkpoint)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            exit(1)

    def analyze_thumbnail(self, image_path):
        """Use local CLIP model for zero-shot image classification"""
        # Labels for zero-shot classification
        candidate_labels = ["horse", "person", "logo", "graphic", "animal", "human"]
        
        # Follow the pipeline prompt template to get same results
        candidate_labels = [f'This is a photo of {label}.' for label in candidate_labels]

        try:
            # Load and prepare the image
            image = Image.open(image_path)
            
            # Prepare inputs for the model
            inputs = self.processor(
                images=image, 
                text=candidate_labels, 
                return_tensors="pt", 
                padding=True
            )
            
            # Run inference
            with torch.no_grad():
                outputs = self.model(**inputs)

            # Process results
            logits = outputs.logits_per_image[0]
            probs = logits.softmax(dim=-1).numpy()
            scores = probs.tolist()

            result = [
                {"score": score, "label": candidate_label}
                for score, candidate_label in sorted(zip(probs, candidate_labels), key=lambda x: -x[0])
            ]

            return self._interpret_result(result)

        except Exception as e:
            logger.error(f"Error processing {image_path.name}: {e}")
            return "ERROR"

    def _interpret_result(self, result):
        """Interpret zero-shot classification result"""
        if not result:
            return "ERROR"

        if isinstance(result, list) and len(result) > 0:
            # Find highest scoring result
            best_match = max(result, key=lambda x: x.get('score', 0))
            label = best_match.get('label', '').lower()
            score = best_match.get('score', 0)
            
            # Only trust predictions with reasonable confidence
            if score < 0.1:
                return "NEITHER"
        else:
            return "ERROR"

        # Classify based on label content
        if any(word in label for word in ['horse', 'equine']):
            return "HORSE"
        elif any(word in label for word in ['person', 'human', 'man', 'woman', 'people']):
            return "HUMAN"
        else:
            return "NEITHER"

    def process_thumbnails(self):
        """Processes all thumbnails using local CLIP model."""
        if not self.thumbnails_dir.exists():
            logger.info("No thumbnails directory found.")
            return

        thumbnail_files = [p for p in self.thumbnails_dir.iterdir()
                          if p.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']]
        total_files = len(thumbnail_files)
        logger.info(f"Starting processing for {total_files} thumbnails using local CLIP model")

        for i, thumbnail_path in enumerate(thumbnail_files, 1):
            logger.info(f"Processing {i}/{total_files}: {thumbnail_path.name}")
            result = self.analyze_thumbnail(thumbnail_path)

            if result == "HORSE":
                shutil.move(str(thumbnail_path), self.horse_dir / thumbnail_path.name)
                logger.info(f"✓ Classified as HORSE and moved.")
            elif result == "HUMAN":
                shutil.move(str(thumbnail_path), self.human_dir / thumbnail_path.name)
                logger.info(f"✗ Classified as HUMAN and moved.")
            else:  # NEITHER or ERROR
                logger.info(f"○ Result: {result}. Thumbnail left in place.")

            # Small delay to be respectful to system resources
            time.sleep(0.5)

if __name__ == "__main__":
    validator = ThumbnailValidator()
    validator.process_thumbnails()
    logger.info("Processing complete.")
