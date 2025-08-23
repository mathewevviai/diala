'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Select from '@radix-ui/react-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UilPhone, UilPhoneSlash, UilAngleDown, UilAngleUp, UilCheck, UilExclamationTriangle, UilCheckCircle, UilCircle, UilMicrophone, UilRobot, UilBrain, UilStar } from '@tooni/iconscout-unicons-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Tone: any;
  }
}

interface RTCPhoneDialerProps {
  onCallComplete: (duration: number, voiceType: string, wasRecorded: boolean) => void;
}

export const RTCPhoneDialer: React.FC<RTCPhoneDialerProps> = ({ onCallComplete }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'connected'
  const [callDuration, setCallDuration] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [voiceType, setVoiceType] = useState('normal');
  const [isRecording, setIsRecording] = useState(false);
  
  const synthRef = useRef<any>(null);
  const sequenceRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxCallDuration = 300; // 5 minutes for real calls

  const countryCodes = [ 
    { value: '+1', label: '🇺🇸 +1' }, 
    { value: '+44', label: '🇬🇧 +44' }, 
    { value: '+91', label: '🇮🇳 +91' }, 
    { value: '+61', label: '🇦🇺 +61' }, 
    { value: '+81', label: '🇯🇵 +81' }, 
    { value: '+886', label: '🇹🇼 +886' },
    { value: '+49', label: '🇩🇪 +49' },
    { value: '+33', label: '🇫🇷 +33' },
    { value: '+34', label: '🇪🇸 +34' },
    { value: '+39', label: '🇮🇹 +39' }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Enhanced phone number validation
  const validatePhoneNumber = (number: string, code: string): boolean => {
    const cleanNumber = number.replace(/[^\d]/g, '');
    
    switch (code) {
      case '+1': // US/Canada
        return /^[2-9]\d{2}[2-9]\d{6}$/.test(cleanNumber) || /^\d{10}$/.test(cleanNumber);
      case '+44': // UK
        return /^\d{10,11}$/.test(cleanNumber);
      case '+91': // India
        return /^\d{10}$/.test(cleanNumber);
      case '+61': // Australia
        return /^\d{9}$/.test(cleanNumber);
      case '+81': // Japan
        return /^\d{10,11}$/.test(cleanNumber);
      case '+886': // Taiwan
        return /^\d{9,10}$/.test(cleanNumber);
      default:
        return cleanNumber.length >= 8 && cleanNumber.length <= 15;
    }
  };

  const handleHangUp = useCallback((autoEnded: boolean = false) => { 
    if (window.Tone) { 
      window.Tone.Transport.stop(); 
      sequenceRef.current.stop(0); 
    } 
    
    const duration = formatTime(callDuration);
    const message = autoEnded ? 'Call Time Limit Reached' : 'Call Ended';
    toast.info(message, {
      description: `Duration: ${duration}`,
      icon: (
        <Button size="icon" variant="header" className="w-10 h-10 bg-white text-black">
          <UilPhoneSlash className="h-5 w-5" />
        </Button>
      )
    });
    
    setCallState('idle'); 
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    onCallComplete(callDuration, voiceType, isRecording);
    
    setCallDuration(0);
    setIsRecording(false);
  }, [callDuration, voiceType, isRecording, onCallComplete]);

  useEffect(() => {
    toast.info('Phone Dialer Ready', {
      description: 'Enter a valid phone number to make a call',
      icon: (
        <Button size="icon" variant="header" className="w-10 h-10 bg-white text-black">
          <UilPhone className="h-5 w-5" />
        </Button>
      )
    });
    
    if (window.Tone) {
      synthRef.current = new window.Tone.Synth().toDestination();
      sequenceRef.current = new window.Tone.Sequence((time: any, note: any) => synthRef.current.triggerAttackRelease(note, '8n', time), ['G4', 'C5'], '2n');
      window.Tone.Transport.loop = true;
      window.Tone.Transport.loopEnd = '1m';
    }
  }, []);

  useEffect(() => {
    if (callState === 'calling' && callDuration >= maxCallDuration) {
      handleHangUp(true);
    }
  }, [callDuration, callState, handleHangUp]);

  const handleButtonClick = (value: string) => { 
    if (phoneNumber.length < 15) setPhoneNumber(prev => prev + value); 
  };
  
  const handleBackspace = () => { 
    setPhoneNumber(prev => prev.slice(0, -1)); 
  };
  
  const handleClear = () => { 
    if (callState === 'calling') handleHangUp(); 
    setPhoneNumber(''); 
  };
  
  const handleCall = async () => { 
    const fullNumber = phoneNumber.replace(/[^\d]/g, '');
    
    if (!fullNumber.trim()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      toast.error('Invalid Number', {
        description: 'Please enter a phone number',
        icon: (
          <Button size="icon" variant="header" className="w-10 h-10 bg-white text-black">
            <UilExclamationTriangle className="h-5 w-5" />
          </Button>
        )
      });
      return;
    }

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber, countryCode)) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      toast.error('Invalid Number', {
        description: `Please enter a valid ${countryCode} phone number`,
        icon: (
          <Button size="icon" variant="header" className="w-10 h-10 bg-white text-black">
            <UilExclamationTriangle className="h-5 w-5" />
          </Button>
        )
      });
      return;
    }

    if (callState === 'idle') { 
      const formattedNumber = `${countryCode} ${phoneNumber}`;
      toast.info('Dialing...', {
        description: `Calling ${formattedNumber}`,
        icon: (
          <Button size="icon" variant="header" className="w-10 h-10 bg-white text-black">
            <UilPhone className="h-5 w-5 animate-pulse" />
          </Button>
        )
      });

      if (window.Tone) {
        await window.Tone.start(); 
        window.Tone.Transport.start(); 
        sequenceRef.current.start(0); 
      }
      
      setCallState('calling'); 
      
      setTimeout(() => {
        toast.success('Call Connected', {
          description: 'Voice call is now active',
          icon: (
            <Button size="icon" variant="header" className="w-10 h-10 bg-white text-black">
              <UilCheckCircle className="h-5 w-5" />
            </Button>
          )
        });
      }, 2000);

      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const dialPadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const handleRecordToggle = () => {
    if (callState === 'idle') {
      setIsRecording(!isRecording);
      toast.info(isRecording ? 'Recording disabled' : 'Recording enabled', {
        description: isRecording ? 'Call will not be recorded' : 'Your call will be recorded',
        icon: (
          <Button size="icon" variant="header" className="w-10 h-10 bg-white text-black">
            <UilCircle className={`h-5 w-5 ${isRecording ? 'text-red-600 animate-pulse' : 'text-gray-600'}`} />
          </Button>
        )
      });
    }
  };

  return (
    <>
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          
          {/* Phone Display */}
          <div className="mb-6">
            <Card className="bg-gray-50 border-2 border-black">
              <CardContent className="p-4">
                {/* Country Code and Number Input */}
                <div className={`flex border-2 border-black bg-white ${isShaking ? 'animate-shake' : ''}`}>
                  {/* Country Code Selector */}
                  {callState === 'idle' && (
                    <div className="border-r-2 border-black">
                      <Select.Root value={countryCode} onValueChange={setCountryCode}>
                        <Select.Trigger className="h-12 flex items-center justify-between px-3 bg-gray-100 hover:bg-gray-200 transition-colors font-semibold min-w-[80px]">
                          <Select.Value />
                          <Select.Icon><UilAngleDown className="h-4 w-4 ml-1" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content position="popper" sideOffset={5} className="bg-white border-2 border-black shadow-lg z-50">
                            <Select.ScrollUpButton className="flex items-center justify-center h-6 cursor-default">
                              <UilAngleUp className="h-3 w-3" />
                            </Select.ScrollUpButton>
                            <Select.Viewport className="p-1">
                              {countryCodes.map(c => (
                                <Select.Item key={c.value} value={c.value} className="p-2 relative flex items-center focus:outline-none data-[highlighted]:bg-gray-100 cursor-pointer">
                                  <Select.ItemText>{c.label}</Select.ItemText>
                                  <Select.ItemIndicator className="absolute right-2 inline-flex items-center">
                                    <UilCheck className="h-3 w-3" />
                                  </Select.ItemIndicator>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                            <Select.ScrollDownButton className="flex items-center justify-center h-6 cursor-default">
                              <UilAngleDown className="h-3 w-3" />
                            </Select.ScrollDownButton>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  )}
                  
                  {/* Phone Number Input */}
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      value={callState === 'calling' ? formatTime(callDuration) : phoneNumber}
                      onChange={(e) => {
                        if (callState === 'idle') {
                          const value = e.target.value.replace(/[^\d+\-\s()]/g, '');
                          if (value.length <= 15) setPhoneNumber(value);
                        }
                      }}
                      placeholder="Enter phone number"
                      readOnly={callState === 'calling'}
                      className={`w-full h-12 px-3 text-2xl font-mono text-center bg-transparent outline-none ${callState === 'calling' ? 'text-green-600 font-bold' : 'text-black'}`}
                      aria-label="Phone number input"
                    />
                    {callState === 'idle' && phoneNumber.length > 0 && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={handleBackspace} 
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        ←
                      </Button>
                    )}
                  </div>
                </div>

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-red-50 border border-red-200">
                    <UilCircle className="h-4 w-4 animate-pulse text-red-500" />
                    <span className="text-sm font-semibold text-red-600">Recording Enabled</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Call Progress */}
          {callState === 'calling' && (
            <div className="mb-6">
              <div className="bg-gray-200 rounded-full h-2 border border-black overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(callDuration / maxCallDuration) * 100}%` }}
                />
              </div>
              <p className="text-center text-sm mt-2 font-semibold">
                {maxCallDuration - callDuration}s remaining
              </p>
            </div>
          )}
          
          {/* Dial Pad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {dialPadKeys.map((key) => (
              <Button
                key={key}
                variant="outline"
                onClick={() => handleButtonClick(key)}
                className="h-12 text-xl font-bold bg-white hover:bg-gray-50 border-2 border-black"
                disabled={callState === 'calling'}
              >
                {key}
              </Button>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button
              variant="outline"
              onClick={handleRecordToggle}
              className={`h-12 border-2 border-black ${isRecording ? 'bg-red-100 hover:bg-red-200' : 'bg-white hover:bg-gray-50'}`}
              disabled={callState === 'calling'}
            >
              <UilCircle className={`h-5 w-5 ${isRecording ? 'text-red-600 animate-pulse' : 'text-gray-600'}`} />
            </Button>
            
            {callState === 'idle' ? (
              <Button
                variant="outline"
                onClick={handleCall}
                className="h-12 bg-green-100 hover:bg-green-200 border-2 border-black font-bold"
              >
                <UilPhone className="h-5 w-5 mr-2 text-green-600" />
                CALL
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleHangUp(false)}
                className="h-12 bg-red-100 hover:bg-red-200 border-2 border-black font-bold"
              >
                <UilPhoneSlash className="h-5 w-5 mr-2 text-red-600" />
                END
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleClear}
              className="h-12 bg-white hover:bg-gray-50 border-2 border-black font-bold"
            >
              CLEAR
            </Button>
          </div>

          {/* Voice Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase mb-3">Voice Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'normal', label: 'Normal', icon: UilMicrophone },
                { id: 'high-pitch', label: 'High Pitch', icon: UilStar },
                { id: 'alien', label: 'Alien', icon: UilRobot },
                { id: 'overlord', label: 'Overlord', icon: UilBrain }
              ].map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant="outline"
                  onClick={() => setVoiceType(id)}
                  className={`h-10 text-sm border-2 border-black ${
                    voiceType === id ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>
    </>
  );
};
