'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { UilArrowRight, UilArrowLeft, UilTrash, UilMicrophone } from '@tooni/iconscout-unicons-react';

interface TextInputStepProps {
  testText: string;
  setTestText: (text: string) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
}

export function TextInputStep({
  testText,
  setTestText,
  setCurrentStep,
  handleStepChange,
}: TextInputStepProps) {
  const maxLength = 60;
  const remainingChars = maxLength - testText.length;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= maxLength) {
      setTestText(newText);
    }
  };

  const handleClear = () => {
    setTestText('');
  };

  const canProceed = testText.trim().length > 0;

  return (
    <Card className="transform -rotate-1">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            TEST YOUR VOICE
          </h1>
          <p className="text-lg text-gray-700 mt-2">
            Enter text for the AI to speak with your cloned voice
          </p>
        </div>

        <div className="space-y-6">
          {/* Text Input Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-lg font-black uppercase flex items-center gap-2">
                <UilMicrophone className="h-5 w-5" />
                SAMPLE TEXT
              </label>
              <Badge 
                className={`${
                  remainingChars < 10 
                    ? 'bg-red-500 text-white' 
                    : 'bg-green-500 text-white'
                } border-2 border-black px-3 py-1`}
              >
                {remainingChars} CHARS LEFT
              </Badge>
            </div>
            
            <div className="relative">
              <Textarea
                value={testText}
                onChange={handleTextChange}
                placeholder="Enter text for AI to speak (max 60 characters)"
                className="min-h-[120px] text-lg font-bold border-4 border-black focus:ring-4 focus:ring-pink-500 resize-none"
                maxLength={maxLength}
              />
              {testText.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  className="absolute top-2 right-2 hover:bg-red-100"
                  title="Clear text"
                >
                  <UilTrash className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {testText.trim().length > 0 && (
            <Card className="bg-yellow-50 border-2 border-black">
              <CardContent className="p-4">
                <h3 className="text-sm font-black uppercase mb-2">PREVIEW</h3>
                <p className="text-lg font-bold text-gray-800 italic">
                  &quot;{testText}&quot;
                </p>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          <Card className="bg-pink-50 border-2 border-black">
            <CardContent className="p-4">
              <h3 className="text-sm font-black uppercase mb-3">QUICK SUGGESTIONS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "Hello, this is my AI voice clone!",
                  "Welcome to my channel, let's get started!",
                  "Thanks for watching, see you next time!",
                  "Don't forget to like and subscribe!"
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start font-bold border-2 border-black hover:bg-yellow-100"
                    onClick={() => setTestText(suggestion.slice(0, maxLength))}
                  >
                    {suggestion.slice(0, maxLength)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info Message */}
          <Card className="bg-blue-50 border-2 border-black">
            <CardContent className="p-4">
              <p className="text-sm font-bold text-gray-700">
                💡 TIP: Choose text that showcases your speaking style. This will be used to test and demonstrate your AI voice clone.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
            onClick={() => handleStepChange(4)}
          >
            <UilArrowLeft className="mr-2 h-6 w-6" />
            BACK
          </Button>
          <Button
            className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
            onClick={() => setCurrentStep(6)}
            disabled={!canProceed}
          >
            CONTINUE
            <UilArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}