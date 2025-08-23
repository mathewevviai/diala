// MOCK: Custom hook for waveform data management with Convex integration
// This hook will manage the connection between UI and Convex backend

import { useState, useEffect, useCallback, useRef } from 'react';
import { CallRecordingData, WaveformPlaybackState, ConvexWaveformResponse } from '@/types/waveform';
import { 
  getCallRecordingData, 
  updatePlaybackPosition, 
  subscribeToWaveformUpdates,
  addWaveformAnnotation 
} from '@/lib/convex-mock';

interface UseWaveformDataResult {
  // Data state
  callData: CallRecordingData | null;
  loading: boolean;
  error: string | null;
  
  // Playback state
  playbackState: WaveformPlaybackState;
  
  // Actions
  loadCallData: (callId: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  seekTo: (timeMs: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  addAnnotation: (timestamp: number, type: string, note: string) => Promise<void>;
  
  // Real-time updates
  isLive: boolean;
  
  // Utility functions
  getAmplitudeAtTime: (timeMs: number) => number;
  getSpeakerAtTime: (timeMs: number) => 'agent' | 'customer' | 'silence';
  getTranscriptAtTime: (timeMs: number) => string | null;
}

export function useWaveformData(callId?: string): UseWaveformDataResult {
  // State management
  const [callData, setCallData] = useState<CallRecordingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  
  // Playback state
  const [playbackState, setPlaybackState] = useState<WaveformPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,
    volume: 75,
    isMuted: false
  });
  
  // Refs for cleanup
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<(() => void) | null>(null);
  
  // MOCK: Load call recording data from Convex
  const loadCallData = useCallback(async (callId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[MOCK] Loading waveform data for call: ${callId}`);
      
      const response: ConvexWaveformResponse = await getCallRecordingData(callId);
      
      if (response.success && response.data) {
        setCallData(response.data);
        console.log(`[MOCK] Loaded ${response.metadata.shardsCount} waveform shards`);
        
        // MOCK: Subscribe to real-time updates if this is a live call
        if (response.data.duration === 0 || Date.now() - response.data.createdAt < 60000) {
          setIsLive(true);
          subscriptionRef.current = subscribeToWaveformUpdates(callId, handleRealtimeUpdate);
        }
      } else {
        setError(response.error || 'Failed to load call data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[MOCK] Error loading call data:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // MOCK: Handle real-time waveform updates
  const handleRealtimeUpdate = useCallback((update: any) => {
    if (update.type === 'WAVEFORM_UPDATE') {
      setCallData(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          waveformShards: [...prev.waveformShards, ...update.newShards],
          duration: Math.max(prev.duration, update.newShards[update.newShards.length - 1]?.timestamp || 0)
        };
      });
    }
  }, []);
  
  // Playback controls
  const play = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isPlaying: true }));
    
    // MOCK: Start playback timer
    playbackIntervalRef.current = setInterval(() => {
      setPlaybackState(prev => {
        const newTime = prev.currentTime + (100 * prev.playbackRate); // 100ms intervals
        
        // Stop at end of recording
        if (callData && newTime >= callData.duration) {
          return { ...prev, isPlaying: false, currentTime: callData.duration };
        }
        
        return { ...prev, currentTime: newTime };
      });
    }, 100);
  }, [callData]);
  
  const pause = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
    
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);
  
  const seekTo = useCallback(async (timeMs: number) => {
    setPlaybackState(prev => ({ ...prev, currentTime: timeMs }));
    
    // MOCK: Update playback position in Convex for analytics
    if (callId) {
      await updatePlaybackPosition(callId, timeMs, 'current-user-id');
    }
  }, [callId]);
  
  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackState(prev => ({ ...prev, playbackRate: rate }));
  }, []);
  
  const setVolume = useCallback((volume: number) => {
    setPlaybackState(prev => ({ ...prev, volume }));
  }, []);
  
  const toggleMute = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);
  
  // MOCK: Add annotation to waveform
  const addAnnotation = useCallback(async (timestamp: number, type: string, note: string) => {
    if (!callId) return;
    
    try {
      await addWaveformAnnotation(callId, timestamp, type, note, 'current-user-id');
      console.log(`[MOCK] Added annotation at ${timestamp}ms: ${note}`);
    } catch (err) {
      console.error('[MOCK] Error adding annotation:', err);
    }
  }, [callId]);
  
  // Utility functions for accessing waveform data
  const getAmplitudeAtTime = useCallback((timeMs: number): number => {
    if (!callData) return 0;
    
    const shard = callData.waveformShards.find(s => 
      Math.abs(s.timestamp - timeMs) < 50 // Find closest shard within 50ms
    );
    
    return shard?.amplitude || 0;
  }, [callData]);
  
  const getSpeakerAtTime = useCallback((timeMs: number): 'agent' | 'customer' | 'silence' => {
    if (!callData) return 'silence';
    
    const shard = callData.waveformShards.find(s => 
      Math.abs(s.timestamp - timeMs) < 50
    );
    
    return shard?.speaker || 'silence';
  }, [callData]);
  
  const getTranscriptAtTime = useCallback((timeMs: number): string | null => {
    if (!callData) return null;
    
    const segment = callData.audioSegments.find(s => 
      timeMs >= s.startTime && timeMs <= s.endTime
    );
    
    return segment?.transcriptText || null;
  }, [callData]);
  
  // Load data when callId changes
  useEffect(() => {
    if (callId) {
      loadCallData(callId);
    }
    
    return () => {
      // Cleanup subscriptions
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [callId, loadCallData]);
  
  // Cleanup playback timer
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);
  
  return {
    callData,
    loading,
    error,
    playbackState,
    loadCallData,
    play,
    pause,
    seekTo,
    setPlaybackRate,
    setVolume,
    toggleMute,
    addAnnotation,
    isLive,
    getAmplitudeAtTime,
    getSpeakerAtTime,
    getTranscriptAtTime
  };
}