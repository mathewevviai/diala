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
  const [callState, setCallState] = useState<'idle' | 'dialing' | 'connected' | 'failed'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [voiceType, setVoiceType] = useState('normal');
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const synthRef = useRef<any>(null);
  const sequenceRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Realistic call simulation with failures
  const simulateCall = async (phoneNumber: string): Promise<{success: boolean, duration?: number, error?: string}> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate various failure scenarios
        const random = Math.random();
        
        if (random < 0.3) {
          resolve({success: false, error: 'Network timeout - unable to reach destination'});
        } else if (random < 0.5) {
          resolve({success: false, error: 'Invalid number format or unreachable'});
        } else if (random < 0.7) {
          resolve({success: false, error: 'Service temporarily unavailable'});
        } else {
          // Success case
          const duration = Math.floor(Math.random() * 180) + 30; // 30-210 seconds
          resolve({success: true, duration});
        }
      }, 2000 + Math.random() * 3000); // 2-5 second delay
    });
  };

  const handleHangUp = useCallback(() => { 
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setCallState('idle');
    setCallDuration(0);
    setErrorMessage(null);
  }, []);

  const handleCall = async () => { 
    const fullNumber = phoneNumber.replace(/[^\d]/g, '');
    
    if (!fullNumber.trim()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      toast.error('Invalid Number', {
        description: 'Please enter a phone number',
        style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' },
        icon: <UilExclamationTriangle className="h-5 w-5 text-red-500" />
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber, countryCode)) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      toast.error('Invalid Number', {
        description: `Please enter a valid ${countryCode} phone number`,
        style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' },
        icon: <UilExclamationTriangle className="h-5 w-5 text-red-500" />
      });
      return;
    }

    // Start dialing
    setCallState('dialing');
    setErrorMessage(null);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    toast.info('Dialing...', {
      description: `Calling ${countryCode} ${phoneNumber}`,
      style: { background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd' },
      icon: <UilPhone className="h-5 w-5 text-blue-500" />
    });

    try {
      const result = await simulateCall(`${countryCode}${phoneNumber}`);
      
      if (result.success && result.duration) {
        setCallState('connected');
        toast.success('Call Connected', {
          description: `Connected to ${countryCode} ${phoneNumber}`,
          style: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' },
          icon: <UilCheckCircle className="h-5 w-5 text-green-500" />
        });

        // Start call duration timer
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);

        // Auto-end after simulated duration
        setTimeout(() => {
          handleHangUp();
          onCallComplete(result.duration!, voiceType, isRecording);
        }, result.duration * 1000);

      } else {
        setCallState('failed');
        setErrorMessage(result.error || 'Call failed');
        toast.error('Call Failed', {
          description: result.error || 'Unable to connect',
          style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' },
          icon: <UilExclamationTriangle className="h-5 w-5 text-red-500" />
        });
      }
      
    } catch (error) {
      setCallState('failed');
      setErrorMessage('Connection error');
      toast.error('Call Error', {
        description: 'Failed to establish connection',
        style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' },
        icon: <UilExclamationTriangle className="h-5 w-5 text-red-500" />
      });
    }
  };

  const handleClear = () => { 
    if (callState === 'dialing' || callState === 'connected') {
      handleHangUp();
    }
    setPhoneNumber(''); 
    setErrorMessage(null);
  };

  const dialPadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const getStatusColor = () => {
    switch (callState) {
      case 'dialing': return 'text-blue-600';
      case 'connected': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (callState) {
      case 'dialing': return 'Dialing...';
      case 'connected': return `Connected (${formatTime(callDuration)})`;
      case 'failed': return 'Call Failed';
      default: return 'Ready';
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
      
      <Card className="max-w-md mx-auto bg-white border-2 border-black shadow-lg">
        <CardContent className="p-6">
          
          {/* Status Display */}
          <div className="mb-4 text-center">
            <div className={`text-lg font-bold ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            {errorMessage && (
              <div className="text-sm text-red-600 mt-1">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Phone Display */}
          <div className="mb-6">
            <Card className="bg-gray-50 border-2 border-black">
              <CardContent className="p-4">
                <div className={`flex border-2 border-black bg-white ${isShaking ? 'animate-shake' : ''}`}>
                  {/* Country Code Selector */}
                  <div className="border-r-2 border-black">
                    <Select.Root value={countryCode} onValueChange={setCountryCode}>
                      <Select.Trigger className="h-12 flex items-center justify-between px-3 bg-gray-100 hover:bg-gray-200 transition-colors font-semibold min-w-[80px]">
                        <Select.Value />
                        <Select.Icon><UilAngleDown className="h-4 w-4 ml-1" /></Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content position="popper" sideOffset={5} className="bg-white border-2 border-black shadow-lg z-50">
                          <Select.Viewport className="p-1">
                            {countryCodes.map(c => (
                              <Select.Item key={c.value} value={c.value} className="p-2 relative flex items-center focus:outline-none data-[highlighted]:bg-gray-100 cursor-pointer">
                                <Select.ItemText>{c.label}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                  
                  {/* Phone Number Input */}
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      value={callState === 'connected' ? formatTime(callDuration) : phoneNumber}
                      onChange={(e) => {
                        if (callState === 'idle') {
                          const value = e.target.value.replace(/[^\d+\-\s()]/g, '');
                          if (value.length <= 15) setPhoneNumber(value);
                        }
                      }}
                      placeholder="Enter phone number"
                      readOnly={callState !== 'idle'}
                      className={`w-full h-12 px-3 text-2xl font-mono text-center bg-transparent outline-none ${
                        callState === 'connected' ? 'text-green-600 font-bold' : 
                        callState === 'failed' ? 'text-red-600' : 
                        'text-black'
                      }`}
                      aria-label="Phone number input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Dial Pad */}
          {callState === 'idle' && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  onClick={() => setPhoneNumber(prev => prev + key)}
                  className="h-12 text-xl font-bold bg-white hover:bg-gray-50 border-2 border-black"
                >
                  {key}
                </Button>
              ))}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => setIsRecording(!isRecording)}
              className={`h-12 border-2 border-black ${isRecording ? 'bg-red-100 hover:bg-red-200' : 'bg-white hover:bg-gray-50'}`}
              disabled={callState !== 'idle'}
            >
              <UilCircle className={`h-5 w-5 ${isRecording ? 'text-red-600 animate-pulse' : 'text-gray-600'}`} />
            </Button>
            
            {callState === 'idle' ? (
              <Button
                variant="outline"
                onClick={handleCall}
                className="h-12 bg-blue-100 hover:bg-blue-200 border-2 border-black font-bold"
              >
                <UilPhone className="h-5 w-5 mr-2 text-blue-600" />
                CALL
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleHangUp}
                className="h-12 bg-red-100 hover:bg-red-200 border-2 border-black font-bold"
              >
                <UilPhoneSlash className="h-5 w-5 mr-2 text-red-600" />
                END
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => {
                setPhoneNumber('');
                setErrorMessage(null);
                if (callState !== 'idle') handleHangUp();
              }}
              className="h-12 bg-white hover:bg-gray-50 border-2 border-black font-bold"
            >
              CLEAR
            </Button>
          </div>

          {/* Voice Selection */}
          {callState === 'idle' && (
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
          )}

        </CardContent>
      </Card>
    </>
  );
};
