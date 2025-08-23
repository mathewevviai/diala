export interface SwarmAgent {
  id: string;
  name: string;
  type: 'sales' | 'support' | 'discovery' | 'appointment';
  status: 'active' | 'idle' | 'processing';
  activeCalls: number;
  successRate: number;
  avgCallDuration: string;
}

export interface SwarmConfig {
  id: string;
  name: string;
  description: string;
  agents: SwarmAgent[];
  totalCalls: number;
  activeAgents: number;
  performance: {
    conversionRate: number;
    avgSentiment: number;
    totalTalkTime: string;
    objectionHandling: number;
  };
}

export interface CallReasoning {
  currentObjective: string;
  nextPoints: string[];
  contextAnalysis: {
    customerMood: 'positive' | 'neutral' | 'negative' | 'confused';
    engagementLevel: number;
    objections: string[];
    interests: string[];
  };
  suggestedResponses: {
    primary: string;
    alternatives: string[];
  };
}

export interface CallAnalytics {
  sentimentHistory: { time: string; value: number }[];
  talkRatio: { agent: number; customer: number };
  keywordsDetected: string[];
  objectionsRaised: string[];
  commitmentsMade: string[];
  nextSteps: string[];
}

export interface EnhancedCall {
  id: number;
  swarmId: string;
  agent: string;
  agentType: 'sales' | 'support' | 'discovery' | 'appointment';
  contact: {
    name: string;
    number: string;
    location: string;
    company?: string;
    previousInteractions?: number;
  };
  type: string;
  duration: string;
  status: 'active' | 'warning' | 'ending';
  sentiment: 'positive' | 'neutral' | 'negative';
  audioLevel: {
    agent: number;
    customer: number;
  };
  transcript: {
    speaker: 'agent' | 'customer';
    text: string;
    time: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
  }[];
  reasoning: CallReasoning;
  analytics: CallAnalytics;
}