'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UilCheckCircle, UilRocket, UilArrowRight, UilRefresh, UilClock, UilPhone, UilStar, UilInfoCircle, UilMicrophone, UilDownloadAlt } from '@tooni/iconscout-unicons-react';

interface RTCCompletionProps {
  callDuration: number;
  voiceType: string;
  wasRecorded: boolean;
  onStartOver: () => void;
}

export const RTCCompletion: React.FC<RTCCompletionProps> = ({ callDuration, voiceType, wasRecorded, onStartOver }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const getVoiceLabel = (type: string) => {
    const labels: Record<string, string> = {
      'normal': 'Normal Voice',
      'high-pitch': 'High Pitch',
      'alien': 'Alien Voice',
      'overlord': 'Overlord Voice',
      'clone': 'Voice Clone'
    };
    return labels[type] || 'Normal Voice';
  };

  const handleDownload = () => {
    // Simulate download
    const blob = new Blob(['Demo recording data'], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-recording-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="transform -rotate-1">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-green-600 border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center justify-center">
              <UilCheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black mb-3">
            DEMO COMPLETED!
          </h1>
          <p className="text-lg text-gray-700">
            You successfully made a WebRTC voice call
          </p>
        </div>

        {/* Call Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-4 border-black bg-orange-50">
            <CardContent className="p-4 text-center">
              <UilClock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-sm text-gray-600 uppercase">Duration</p>
              <p className="text-xl font-black text-black">{formatTime(callDuration)}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-purple-50">
            <CardContent className="p-4 text-center">
              <UilMicrophone className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-gray-600 uppercase">Voice</p>
              <p className="text-xl font-black text-black">{getVoiceLabel(voiceType)}</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-blue-50">
            <CardContent className="p-4 text-center">
              <UilPhone className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600 uppercase">Quality</p>
              <p className="text-xl font-black text-black">HD</p>
            </CardContent>
          </Card>
        </div>

        {/* Download Button */}
        {wasRecorded && (
          <Button
            variant="header"
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 mb-8"
            onClick={handleDownload}
          >
            <UilDownloadAlt className="h-5 w-5 mr-2" />
            Download Recording
          </Button>
        )}

        {/* Next Steps */}
        <div className="mb-8">
          <h3 className="text-2xl font-black text-black mb-4 uppercase flex items-center gap-3">
            <Button variant="header" className="w-10 h-10 bg-orange-600 hover:bg-orange-600 p-0 cursor-default">
              <UilRocket className="h-6 w-6 text-white" />
            </Button>
            READY FOR MORE?
          </h3>
          
          <p className="text-gray-700 mb-6">
            That was just a taste of our WebRTC capabilities! Unlock the full potential with:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Button size="icon" variant="header" className="w-6 h-6 bg-yellow-400 hover:bg-yellow-400 p-0 cursor-default flex-shrink-0 mt-1">
                <UilStar className="h-3 w-3" />
              </Button>
              <p className="text-gray-700"><span className="font-black">Unlimited call duration</span> - No time limits on your conversations</p>
            </div>
            <div className="flex items-start gap-3">
              <Button size="icon" variant="header" className="w-6 h-6 bg-yellow-400 hover:bg-yellow-400 p-0 cursor-default flex-shrink-0 mt-1">
                <UilStar className="h-3 w-3" />
              </Button>
              <p className="text-gray-700"><span className="font-black">Real phone numbers</span> - Connect to any phone worldwide</p>
            </div>
            <div className="flex items-start gap-3">
              <Button size="icon" variant="header" className="w-6 h-6 bg-yellow-400 hover:bg-yellow-400 p-0 cursor-default flex-shrink-0 mt-1">
                <UilStar className="h-3 w-3" />
              </Button>
              <p className="text-gray-700"><span className="font-black">Voice cloning technology</span> - Clone any voice in real-time</p>
            </div>
            <div className="flex items-start gap-3">
              <Button size="icon" variant="header" className="w-6 h-6 bg-yellow-400 hover:bg-yellow-400 p-0 cursor-default flex-shrink-0 mt-1">
                <UilStar className="h-3 w-3" />
              </Button>
              <p className="text-gray-700"><span className="font-black">Advanced features</span> - Call recording, transcription, and analytics</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <Card className="bg-blue-100 border-2 border-black mb-8">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Button 
                size="sm" 
                variant="neutral" 
                className="bg-blue-400 hover:bg-blue-500 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] flex-shrink-0"
              >
                <UilInfoCircle className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-sm font-bold">WHAT\'S NEXT?</p>
                <p className="text-sm text-gray-700 mt-1">
                  Continue exploring our platform to set up voice agents, configure call flows, and integrate with your existing systems. Our WebRTC technology ensures crystal-clear communication every time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <Button
            variant="header"
            className="w-full h-14 text-lg font-black uppercase bg-green-500 hover:bg-green-600"
          >
            <span className="flex items-center justify-center gap-2">
              GET FULL ACCESS
              <UilArrowRight className="h-6 w-6" />
            </span>
          </Button>
          
          <Button
            variant="header"
            className="w-full h-12 text-md font-black uppercase bg-gray-300 hover:bg-gray-400"
            onClick={onStartOver}
          >
            <span className="flex items-center justify-center gap-2">
              <UilRefresh className="h-5 w-5" />
              TRY AGAIN
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};