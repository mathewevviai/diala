'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CallRecordingData, WaveformShard, WaveformPlaybackState } from '@/types/waveform';

interface WaveformVisualizerProps {
  callData: CallRecordingData | null;
  playbackState: WaveformPlaybackState;
  onSeek: (timeMs: number) => void;
  onAddMarker?: (timeMs: number) => void;
  className?: string;
  height?: number;
  showSpeakerColors?: boolean;
  showTranscriptMarkers?: boolean;
}

export default function WaveformVisualizer({
  callData,
  playbackState,
  onSeek,
  onAddMarker,
  className,
  height = 80,
  showSpeakerColors = true,
  showTranscriptMarkers = true
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height });
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [height]);
  
  // MOCK: Draw waveform visualization
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !callData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvasSize;
    const { waveformShards, duration, audioSegments } = callData;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up canvas for high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    if (waveformShards.length === 0) {
      // Draw placeholder
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, height / 2 - 1, width, 2);
      return;
    }
    
    // Calculate pixels per millisecond
    const pxPerMs = width / duration;
    const centerY = height / 2;
    
    // Draw background segments for transcript sections
    if (showTranscriptMarkers) {
      audioSegments.forEach(segment => {
        const startX = segment.startTime * pxPerMs;
        const endX = segment.endTime * pxPerMs;
        const segmentWidth = endX - startX;
        
        // Background for transcript segments
        ctx.fillStyle = segment.speaker === 'agent' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)';
        ctx.fillRect(startX, 0, segmentWidth, height);
      });
    }
    
    // Draw waveform bars
    waveformShards.forEach((shard, index) => {
      const x = shard.timestamp * pxPerMs;
      const amplitude = shard.amplitude;
      const barHeight = (amplitude / 100) * (height * 0.8); // Max 80% of canvas height
      
      // Color based on speaker and sentiment
      let color = '#9ca3af'; // Default gray for silence
      
      if (showSpeakerColors) {
        switch (shard.speaker) {
          case 'agent':
            color = shard.sentiment === 'positive' ? '#3b82f6' : 
                    shard.sentiment === 'negative' ? '#ef4444' : '#6366f1';
            break;
          case 'customer':
            color = shard.sentiment === 'positive' ? '#10b981' : 
                    shard.sentiment === 'negative' ? '#f59e0b' : '#059669';
            break;
        }
      } else {
        // Simple amplitude-based coloring
        if (amplitude > 70) color = '#ef4444';
        else if (amplitude > 40) color = '#f59e0b';
        else if (amplitude > 20) color = '#10b981';
      }
      
      // Draw waveform bar
      ctx.fillStyle = color;
      ctx.fillRect(x - 0.5, centerY - barHeight / 2, 1, barHeight);
    });
    
    // Draw key events markers
    if (callData.keyEvents) {
      callData.keyEvents.forEach(event => {
        const x = event.timestamp * pxPerMs;
        
        // Event marker line
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Event marker dot
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(x, 10, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw playback position cursor
    const playheadX = playbackState.currentTime * pxPerMs;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    
    // Draw playhead circle
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(playheadX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw selected region if any
    if (playbackState.selectedRegion) {
      const startX = playbackState.selectedRegion.startTime * pxPerMs;
      const endX = playbackState.selectedRegion.endTime * pxPerMs;
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(startX, 0, endX - startX, height);
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, 0, endX - startX, height);
    }
  }, [callData, playbackState, canvasSize, showSpeakerColors, showTranscriptMarkers]);
  
  // Redraw when data or playback state changes
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);
  
  // Handle mouse interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!callData) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const timeMs = (x / canvasSize.width) * callData.duration;
    
    setIsDragging(true);
    onSeek(timeMs);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !callData) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const timeMs = Math.max(0, Math.min((x / canvasSize.width) * callData.duration, callData.duration));
    
    onSeek(timeMs);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!callData || !onAddMarker) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const timeMs = (x / canvasSize.width) * callData.duration;
    
    onAddMarker(timeMs);
  };
  
  // Format time for display
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={cn("relative", className)}>
      {/* Time markers */}
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>0:00</span>
        {callData && <span>{formatTime(callData.duration)}</span>}
      </div>
      
      {/* Waveform canvas */}
      <div 
        ref={containerRef}
        className="relative bg-gray-100 border-2 border-black cursor-crosshair"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
        
        {/* Loading overlay */}
        {!callData && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-sm text-gray-500">Loading waveform...</div>
          </div>
        )}
        
        {/* Playback time display */}
        <div className="absolute bottom-1 left-2 bg-black text-white px-2 py-1 text-xs font-bold">
          {formatTime(playbackState.currentTime)}
        </div>
      </div>
      
      {/* Legend */}
      {showSpeakerColors && (
        <div className="flex items-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-400 border border-black"></div>
            <span>Agent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 border border-black"></div>
            <span>Customer</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-600 border border-black"></div>
            <span>Key Events</span>
          </div>
        </div>
      )}
    </div>
  );
}