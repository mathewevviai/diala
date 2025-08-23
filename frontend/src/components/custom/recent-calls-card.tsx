import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { UilPlay, UilHistory } from '@tooni/iconscout-unicons-react';

interface Call {
  id: number;
  agent: string;
  contact: string;
  duration: string;
  status: 'completed' | 'failed';
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface RecentCallsCardProps {
  calls: Call[];
  onPlayRecording?: (callId: number) => void;
}

export default function RecentCallsCard({ calls, onPlayRecording }: RecentCallsCardProps) {
  const getSentimentEmoji = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'neutral':
        return '😐';
      case 'negative':
        return '😞';
    }
  };

  const getSentimentStyle = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500';
      case 'neutral':
        return 'bg-gray-400';
      case 'negative':
        return 'bg-red-500';
    }
  };

  return (
    <Card style={{ border: '3px solid black', boxShadow: '4px 4px 0px 0px black' }}>
      <CardHeader style={{ borderBottom: '3px solid black' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            size="icon"
            variant="default"
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'rgb(0,82,255)',
              border: '3px solid black',
              boxShadow: '2px 2px 0px 0px black'
            }}
          >
            <UilHistory style={{ width: '24px', height: '24px', color: 'white' }} />
          </Button>
          <CardTitle style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>
            RECENT CALLS
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent style={{ padding: '0' }}>
        <div>
          {calls.map((call) => (
            <div 
              key={call.id} 
              style={{ 
                padding: '16px',
                borderBottom: calls.indexOf(call) !== calls.length - 1 ? '2px solid black' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: '1' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Button 
                      size="icon"
                      variant="default"
                      style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid black',
                        boxShadow: '2px 2px 0px 0px black'
                      }}
                      className={getSentimentStyle(call.sentiment)}
                    >
                      <span style={{ fontSize: '20px' }}>{getSentimentEmoji(call.sentiment)}</span>
                    </Button>
                    
                    <div style={{ flex: '1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Badge style={{ 
                          fontWeight: '900', 
                          textTransform: 'uppercase', 
                          border: '2px solid black',
                          boxShadow: '1px 1px 0px 0px black'
                        }}>
                          {call.agent}
                        </Badge>
                        <span style={{ fontWeight: '700' }}>{call.contact}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                        <span style={{ color: '#6b7280' }}>
                          Duration: <span style={{ fontWeight: '700', color: 'black' }}>{call.duration}</span>
                        </span>
                        <Badge 
                          variant={call.status === 'completed' ? 'default' : 'destructive'}
                          style={{
                            fontSize: '12px',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            border: '2px solid black',
                            boxShadow: '1px 1px 0px 0px black',
                            backgroundColor: call.status === 'completed' ? '#10b981' : '#ef4444',
                            color: 'white'
                          }}
                        >
                          {call.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="sm"
                  variant="neutral"
                  onClick={() => onPlayRecording?.(call.id)}
                  style={{
                    backgroundColor: 'white',
                    border: '2px solid black',
                    padding: '8px',
                    boxShadow: '2px 2px 0px 0px black'
                  }}
                >
                  <UilPlay style={{ width: '16px', height: '16px', color: 'black' }} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}