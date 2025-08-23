'use client';

import * as React from 'react';
import { Card } from '../ui/card';
import { UilPhone, UilTimes, UilMobileAndroid, UilDesktop } from '@tooni/iconscout-unicons-react';

interface CallingScreenProps {
  userName: string;
  phoneNumber: string;
  onContinueWeb: () => void;
}

export default function CallingScreen({ userName, phoneNumber, onContinueWeb }: CallingScreenProps) {
  const [fadeIn, setFadeIn] = React.useState(false);
  const [showPhone, setShowPhone] = React.useState(false);
  const [showText, setShowText] = React.useState(false);
  const [vibrate, setVibrate] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);
  const [showTimeout, setShowTimeout] = React.useState(false);
  const [showWebOption, setShowWebOption] = React.useState(false);
  const [elapsedTime, setElapsedTime] = React.useState(0);

  React.useEffect(() => {
    // Start fade in
    setTimeout(() => setFadeIn(true), 100);
    
    // Show phone icon
    setTimeout(() => setShowPhone(true), 800);
    
    // Show text
    setTimeout(() => setShowText(true), 1500);
    
    // Start vibration animation
    setTimeout(() => setVibrate(true), 2500);
    
    // Show caller info
    setTimeout(() => setShowInfo(true), 3000);

    // Trigger browser vibration if available
    if (navigator.vibrate) {
      setTimeout(() => {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }, 2500);
    }

    // Show web option in first 4 seconds
    setTimeout(() => setShowWebOption(true), 500);
    setTimeout(() => setShowWebOption(false), 4000);

    // Start elapsed timer when vibration starts
    setTimeout(() => {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      // Cleanup timer after 30 seconds
      setTimeout(() => clearInterval(timer), 30000);
    }, 2500);

    // Show timeout message after 30 seconds
    setTimeout(() => {
      setShowTimeout(true);
      setVibrate(false); // Stop vibration animation
    }, 30000);
  }, []);

  return (
    <div className={`fixed inset-0 bg-black transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
        
        {/* Redesigned green element with DIALA IS CALLING */}
        <div className={`
          relative transition-all duration-1000 transform
          ${showPhone ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-50'}
        `}>
          <div className={`
            relative bg-gradient-to-br from-green-400 to-green-600 border-8 border-green-900
            shadow-[16px_16px_0_rgba(20,50,20,1)] overflow-hidden
            ${vibrate ? 'animate-shake' : ''}
          `}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,.1) 10px, rgba(0,0,0,.1) 20px)`
              }} />
            </div>
            
            {/* Main content */}
            <div className="relative px-6 sm:px-12 md:px-20 py-8 md:py-12">
              <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
                {/* Animated phone icon container */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-white/20 blur-xl animate-pulse" />
                  <div className="relative bg-green-900 p-4 sm:p-6 md:p-8 border-4 border-green-700">
                    <UilPhone className="h-10 w-10 sm:h-14 sm:w-14 md:h-20 md:w-20 text-white" />
                  </div>
                </div>
                
                {/* Text content */}
                <div className="flex flex-col">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-white tracking-tight leading-none">
                    DIALA IS CALLING
                  </h1>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-green-100 tracking-tight leading-none mt-1 sm:mt-2">
                    {userName.toUpperCase()}
                  </h1>
                </div>
              </div>
            </div>
            
            {/* Side accent */}
            <div className="absolute top-0 right-0 w-16 sm:w-24 md:w-32 h-full bg-green-700/30 transform skew-x-[-15deg] translate-x-4 sm:translate-x-6 md:translate-x-8" />
          </div>
          
          {/* Enhanced pulsating effects */}
          {vibrate && (
            <>
              <div className="absolute -inset-4 bg-green-400/30 blur-xl animate-pulse" />
              <div className="absolute inset-0 border-4 border-green-300 opacity-50 animate-ping" />
            </>
          )}
        </div>

        {/* Status info with timer - neobrutalist style */}
        <div className={`
          absolute bottom-10 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4
          transition-all duration-1000
          ${showInfo ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
        `}>
          <Card className="overflow-hidden">
            <div className="flex">
              {/* Left image section */}
              <div className="w-32 bg-green-500 border-r-4 border-black flex items-center justify-center">
                <UilPhone className="h-12 w-12 text-white animate-pulse" />
              </div>
              
              {/* Right content section with slanted design */}
              <div className="flex-1 relative">
                <div className="px-6 py-4">
                  <p className="text-gray-600 text-sm uppercase font-bold">Calling {phoneNumber}</p>
                  <p className="text-black font-black text-lg">Please answer your phone</p>
                  
                  {/* Timer display */}
                  <div className="absolute top-0 right-0 bg-black text-white px-6 py-4 transform skew-x-[-15deg] origin-bottom-left">
                    <p className="text-2xl font-mono font-bold transform skew-x-[15deg]">
                      {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Continue on Web option - shows for first 4 seconds */}
        {showWebOption && (
          <div className={`
            absolute top-20 right-4 transition-all duration-500
            ${showWebOption ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}
          `}>
            <button
              onClick={onContinueWeb}
              className="flex items-center gap-3 px-6 py-3 font-bold uppercase border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 bg-white text-black"
            >
              <UilDesktop className="h-6 w-6" />
              Continue on Web
            </button>
          </div>
        )}

        {/* Timeout modal */}
        {showTimeout && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md transform -rotate-1">
              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-red-500 border-4 border-black flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <UilTimes className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-black uppercase text-center mb-4">CONNECTION TIMEOUT</h2>
                
                <p className="text-center text-gray-600 mb-6">
                  It seems you didn't answer or our services couldn't connect to your phone.
                </p>
                
                <div className="space-y-4">
                  <button 
                    onClick={onContinueWeb}
                    className="w-full py-4 font-bold uppercase border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 bg-[rgb(0,82,255)] text-white"
                  >
                    Continue on Web
                  </button>
                  
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-4 font-bold uppercase border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 bg-white text-black"
                  >
                    Try Again
                  </button>
                </div>
                
                <p className="text-center text-sm text-gray-500 mt-6">
                  Make sure your phone is on and has signal
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Decorative elements */}
        <div className="fixed top-20 right-20 w-20 h-20 bg-yellow-400 border-4 border-black rotate-12 animate-pulse opacity-50" />
        <div className="fixed top-40 left-10 w-16 h-16 bg-red-500 border-4 border-black -rotate-12 animate-bounce opacity-50" />
        <div className="fixed bottom-40 right-10 w-14 h-14 bg-blue-500 border-4 border-black rotate-45 animate-spin opacity-50" style={{ animationDuration: '10s' }} />
      </div>

      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}