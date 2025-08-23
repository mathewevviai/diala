'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  UilBrain, 
  UilDownloadAlt, 
  UilFileSearchAlt, 
  UilChartGrowth, 
  UilDatabase,
  UilInfoCircle
} from '@tooni/iconscout-unicons-react';
import { Button } from '@/components/ui/button';

interface Step4ProcessingProgressProps {
  progress: number;
  currentStatus: string;
}

export function Step4ProcessingProgress({ progress, currentStatus }: Step4ProcessingProgressProps) {
  const processingSteps = [
    {
      icon: UilDownloadAlt,
      title: 'FETCHING',
      completed: progress >= 20,
      description: 'Downloading content'
    },
    {
      icon: UilFileSearchAlt,
      title: 'EXTRACTING',
      completed: progress >= 40,
      description: 'Parsing text content'
    },
    {
      icon: UilChartGrowth,
      title: 'EMBEDDING',
      completed: progress >= 60,
      description: 'Generating vectors'
    },
    {
      icon: UilDatabase,
      title: 'INDEXING',
      completed: progress >= 80,
      description: 'Building search index'
    }
  ];

  return (
    <Card className="transform -rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            BUILDING KNOWLEDGE BASE
          </h1>
        </div>
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-cyan-400 border-4 border-black rounded-full mb-4">
              <UilBrain className="h-12 w-12 text-black animate-pulse" />
            </div>
            <p className="text-xl font-bold text-gray-700">{currentStatus}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span>PROGRESS</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-6 border-2 border-black" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {processingSteps.map((step, index) => (
              <Card 
                key={step.title}
                className={`border-2 border-black ${step.completed ? 'bg-green-100' : 'bg-cyan-50'}`}
              >
                <CardContent className="p-4 text-center">
                  <step.icon className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-sm font-bold uppercase">{step.title}</p>
                  <p className="text-2xl font-black">
                    {step.completed ? '✓' : '...'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-gray-600">
            This may take a few minutes. Please don&apos;t close this window.
          </p>
          
          {/* Help Hint */}
          <div className="mt-8">
            <Card className="bg-yellow-200 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Button 
                    size="sm" 
                    variant="neutral" 
                    className="bg-yellow-400 hover:bg-yellow-500 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] flex-shrink-0"
                  >
                    <UilInfoCircle className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="text-sm font-bold uppercase">PROCESSING YOUR KNOWLEDGE</p>
                    <p className="text-sm text-gray-700 mt-1">
                      We&apos;re extracting content, generating embeddings, and building your searchable index. This typically takes 2-5 minutes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}