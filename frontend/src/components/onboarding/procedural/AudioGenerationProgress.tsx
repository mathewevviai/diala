'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UilMicrophone,
  UilMusic,
  UilCheck,
  UilCoffee
} from '@tooni/iconscout-unicons-react';

interface AudioGenerationProgressProps {
  progress: number;
  status: string;
  audioName: string;
}

export function AudioGenerationProgress({
  progress,
  status,
  audioName
}: AudioGenerationProgressProps) {
  return (
    <Card className="transform -rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            BREWING AUDIO
          </h1>
          <p className="text-lg text-gray-700 mt-2">
            Creating your coffee shop ambiance
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-400 border-4 border-black rounded-full mb-4">
              <UilCoffee className="h-12 w-12 text-black animate-pulse" />
            </div>
            <p className="text-xl font-bold text-gray-700">{status}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span>PROGRESS</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 border-2 border-black overflow-hidden">
              <div
                className="bg-yellow-400 h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="bg-yellow-50 border-2 border-black">
              <CardContent className="p-4 text-center">
                <UilCoffee className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-bold uppercase">Ambiance</p>
                <p className="text-2xl font-black">{progress >= 25 ? '✓' : '...'}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-2 border-black">
              <CardContent className="p-4 text-center">
                <UilMicrophone className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-bold uppercase">Chatter</p>
                <p className="text-2xl font-black">{progress >= 50 ? '✓' : '...'}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-2 border-black">
              <CardContent className="p-4 text-center">
                <UilMusic className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-bold uppercase">Cups</p>
                <p className="text-2xl font-black">{progress >= 75 ? '✓' : '...'}</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {progress < 25 && "Setting up coffee shop atmosphere..."}
              {progress >= 25 && progress < 50 && "Adding background conversations..."}
              {progress >= 50 && progress < 75 && "Mixing cup clinking sounds..."}
              {progress >= 75 && progress < 100 && "Finalizing audio quality..."}
              {progress === 100 && "Your coffee shop audio is ready!"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}