'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UilPhone, UilWifi, UilClock, UilCheckCircle, UilArrowRight, UilInfoCircle } from '@tooni/iconscout-unicons-react';

interface RTCIntroductionProps {
  onContinue: () => void;
}

export const RTCIntroduction: React.FC<RTCIntroductionProps> = ({ onContinue }) => {
  return (
    <Card className="transform -rotate-1">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            WEBRTC VOICE DEMO
          </h1>
          <p className="text-lg text-gray-700 mt-2">
            Experience real-time voice communication
          </p>
        </div>

        {/* How It Works */}
        <div className="space-y-6 mb-8">
          <div className="flex gap-4">
            <Button
              variant="header"
              className="w-12 h-12 bg-orange-600 hover:bg-orange-600 p-0 cursor-default flex-shrink-0"
            >
              <span className="text-white font-black text-xl">1</span>
            </Button>
            <div className="flex-1">
              <h4 className="font-black text-black text-lg mb-1 uppercase">CHOOSE VOICE TYPE</h4>
              <p className="text-gray-700">Select from normal, high pitch, alien, or overlord voice effects for your demo call.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="header"
              className="w-12 h-12 bg-orange-600 hover:bg-orange-600 p-0 cursor-default flex-shrink-0"
            >
              <span className="text-white font-black text-xl">2</span>
            </Button>
            <div className="flex-1">
              <h4 className="font-black text-black text-lg mb-1 uppercase">DIAL THE NUMBER</h4>
              <p className="text-gray-700">Enter "1" in the phone dialer to start your test call. This demo showcases WebRTC capabilities.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="header"
              className="w-12 h-12 bg-orange-600 hover:bg-orange-600 p-0 cursor-default flex-shrink-0"
            >
              <span className="text-white font-black text-xl">3</span>
            </Button>
            <div className="flex-1">
              <h4 className="font-black text-black text-lg mb-1 uppercase">30-SECOND DEMO</h4>
              <p className="text-gray-700">Your demo call will last 30 seconds. Optionally enable recording to download your call.</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="border-4 border-black bg-orange-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-orange-600 border-4 border-black flex items-center justify-center">
                <UilWifi className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-black uppercase text-lg">LOW LATENCY</h4>
              <p className="text-sm text-gray-600 mt-2">Sub-150ms global latency</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-blue-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-600 border-4 border-black flex items-center justify-center">
                <UilCheckCircle className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-black uppercase text-lg">HD QUALITY</h4>
              <p className="text-sm text-gray-600 mt-2">Crystal-clear audio</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-green-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-600 border-4 border-black flex items-center justify-center">
                <UilClock className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-black uppercase text-lg">INSTANT SETUP</h4>
              <p className="text-sm text-gray-600 mt-2">No downloads required</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-purple-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-600 border-4 border-black flex items-center justify-center">
                <UilPhone className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-black uppercase text-lg">PSTN READY</h4>
              <p className="text-sm text-gray-600 mt-2">Connect to any phone</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="bg-yellow-100 border-2 border-black mb-8">
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
                <p className="text-sm font-bold">DEMO NOTE</p>
                <p className="text-sm text-gray-700 mt-1">
                  This is a simulated demo that showcases WebRTC capabilities. In production, you'll connect to real voice agents and phone numbers with unlimited call duration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <Button
          variant="header"
          className="w-full h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-500"
          onClick={onContinue}
        >
          <span className="flex items-center justify-center gap-2">
            START DEMO CALL
            <UilArrowRight className="h-6 w-6" />
          </span>
        </Button>
      </CardContent>
    </Card>
  );
};