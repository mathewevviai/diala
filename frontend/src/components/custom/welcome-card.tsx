'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { UilSmile, UilUser, UilArrowRight, UilMicrophone, UilChat } from '@tooni/iconscout-unicons-react';

interface WelcomeCardProps {
  onNameSubmit: (name: string) => void;
}

export default function WelcomeCard({ onNameSubmit }: WelcomeCardProps) {
  const [name, setName] = React.useState('');
  const [phase, setPhase] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (phase < 2) {
        setPhase(phase + 1);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-6 w-full max-w-4xl mx-auto">
        <div 
          className={`w-full flex justify-center ${
            phase >= 0 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
          }`}
        >
          <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-8">
              <Button className="w-32 h-32 bg-gradient-to-br from-[rgb(0,82,255)] to-blue-600 border-4 border-black p-0">
                <UilSmile className="h-20 w-20 text-white" />
              </Button>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase text-black mb-4 tracking-tight" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              WELCOME TO <span className="text-[rgb(0,82,255)]">DIALA</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-2 font-bold">YOUR AI VOICE AGENT PLATFORM</p>
          </CardHeader>
          </Card>
        </div>

        <div 
          className={`w-full flex justify-center ${
            phase >= 1 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
          }`}
        >
          <Card className="max-w-xl w-full">
          <CardHeader>
            <div className="flex justify-center gap-4 mb-4">
              <Button className="w-12 h-12 bg-[rgb(0,82,255)] border-4 border-black p-0">
                <UilMicrophone className="h-12 w-12 text-white" />
              </Button>
              <Button className="w-12 h-12 bg-pink-400 border-4 border-black p-0">
                <UilChat className="h-6 w-6 text-white" />
              </Button>
            </div>
            <p className="text-2xl font-black text-center text-black mb-3" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              LET'S GET STARTED!
            </p>
            <p className="text-lg text-center text-gray-700 font-medium leading-relaxed">
              Experience realistic voice conversations with AI-powered background sounds and natural speech
            </p>
          </CardHeader>
          </Card>
        </div>

        <div 
          className={`w-full flex justify-center ${
            phase >= 2 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
          }`}
        >
          <Card className="max-w-md w-full">
          <CardHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xl font-black uppercase flex items-center gap-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  <span>WHAT'S</span>
                  <span>YOUR</span>
                  <span>NAME?</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <UilUser className="h-6 w-6 text-black" />
                  </div>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="pl-12 h-14 text-lg font-semibold border-4 border-black rounded-[3px] text-black"
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!name.trim()}
                className="w-full h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
              >
                <span className="flex items-center justify-center">
                  CONTINUE
                  <UilArrowRight className="ml-2 h-6 w-6" />
                </span>
              </Button>
            </form>
          </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}