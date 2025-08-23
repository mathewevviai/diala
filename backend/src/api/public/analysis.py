"""
Analysis API: text analysis (LangExtract with fallback) and simple helpers.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import os
import logging

router = APIRouter(prefix="/analysis", tags=["analysis"])
logger = logging.getLogger(__name__)


class TextAnalysisRequest(BaseModel):
    text: str


@router.post("/text")
async def analyze_text(req: TextAnalysisRequest) -> Dict[str, Any]:
    """Analyze text via LangExtract when available, else fallback heuristics.

    Returns keys: emotions, sentiments, topics, engagement, key_phrases, raw_extractions
    """
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")

    # Fallback analyzer copied from comprehensive service
    def _fallback(text_in: str) -> Dict[str, Any]:
        lower = text_in.lower()
        pos_words = {"great", "amazing", "happy", "wonderful", "excited", "love", "good", "excellent", "fantastic", "awesome", "pleased"}
        neg_words = {"angry", "frustrated", "terrible", "bad", "awful", "hate", "disappointed", "sad", "upset", "annoyed", "furious"}
        question_words = {"what", "how", "when", "where", "why", "who", "can", "could", "would", "should"}
        business_words = {"company", "business", "service", "product", "customer", "client", "sales", "marketing"}

        emo_map = {
            "happy": ["happy", "excited", "joy", "glad", "pleased", "thrilled"],
            "angry": ["angry", "mad", "furious", "upset", "annoyed", "frustrated"],
            "sad": ["sad", "down", "unhappy", "disappointed", "depressed"],
            "neutral": ["ok", "fine", "alright"],
            "curious": ["interested", "wondering", "curious"],
        }

        sentiments: List[Dict[str, Any]] = []
        emotions: List[Dict[str, Any]] = []
        topics: List[Dict[str, Any]] = []
        engagement: List[Dict[str, Any]] = []

        if any(w in lower for w in pos_words):
            sentiments.append({"class": "sentiment", "text": "positive", "attributes": {"confidence": "medium", "trigger": "positive_keywords"}})
        elif any(w in lower for w in neg_words):
            sentiments.append({"class": "sentiment", "text": "negative", "attributes": {"confidence": "medium", "trigger": "negative_keywords"}})
        else:
            sentiments.append({"class": "sentiment", "text": "neutral", "attributes": {"confidence": "low", "reason": "no_clear_indicators"}})

        for label, keys in emo_map.items():
            if any(k in lower for k in keys):
                emotions.append({"class": "emotion", "text": label, "attributes": {"detected": True, "confidence": "medium"}})

        if any(w in lower for w in business_words):
            topics.append({"class": "topic", "text": "business_conversation", "attributes": {"category": "professional"}})
        if any(w in lower for w in question_words):
            topics.append({"class": "topic", "text": "inquiry", "attributes": {"type": "question"}})

        if len([w for w in question_words if w in lower]) > 0:
            engagement.append({"class": "engagement", "text": "inquisitive", "attributes": {"type": "asking_questions"}})
        word_count = len(text_in.split())
        if word_count > 10:
            engagement.append({"class": "engagement", "text": "high", "attributes": {"reason": "lengthy_response"}})
        elif word_count < 3:
            engagement.append({"class": "engagement", "text": "low", "attributes": {"reason": "brief_response"}})
        else:
            engagement.append({"class": "engagement", "text": "medium", "attributes": {"reason": "moderate_length"}})

        return {
            "emotions": emotions,
            "sentiments": sentiments,
            "topics": topics,
            "engagement": engagement,
            "key_phrases": [
                {"class": "key_phrases", "text": phrase, "attributes": {"importance": "medium"}}
                for phrase in text_in.split('.') if len(phrase.strip()) > 5
            ][:3],
            "raw_extractions": emotions + sentiments + topics + engagement,
            "note": "enhanced_offline_fallback",
        }

    # Try LangExtract
    try:
        import langextract as lx  # type: ignore
        api_key = os.getenv("LANGEXTRACT_API_KEY")
        if not api_key:
            return _fallback(text)
        result = lx.extract(
            text_or_documents=text,
            prompt_description=(
                "Extract comprehensive information: emotions, sentiments, topics, engagement, key phrases."
            ),
            examples=[],
            model_id="gemini-2.5-flash",
            extraction_passes=2,
            max_workers=3,
            api_key=api_key,
        )
        analysis = {
            "emotions": [],
            "sentiments": [],
            "topics": [],
            "engagement": [],
            "key_phrases": [],
            "raw_extractions": [],
        }
        for ex in getattr(result, "extractions", []) or []:
            data = {"class": ex.extraction_class, "text": ex.extraction_text, "attributes": ex.attributes or {}}
            analysis["raw_extractions"].append(data)
            if ex.extraction_class == "emotion":
                analysis["emotions"].append(data)
            elif ex.extraction_class == "sentiment":
                analysis["sentiments"].append(data)
            elif ex.extraction_class == "topic":
                analysis["topics"].append(data)
            elif ex.extraction_class == "engagement":
                analysis["engagement"].append(data)
            elif ex.extraction_class == "key_phrases":
                analysis["key_phrases"].append(data)
        return analysis
    except Exception as e:
        logger.warning(f"LangExtract failed, using fallback: {e}")
        return _fallback(text)
