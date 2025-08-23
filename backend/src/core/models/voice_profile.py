"""
Voice Profile Database Models

Defines the database schema for storing user voice profiles
created through the voice cloning process.
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class VoiceProfile(Base):
    """Model for storing voice profiles created through cloning."""
    
    __tablename__ = 'voice_profiles'
    
    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # User reference
    user_id = Column(String(36), nullable=True, index=True)  # Nullable for anonymous users
    
    # Voice identification
    voice_id = Column(String(50), unique=True, nullable=False, index=True)
    voice_name = Column(String(100), nullable=False, default="My Voice")
    
    # Voice data
    reference_audio_path = Column(String(500), nullable=False)  # Path to stored reference audio
    voice_model_path = Column(String(500), nullable=True)  # Path to trained voice model (if applicable)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)  # Whether voice has been verified
    
    # Additional settings
    settings = Column(Text, nullable=True)  # JSON string for voice-specific settings
    
    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "voice_id": self.voice_id,
            "voice_name": self.voice_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "settings": self.settings
        }


class VoiceCloneSession(Base):
    """Model for tracking voice cloning sessions."""
    
    __tablename__ = 'voice_clone_sessions'
    
    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Session info
    session_id = Column(String(50), unique=True, nullable=False, index=True)
    voice_profile_id = Column(String(36), ForeignKey('voice_profiles.id'), nullable=True)
    
    # Processing status
    status = Column(String(20), nullable=False, default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    
    # Timing
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Metrics
    processing_time_seconds = Column(Float, nullable=True)
    audio_duration_seconds = Column(Float, nullable=True)
    
    # Relationship
    voice_profile = relationship("VoiceProfile", backref="clone_sessions")