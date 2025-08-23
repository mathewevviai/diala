'use client';

import * as React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { UilPhone, UilEnvelope, UilLock, UilCheck, UilMessage, UilTimes } from '@tooni/iconscout-unicons-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (email: string, phone: string) => void;
  devMode?: boolean;
}

export default function VerificationModal({ isOpen, onClose, onComplete, devMode }: VerificationModalProps) {
  const [step, setStep] = React.useState<'contact' | 'otp'>('contact');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Auto-fill when dev mode is enabled
  React.useEffect(() => {
    if (devMode && isOpen) {
      setEmail('test@belfastroofer.com');
      setPhone('+44 28 9012 3456');
      setAgreedToTerms(true);
    }
  }, [devMode, isOpen]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && phone && agreedToTerms) {
      setIsLoading(true);
      // Simulate sending OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
      setStep('otp');
    }
  };

  const handleOTPSubmit = async () => {
    if (otp === '000000') {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete(email, phone);
    }
  };

  React.useEffect(() => {
    if (otp.length === 6) {
      handleOTPSubmit();
    }
  }, [otp]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
      <Card className="w-full max-w-md relative">
        <Button
          onClick={onClose}
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 z-10"
        >
          <UilTimes className="h-5 w-5" />
        </Button>
        {step === 'contact' ? (
          <>
            <CardHeader className="bg-[rgb(0,82,255)] p-6">
              <h2 className="text-2xl font-black uppercase text-white">VERIFY YOUR IDENTITY</h2>
              <p className="text-white/90 text-sm mt-2">Create your account to start using Diala</p>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="bg-transparent text-black border-2 border-black px-3 py-1.5 text-sm font-black uppercase">
                    <UilEnvelope className="h-4 w-4 mr-2" />
                    Email Address
                  </Badge>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="border-2 border-black"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Badge variant="outline" className="bg-transparent text-black border-2 border-black px-3 py-1.5 text-sm font-black uppercase">
                    <UilPhone className="h-4 w-4 mr-2" />
                    Phone Number
                  </Badge>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="border-2 border-black"
                    required
                  />
                </div>

                {/* Terms and Conditions */}
                <div className="mt-6 p-4 bg-yellow-100 border-4 border-black">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative mt-1">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 border-2 border-black transition-all ${
                        agreedToTerms ? 'bg-black' : 'bg-white'
                      }`}>
                        {agreedToTerms && (
                          <UilCheck className="h-5 w-5 text-white absolute top-0.5 left-0.5" />
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-black">
                      I agree to the{' '}
                      <a href="/terms" className="font-bold underline hover:text-[rgb(0,82,255)]">
                        Terms & Conditions
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="font-bold underline hover:text-[rgb(0,82,255)]">
                        Privacy Policy
                      </a>
                      . I understand this is an AI-powered service.
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email || !phone || !agreedToTerms}
                  className="w-full py-3 text-sm font-black uppercase bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
                >
                  <UilMessage className="h-4 w-4 mr-2" />
                  {isLoading ? 'SENDING CODE...' : 'SEND VERIFICATION CODE'}
                </Button>

                <p className="text-xs text-center text-gray-600 mt-4">
                  By signing up, you'll get access to all features including voice customization and real-time calling.
                </p>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="bg-[rgb(0,82,255)] p-6">
              <h2 className="text-2xl font-black uppercase text-white">ENTER CODE</h2>
              <p className="text-white/90 text-sm mt-2">We sent a 6-digit code to {phone}</p>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex justify-center pt-4">
                  <Button variant="neutral" className="w-20 h-20 bg-[#FFD700]">
                    <UilLock className="h-10 w-10 text-black" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-black uppercase text-black text-center mb-4">
                    Verification Code
                  </label>
                  <Input
                    type="text"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl font-black tracking-[0.5em] border-4 border-black h-16"
                    disabled={isLoading}
                  />
                </div>

                {isLoading && (
                  <div className="text-center">
                    <p className="text-[rgb(0,82,255)] font-black animate-pulse uppercase">
                      Verifying...
                    </p>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-600">
                    Didn't receive a code?{' '}
                    <Button variant="noShadow" className="font-bold p-0 h-auto">
                      Resend
                    </Button>
                  </p>
                  <p className="text-xs text-gray-500">
                    Demo hint: Use 000000
                  </p>
                </div>

                <Button
                  onClick={() => setStep('contact')}
                  variant="neutral"
                  className="w-full py-2 text-sm font-black uppercase"
                >
                  ← Change Number
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}