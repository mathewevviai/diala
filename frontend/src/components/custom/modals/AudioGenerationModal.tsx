import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { UilSpinner, UilCheck, UilMicrophone, UilMusic } from '@tooni/iconscout-unicons-react';
import { Star15 } from '@/components/ui/star';

interface AudioGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  status: 'generating' | 'verifying' | 'completed' | 'error';
  audioName: string;
  onVerify: () => void;
  onDownload: () => void;
}

export function AudioGenerationModal({
  isOpen,
  onClose,
  progress,
  status,
  audioName,
  onVerify,
  onDownload
}: AudioGenerationModalProps) {
  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return <UilMicrophone className="h-12 w-12 text-purple-500" />;
      case 'verifying':
        return <UilCheck className="h-12 w-12 text-green-500" />;
      case 'completed':
        return <UilMusic className="h-12 w-12 text-yellow-500" />;
      case 'error':
        return <UilSpinner className="h-12 w-12 text-red-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'generating':
        return 'Creating your coffee shop ambiance...';
      case 'verifying':
        return 'Verifying your audio...';
      case 'completed':
        return 'Your coffee shop audio is ready!';
      case 'error':
        return 'Something went wrong';
    }
  };

  const getProgressMessage = () => {
    if (status === 'generating') {
      if (progress < 25) return 'Analyzing coffee shop scene...';
      if (progress < 50) return 'Generating background chatter...';
      if (progress < 75) return 'Adding cup clinking sounds...';
      if (progress < 100) return 'Finalizing audio quality...';
      return 'Audio generated successfully!';
    }
    return 'Processing...';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 transform rotate-1">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-500 border-4 border-black rounded-full flex items-center justify-center">
              {getStatusIcon()}
            </div>
          </div>
          
          <h2 className="text-2xl font-black uppercase text-black mb-2">
            {status === 'completed' ? 'Audio Ready!' : 'Generating Audio'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {getStatusMessage()}
          </p>
          
          {status === 'generating' && (
            <div className="mb-6">
              <Progress value={progress} className="h-3 mb-2" />
              <p className="text-sm text-gray-500">{getProgressMessage()}</p>
            </div>
          )}
          
          {status === 'completed' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-black">
                <h3 className="font-black uppercase text-sm mb-2">Your Audio</h3>
                <p className="text-sm text-gray-700">{audioName}</p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={onDownload}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-black uppercase"
                >
                  Download
                </Button>
                <Button 
                  onClick={onVerify}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black uppercase"
                >
                  Verify
                </Button>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <Button 
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white font-black uppercase"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}