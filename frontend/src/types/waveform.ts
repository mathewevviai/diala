// MOCK: Waveform and audio data types that will be integrated with Convex
// These types represent the data structure we'll receive from real Convex queries

export interface WaveformShard {
  id: string;
  timestamp: number; // milliseconds from call start
  amplitude: number; // 0-100 representing audio level
  frequency: number; // dominant frequency in Hz
  speaker: 'agent' | 'customer' | 'silence';
  sentiment?: 'positive' | 'negative' | 'neutral';
  energy: number; // 0-1 representing audio energy
}

export interface AudioSegment {
  id: string;
  startTime: number; // milliseconds
  endTime: number; // milliseconds
  speaker: 'agent' | 'customer';
  transcriptText: string;
  confidence: number; // 0-1 transcript confidence
  sentiment: 'positive' | 'negative' | 'neutral';
  emotions?: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
  };
}

export interface CallRecordingData {
  callId: string;
  duration: number; // total call duration in ms
  sampleRate: number; // audio sample rate (e.g., 44100)
  channels: number; // mono=1, stereo=2
  waveformShards: WaveformShard[];
  audioSegments: AudioSegment[];
  keyEvents: CallEvent[];
  audioUrl?: string; // URL to actual audio file
  createdAt: number;
  updatedAt: number;
}

export interface CallEvent {
  id: string;
  timestamp: number; // milliseconds from call start
  type: 'objection' | 'interest' | 'question' | 'appointment' | 'transfer' | 'hold';
  description: string;
  confidence: number; // AI confidence in event detection
  metadata?: Record<string, any>;
}

// MOCK: Convex action/query response types
export interface ConvexWaveformResponse {
  success: boolean;
  data: CallRecordingData | null;
  error?: string;
  metadata: {
    processingTime: number;
    shardsCount: number;
    lastProcessed: number;
  };
}

export interface WaveformPlaybackState {
  isPlaying: boolean;
  currentTime: number; // current playback position in ms
  playbackRate: number; // 0.5x, 1x, 1.5x, 2x
  volume: number; // 0-100
  isMuted: boolean;
  selectedRegion?: {
    startTime: number;
    endTime: number;
  };
}

// MOCK: Real-time streaming data structure
export interface WaveformStreamData {
  shardBatch: WaveformShard[];
  batchId: string;
  isComplete: boolean;
  nextBatchExpected?: number;
}