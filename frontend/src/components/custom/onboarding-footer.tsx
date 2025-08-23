'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  UilRobot,
  UilPhone,
  UilSearch,
  UilDatabase,
  UilApps,
  UilMicrophone,
  UilFileAlt,
  UilCommentAltDots,
  UilCopy,
  UilBook,
  UilBookAlt,
  UilGraduationCap,
  UilWifi,
  UilMusic,
  UilArrowLeft,
  UilArrowRight
} from '@tooni/iconscout-unicons-react';

const navItems = [
  { 
    href: '/onboarding/calls', 
    label: 'CALLS', 
    icon: UilPhone,
    description: 'Configure outbound calling',
    color: 'bg-orange-500'
  },
  { 
    href: '/onboarding/cloning', 
    label: 'CLONING', 
    icon: UilCopy,
    description: 'Clone voice from content',
    color: 'bg-pink-500'
  },
  { 
    href: '/onboarding/hunter', 
    label: 'HUNTER', 
    icon: UilSearch,
    description: 'Lead generation & search',
    color: 'bg-violet-400'
  },
  { 
    href: '/onboarding/rag', 
    label: 'RAG', 
    icon: UilDatabase,
    description: 'Knowledge base setup',
    color: 'bg-cyan-400'
  },
  { 
    href: '/onboarding/transcribe', 
    label: 'TRANSCRIBE', 
    icon: UilMicrophone,
    description: 'Audio transcription',
    color: 'bg-blue-500'
  },
  { 
    href: '/onboarding/transcripts', 
    label: 'TRANSCRIPTS', 
    icon: UilFileAlt,
    description: 'YouTube & media import',
    color: 'bg-red-500'
  },
  {
    href: '/onboarding/voice',
    label: 'VOICE',
    icon: UilCommentAltDots,
    description: 'Voice interface testing',
    color: 'bg-pink-500'
  },
  {
    href: '/onboarding/procedural',
    label: 'PROCEDURAL',
    icon: UilMusic,
    description: 'Generate custom procedural audio',
    color: 'bg-purple-500'
  },
  {
    href: '/onboarding/rtc',
    label: 'RTC',
    icon: UilWifi,
    description: 'Real-time voice demo',
    color: 'bg-green-500'
  },
  { 
    href: '/onboarding/blog', 
    label: 'BLOG', 
    icon: UilBook,
    description: 'Learn from expert articles',
    color: 'bg-yellow-400'
  },
  { 
    href: '/onboarding/guides', 
    label: 'GUIDES', 
    icon: UilBookAlt,
    description: 'Step-by-step tutorials',
    color: 'bg-cyan-400'
  },
  { 
    href: '/onboarding/courses', 
    label: 'COURSES', 
    icon: UilGraduationCap,
    description: 'Structured learning paths',
    color: 'bg-purple-500'
  }
];

interface OnboardingFooterProps {
  onNext?: () => void;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
  isNextDisabled?: boolean;
  nextLabel?: string;
  showNavigation?: boolean;
}

export function OnboardingFooter({
  onNext,
  onBack,
  currentStep = 1,
  totalSteps = 3,
  isNextDisabled = false,
  nextLabel = 'CONTINUE',
  showNavigation = false
}: OnboardingFooterProps) {
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4">
        {onNext && (
          <div className="flex justify-center gap-4 mb-6">
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="font-black uppercase border-2 border-black"
              >
                <UilArrowLeft className="mr-2 h-4 w-4" />
                BACK
              </Button>
            )}
            <Button
              onClick={onNext}
              disabled={isNextDisabled}
              className="font-black uppercase bg-purple-500 hover:bg-purple-600 text-white"
            >
              {nextLabel}
              <UilArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-gray-50">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left side - Navigation */}
              <div className="lg:col-span-2">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase text-gray-600 mb-2">Quick Navigation</p>
                  <div className="w-full h-0.5 bg-black"></div>
                </div>
                <div className="grid grid-cols-4 gap-x-3 gap-y-1">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}>
                        <div className="flex items-center gap-1.5 py-0.5 group cursor-pointer hover:translate-x-1 transition-transform">
                          <Badge className={`p-1 border-2 border-black ${item.color}`}>
                            <Icon className="h-3 w-3 text-white" />
                          </Badge>
                          <span className="text-xs font-bold uppercase">{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              {/* Right side - Branding */}
              <div className="text-right space-y-3">
                <div>
                  <h3 className="text-2xl font-black uppercase">DIALA</h3>
                  <p className="text-xs text-gray-600 mt-1">AI voice agents for modern business</p>
                </div>
                <div className="text-xs text-gray-500">
                  <p>© 2025 Diala. All rights reserved.</p>
                  <p className="mt-1">Terms · Privacy · Contact</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
