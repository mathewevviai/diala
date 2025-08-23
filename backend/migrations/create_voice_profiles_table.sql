-- Migration: Create voice profiles tables
-- Description: Tables for storing voice cloning profiles and sessions

-- Create voice_profiles table
CREATE TABLE IF NOT EXISTS voice_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    voice_id VARCHAR(50) UNIQUE NOT NULL,
    voice_name VARCHAR(100) NOT NULL DEFAULT 'My Voice',
    reference_audio_path VARCHAR(500) NOT NULL,
    voice_model_path VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    settings TEXT,
    
    INDEX idx_voice_profiles_user_id (user_id),
    INDEX idx_voice_profiles_voice_id (voice_id),
    INDEX idx_voice_profiles_created_at (created_at)
);

-- Create voice_clone_sessions table
CREATE TABLE IF NOT EXISTS voice_clone_sessions (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(50) UNIQUE NOT NULL,
    voice_profile_id VARCHAR(36),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    processing_time_seconds FLOAT,
    audio_duration_seconds FLOAT,
    
    INDEX idx_voice_clone_sessions_session_id (session_id),
    INDEX idx_voice_clone_sessions_status (status),
    INDEX idx_voice_clone_sessions_started_at (started_at),
    
    FOREIGN KEY (voice_profile_id) REFERENCES voice_profiles(id) ON DELETE CASCADE
);

-- Add trigger to update updated_at timestamp
DELIMITER $$
CREATE TRIGGER update_voice_profiles_updated_at 
BEFORE UPDATE ON voice_profiles
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;