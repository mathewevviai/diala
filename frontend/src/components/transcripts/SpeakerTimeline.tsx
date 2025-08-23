'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
  duration: number;
  text?: string;                           // 🔥 Transcribed text for this segment
  sentiment?: string;                      // 🎭 Basic sentiment
  speaker_similarity?: number;             // 🎯 Speaker ID confidence
  langextract_analysis?: any;              // 🔥 LangExtract analysis per segment
  emotion2vec?: any;                       // 🎭 Emotion2Vec results per segment
}

interface SpeakerTimelineProps {
  transcript: string;
  speakers: SpeakerSegment[];
  sentimentAnalysis?: {
    sentiment: string;
    confidence: number;
    emotions?: Record<string, number>;
  };
  langextract?: any;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function mergeSegments(segments: SpeakerSegment[]): SpeakerSegment[] {
  if (segments.length === 0) return [];
  
  const merged: SpeakerSegment[] = [];
  let current = segments[0];
  
  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];
    
    // Skip zero-duration segments
    if (next.duration <= 0) continue;
    
    // Merge if same speaker and close together (within 1 second)
    if (next.speaker === current.speaker && (next.start - current.end) <= 1) {
      current = {
        ...current,
        end: next.end,
        duration: next.end - current.start
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  
  return merged.filter(s => s.duration > 0);
}

function getSpeakerColor(speaker: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500'
  ];
  const index = parseInt(speaker.replace('SPEAKER_', '')) - 1;
  return colors[index % colors.length];
}

export function SpeakerTimeline({ transcript, speakers, sentimentAnalysis, langextract }: SpeakerTimelineProps) {
  if (!speakers || speakers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No speaker diarization data available</p>
      </div>
    );
  }

  const mergedSpeakers = mergeSegments(speakers);
  
  // Use segment-specific text if available, otherwise fall back to word splitting
  const speakerTexts = mergedSpeakers.map(segment => {
    if (segment.text) {
      // Use segment-specific text from comprehensive processing
      return segment;
    } else {
      // Fall back to word splitting for backwards compatibility
      const words = transcript.split(' ');
      const wordsPerSecond = words.length / Math.max(...speakers.map(s => s.end), 1);
      const startWord = Math.floor(segment.start * wordsPerSecond);
      const endWord = Math.floor(segment.end * wordsPerSecond);
      const text = words.slice(startWord, endWord + 1).join(' ');
      return { ...segment, text };
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Speaker Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {speakerTexts.map((segment, index) => (
              <TooltipProvider key={index}>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="p-4 bg-gray-50 rounded-lg cursor-help">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={`${getSpeakerColor(segment.speaker)} text-white min-w-[80px]`}>
                          {segment.speaker}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(segment.start)} - {formatTime(segment.end)}
                        </div>
                        <Badge variant="secondary">{formatTime(segment.duration)}</Badge>
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {segment.text || 'No text available for this segment'}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="text-xs space-y-1">
                      {/* 🔥 Use per-segment analysis if available */}
                      {segment.langextract_analysis ? (
                        <>
                          <div><span className="font-semibold">Segment Sentiment:</span> {segment.sentiment || 'neutral'}</div>
                          {segment.speaker_similarity && (
                            <div><span className="font-semibold">Speaker Confidence:</span> {(segment.speaker_similarity * 100).toFixed(1)}%</div>
                          )}
                          {segment.langextract_analysis.emotions?.length > 0 && (
                            <div><span className="font-semibold">Emotions:</span> {segment.langextract_analysis.emotions.map((e: any) => e.text).join(', ')}</div>
                          )}
                          {segment.langextract_analysis.topics?.length > 0 && (
                            <div><span className="font-semibold">Topics:</span> {segment.langextract_analysis.topics.map((t: any) => t.text).join(', ')}</div>
                          )}
                          {segment.emotion2vec?.label && (
                            <div><span className="font-semibold">AI Emotion:</span> {segment.emotion2vec.label}</div>
                          )}
                        </>
                      ) : langextract ? (
                        <>
                          <div><span className="font-semibold">Sentiment:</span> {langextract.sentiments?.[0]?.text || 'neutral'}</div>
                          {langextract.emotions?.length > 0 && (
                            <div><span className="font-semibold">Emotions:</span> {langextract.emotions.map((e: any) => e.text).slice(0, 3).join(', ')}</div>
                          )}
                          {langextract.topics?.length > 0 && (
                            <div><span className="font-semibold">Topics:</span> {langextract.topics.map((t: any) => t.text).slice(0, 3).join(', ')}</div>
                          )}
                        </>
                      ) : (
                        <div className="text-muted-foreground">No analysis available for this segment.</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>

      {sentimentAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant={sentimentAnalysis.sentiment === 'positive' ? 'default' : 
                  sentimentAnalysis.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                  {sentimentAnalysis.sentiment}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Confidence: {(sentimentAnalysis.confidence * 100).toFixed(1)}%
                </span>
              </div>
              
              {sentimentAnalysis.emotions && (
                <div className="space-y-1">
                  <Separator />
                  <div className="text-sm font-medium">Emotions:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(sentimentAnalysis.emotions).map(([emotion, value]) => (
                      <div key={emotion} className="flex justify-between">
                        <span className="capitalize">{emotion}:</span>
                        <span>{(value * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}