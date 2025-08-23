'use client';

import * as React from 'react';
import { Card } from '../ui/card';
import { UilCheckCircle, UilSpinner } from '@tooni/iconscout-unicons-react';

interface LoadingScreenProps {
  userName: string;
  selectedAudio: string;
  selectedLanguage: string;
  selectedVoiceAgent: string;
  selectedPitch?: string;
  onComplete: () => void;
}

interface ProcessStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed';
}

export default function LoadingScreen({ userName, selectedAudio, selectedLanguage, selectedVoiceAgent, selectedPitch, onComplete }: LoadingScreenProps) {
  const [processSteps, setProcessSteps] = React.useState<ProcessStep[]>([
    { id: 'init', name: 'Initializing Voice Agent', status: 'processing' },
    { id: 'audio', name: 'Loading Audio Environment', status: 'pending' },
    { id: 'tts', name: 'Configuring Text-to-Speech', status: 'pending' },
    { id: 'websocket', name: 'Establishing Connection', status: 'pending' },
    { id: 'finalize', name: 'Finalizing Setup', status: 'pending' }
  ]);

  React.useEffect(() => {
    const processStep = async (stepIndex: number) => {
      if (stepIndex >= processSteps.length) {
        setTimeout(onComplete, 500);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessSteps(prev => {
        const updated = [...prev];
        if (stepIndex > 0) updated[stepIndex - 1].status = 'completed';
        if (stepIndex < updated.length) updated[stepIndex].status = 'processing';
        return updated;
      });

      processStep(stepIndex + 1);
    };

    processStep(1);
  }, []);

  return (
    <div className="min-h-screen bg-[rgb(0,82,255)] flex items-center justify-center p-4" style={{ 
      fontFamily: 'Noyh-Bold, sans-serif',
      backgroundImage: `
        linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px'
    }}>
      <Card className="w-full max-w-md p-8">
        <h2 className="text-3xl font-black uppercase text-center mb-12">PREPARING YOUR CALL</h2>
        
        <div className="relative px-4">
          {/* Connecting dots line */}
          <div className="absolute left-[24px] top-6 bottom-6 w-0.5 bg-gray-300" />
          
          {/* Steps */}
          <div className="space-y-8">
            {processSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-6">
                {/* Status indicator */}
                <div className="relative z-10">
                  {step.status === 'completed' && (
                    <div className="w-12 h-12 bg-green-500 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <UilCheckCircle className="h-7 w-7 text-white" />
                    </div>
                  )}
                  {step.status === 'processing' && (
                    <div className="w-12 h-12 bg-[rgb(0,82,255)] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <UilSpinner className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <div className="w-12 h-12 bg-gray-200 border-2 border-black" />
                  )}
                </div>
                
                {/* Step name */}
                <div className="flex-1">
                  <p className={`text-lg font-bold transition-colors duration-300 ${
                    step.status === 'completed' ? 'text-green-600' :
                    step.status === 'processing' ? 'text-[rgb(0,82,255)]' :
                    'text-gray-400'
                  }`}>
                    {step.name}
                  </p>
                  
                  {/* Loading dots for processing step */}
                  {step.status === 'processing' && (
                    <div className="flex gap-2 mt-2">
                      <div className="w-2.5 h-2.5 bg-[rgb(0,82,255)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2.5 h-2.5 bg-[rgb(0,82,255)] rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      <div className="w-2.5 h-2.5 bg-[rgb(0,82,255)] rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* User info summary */}
        <div className="mt-12 p-6 bg-gray-50 border-2 border-black rounded-lg">
          <h3 className="text-lg font-black uppercase mb-4">Configuration</h3>
          <div className="space-y-3">
            <p className="text-base text-gray-700">
              <span className="font-bold">User:</span> {userName}
            </p>
            <p className="text-base text-gray-700">
              <span className="font-bold">Voice:</span> {selectedVoiceAgent}
            </p>
            <p className="text-base text-gray-700">
              <span className="font-bold">Language:</span> {selectedLanguage}
            </p>
            {selectedPitch && (
              <p className="text-base text-gray-700">
                <span className="font-bold">Pitch:</span> {selectedPitch}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}