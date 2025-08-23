// MOCK: Convex integration layer - this will be replaced with real Convex calls
// This file simulates how we'll integrate with Convex actions, queries, and mutations

import { CallRecordingData, WaveformShard, AudioSegment, CallEvent, ConvexWaveformResponse } from '@/types/waveform';

// MOCK: Convex Query - Get call recording data
export async function getCallRecordingData(callId: string): Promise<ConvexWaveformResponse> {
  // REAL IMPLEMENTATION: This will be a Convex query
  // const result = await convex.query(api.calls.getRecordingData, { callId });
  
  console.log(`[MOCK] Convex Query: getCallRecordingData(${callId})`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const mockData = generateMockCallData(callId);
  
  return {
    success: true,
    data: mockData,
    metadata: {
      processingTime: 156,
      shardsCount: mockData.waveformShards.length,
      lastProcessed: Date.now()
    }
  };
}

// MOCK: Convex Action - Process audio file and generate waveform
export async function processAudioFile(audioUrl: string, callId: string): Promise<ConvexWaveformResponse> {
  // REAL IMPLEMENTATION: This will be a Convex action that processes audio
  // const result = await convex.action(api.audio.processWaveform, { audioUrl, callId });
  
  console.log(`[MOCK] Convex Action: processAudioFile(${audioUrl}, ${callId})`);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const processedData = generateMockCallData(callId);
  
  return {
    success: true,
    data: processedData,
    metadata: {
      processingTime: 1847,
      shardsCount: processedData.waveformShards.length,
      lastProcessed: Date.now()
    }
  };
}

// MOCK: Convex Mutation - Update playback position for analytics
export async function updatePlaybackPosition(callId: string, position: number, userId: string): Promise<boolean> {
  // REAL IMPLEMENTATION: This will be a Convex mutation
  // await convex.mutation(api.analytics.updatePlaybackPosition, { callId, position, userId });
  
  console.log(`[MOCK] Convex Mutation: updatePlaybackPosition(${callId}, ${position}, ${userId})`);
  
  // Simulate mutation
  await new Promise(resolve => setTimeout(resolve, 50));
  return true;
}

// MOCK: Convex Action - Add annotation/marker to waveform
export async function addWaveformAnnotation(
  callId: string, 
  timestamp: number, 
  type: string, 
  note: string,
  userId: string
): Promise<boolean> {
  // REAL IMPLEMENTATION: This will be a Convex action
  // await convex.action(api.annotations.create, { callId, timestamp, type, note, userId });
  
  console.log(`[MOCK] Convex Action: addWaveformAnnotation(${callId}, ${timestamp}, ${type}, ${note})`);
  
  await new Promise(resolve => setTimeout(resolve, 100));
  return true;
}

// MOCK: Real-time subscription for live call processing
export function subscribeToWaveformUpdates(callId: string, callback: (data: any) => void) {
  // REAL IMPLEMENTATION: This will use Convex subscriptions
  // const unsubscribe = convex.subscribe(api.calls.watchWaveformUpdates, { callId }, callback);
  
  console.log(`[MOCK] Convex Subscription: subscribeToWaveformUpdates(${callId})`);
  
  // Simulate real-time updates
  const interval = setInterval(() => {
    const mockUpdate = {
      type: 'WAVEFORM_UPDATE',
      callId,
      newShards: generateMockShards(5, Date.now()),
      timestamp: Date.now()
    };
    callback(mockUpdate);
  }, 1000);
  
  // Return cleanup function
  return () => {
    clearInterval(interval);
    console.log(`[MOCK] Unsubscribed from waveform updates for ${callId}`);
  };
}

// MOCK: Generate realistic waveform data
function generateMockCallData(callId: string): CallRecordingData {
  const duration = 4 * 60 * 1000; // 4 minutes in ms
  const shardsCount = Math.floor(duration / 100); // One shard per 100ms
  
  const waveformShards = generateMockShards(shardsCount, 0);
  const audioSegments = generateMockAudioSegments(duration);
  const keyEvents = generateMockCallEvents(duration);
  
  return {
    callId,
    duration,
    sampleRate: 44100,
    channels: 1,
    waveformShards,
    audioSegments,
    keyEvents,
    audioUrl: `https://mock-audio-cdn.com/calls/${callId}.wav`,
    createdAt: Date.now() - duration,
    updatedAt: Date.now()
  };
}

function generateMockShards(count: number, startTime: number): WaveformShard[] {
  const shards: WaveformShard[] = [];
  
  for (let i = 0; i < count; i++) {
    const timestamp = startTime + (i * 100); // 100ms intervals
    const isAgentSpeaking = Math.sin(i * 0.1) > 0.3;
    const isCustomerSpeaking = Math.sin(i * 0.15 + 1) > 0.4;
    
    let speaker: 'agent' | 'customer' | 'silence' = 'silence';
    let amplitude = 10 + Math.random() * 15; // Base noise level
    
    if (isAgentSpeaking && !isCustomerSpeaking) {
      speaker = 'agent';
      amplitude = 40 + Math.random() * 50;
    } else if (isCustomerSpeaking && !isAgentSpeaking) {
      speaker = 'customer';
      amplitude = 35 + Math.random() * 45;
    }
    
    // Add some conversation patterns
    if (i < count * 0.1) {
      // Opening - mostly agent
      speaker = 'agent';
      amplitude = 50 + Math.random() * 40;
    } else if (i > count * 0.8) {
      // Closing - mixed
      amplitude *= 0.8;
    }
    
    shards.push({
      id: `shard_${callId}_${i}`,
      timestamp,
      amplitude: Math.min(100, amplitude),
      frequency: 85 + Math.random() * 170, // Typical voice range
      speaker,
      sentiment: generateSentiment(speaker, i, count),
      energy: amplitude / 100
    });
  }
  
  return shards;
}

function generateMockAudioSegments(duration: number): AudioSegment[] {
  const segments: AudioSegment[] = [];
  
  // MOCK: Realistic conversation segments based on our outbound call transcript
  const mockSegments = [
    { start: 0, end: 8000, speaker: 'agent', text: "Hi Taylor! I'm calling from Diala about our new AI voice solutions that could transform your customer engagement.", sentiment: 'positive' },
    { start: 8500, end: 15000, speaker: 'customer', text: "Oh, hi there. I wasn't expecting a call today. What kind of solutions are you talking about?", sentiment: 'neutral' },
    { start: 15500, end: 28000, speaker: 'agent', text: "Great question! We help businesses like yours automate outbound calling with AI that sounds completely natural and converts 40% better than traditional methods.", sentiment: 'positive' },
    { start: 28500, end: 38000, speaker: 'customer', text: "That does sound interesting. We do a lot of cold calling for our sales team. What makes your solution different?", sentiment: 'positive' },
    { start: 38500, end: 48000, speaker: 'agent', text: "Excellent! Our AI agents can handle objections, book appointments, and even do follow-ups. Would you be interested in a quick 15-minute demo this week?", sentiment: 'positive' },
    { start: 48500, end: 54000, speaker: 'customer', text: "Sure, I'd like to see how this works. Tuesday afternoon would be good for me.", sentiment: 'positive' }
  ];
  
  mockSegments.forEach((seg, index) => {
    segments.push({
      id: `segment_${index}`,
      startTime: seg.start,
      endTime: seg.end,
      speaker: seg.speaker as 'agent' | 'customer',
      transcriptText: seg.text,
      confidence: 0.85 + Math.random() * 0.1,
      sentiment: seg.sentiment as any,
      emotions: {
        joy: seg.sentiment === 'positive' ? 0.7 + Math.random() * 0.2 : Math.random() * 0.3,
        anger: seg.sentiment === 'negative' ? 0.6 + Math.random() * 0.3 : Math.random() * 0.1,
        fear: Math.random() * 0.2,
        sadness: seg.sentiment === 'negative' ? 0.4 + Math.random() * 0.3 : Math.random() * 0.1,
        surprise: Math.random() * 0.3
      }
    });
  });
  
  return segments;
}

function generateMockCallEvents(duration: number): CallEvent[] {
  return [
    {
      id: 'event_1',
      timestamp: 8500,
      type: 'question',
      description: 'Prospect asked about solution details',
      confidence: 0.89
    },
    {
      id: 'event_2',
      timestamp: 28500,
      type: 'interest',
      description: 'Interest expressed in cold calling automation',
      confidence: 0.92
    },
    {
      id: 'event_3',
      timestamp: 38500,
      type: 'objection',
      description: 'Implicit objection about differentiation',
      confidence: 0.76
    },
    {
      id: 'event_4',
      timestamp: 48500,
      type: 'appointment',
      description: 'Demo appointment successfully scheduled',
      confidence: 0.95
    }
  ];
}

function generateSentiment(speaker: string, index: number, total: number): 'positive' | 'negative' | 'neutral' {
  if (speaker === 'silence') return 'neutral';
  
  // MOCK: Sentiment progression in successful outbound call
  const progress = index / total;
  
  if (speaker === 'agent') {
    return progress > 0.8 ? 'positive' : 'positive'; // Agent stays positive
  } else {
    // Customer sentiment improves throughout call
    if (progress < 0.3) return Math.random() > 0.7 ? 'neutral' : 'neutral';
    if (progress < 0.6) return Math.random() > 0.5 ? 'positive' : 'neutral';
    return Math.random() > 0.3 ? 'positive' : 'neutral';
  }
}