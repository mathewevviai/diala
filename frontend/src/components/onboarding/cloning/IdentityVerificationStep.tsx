'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UilSpinner, UilArrowRight, UilArrowLeft, UilCheckCircle } from '@tooni/iconscout-unicons-react';

interface IdentityVerificationStepProps {
  setShowVerificationModal: (show: boolean) => void;
  handleStepChange: (step: number) => void;
}

export function IdentityVerificationStep({
  setShowVerificationModal,
  handleStepChange,
}: IdentityVerificationStepProps) {
  
  return (
    <Card className="transform rotate-1">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            PREPARING YOUR CLONE
          </h1>
          <p className="text-lg text-gray-700 mt-2">
            Setting up voice processing pipeline
          </p>
        </div>

        <Card className="bg-pink-50 border-2 border-black">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <UilSpinner className="h-16 w-16 mx-auto text-pink-600 animate-spin mb-4" />
                <p className="text-lg font-bold mb-6">
                  Initializing voice cloning engine...
                </p>
              </div>
              
              <Progress value={75} className="h-4" />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <UilCheckCircle className="h-5 w-5 text-green-600" />
                  <span>Voice data uploaded successfully</span>
                </div>
                <div className="flex items-center gap-2">
                  <UilCheckCircle className="h-5 w-5 text-green-600" />
                  <span>Voice parameters configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-pink-600 rounded-full animate-pulse"></div>
                  <span className="font-bold">Verifying authorization...</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <div className="h-5 w-5 border-2 border-gray-400 rounded-full"></div>
                  <span>Ready to begin cloning</span>
                </div>
              </div>

              <Button
                className="w-full h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                onClick={() => setShowVerificationModal(true)}
              >
                COMPLETE VERIFICATION
                <UilArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-8">
          <Button
            className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
            onClick={() => handleStepChange(5)}
          >
            <UilArrowLeft className="mr-2 h-6 w-6" />
            BACK
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}