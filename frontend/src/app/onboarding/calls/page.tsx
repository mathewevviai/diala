'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import OnboardingNav from '@/components/custom/onboarding-nav';
import PremiumFeatureCard from '@/components/custom/premium-feature-card';
import VerificationModal from '@/components/custom/modals/verification-modal';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import InfoSection from '@/components/custom/info-section';
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useConvexErrorHandler } from '@/hooks/useConvexErrorHandler';
import { StarBadge, Star15 } from '@/components/ui/star';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UilPhone,
  UilPhoneVolume,
  UilOutgoingCall,
  UilMissedCall,
  UilCalendarAlt,
  UilClock,
  UilUpload,
  UilUsersAlt,
  UilRobot,
  UilArrowRight,
  UilArrowLeft,
  UilCheckCircle,
  UilPlay,
  UilPause,
  UilInfoCircle,
  UilChartGrowth,
  UilBell,
  UilVoicemail,
  UilClipboardNotes,
  UilListUl,
  UilAnalytics,
  UilTachometerFast,
  UilBriefcase,
  UilQuestionCircle
} from '@tooni/iconscout-unicons-react';

interface Agent {
  id: string;
  name: string;
  language: string;
  pitch: string;
}

interface CallSettings {
  startTime: string;
  endTime: string;
  timezone: string;
  maxCallsPerDay: number;
  retryAttempts: number;
  daysBetweenRetries: number;
  leaveVoicemail: boolean;
  callRecording: boolean;
}

const mockAgents: Agent[] = [
  { id: 'agent-1', name: 'Sales Champion', language: 'English', pitch: 'Discovery Calls' },
  { id: 'agent-2', name: 'Support Hero', language: 'English', pitch: 'Customer Support' },
  { id: 'agent-3', name: 'Booking Pro', language: 'English', pitch: 'Appointment Setter' },
];

interface Voice {
  id: string;
  name: string;
  description: string;
  previewText: string;
  premium?: boolean;
}

const voices: Voice[] = [
  {
    id: 'voice-1',
    name: 'Professional Sarah',
    description: 'Clear, confident business voice',
    previewText: "Hello, this is Sarah calling about your business growth opportunities..."
  },
  {
    id: 'voice-2',
    name: 'Friendly Alex',
    description: 'Warm, approachable conversational tone',
    previewText: "Hi there! I hope you&apos;re having a great day. I&apos;m reaching out to discuss..."
  },
  {
    id: 'voice-3',
    name: 'Executive Maya',
    description: 'Sophisticated, authoritative presence',
    previewText: "Good afternoon. This is Maya with an important business opportunity..."
  },
  {
    id: 'voice-4',
    name: 'Energetic Jake',
    description: 'Enthusiastic, high-energy approach',
    previewText: "Hey! Jake here with some exciting news about your business potential..."
  },
  {
    id: 'custom',
    name: 'Create Your Own',
    description: 'Clone your own voice for personalized calls',
    previewText: "Use your own voice for authentic conversations",
    premium: true
  }
];

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
];

export default function CallsOnboarding() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [campaignName, setCampaignName] = React.useState('');
  const [campaignGoals, setCampaignGoals] = React.useState('');
  const [campaignType, setCampaignType] = React.useState('');
  const [selectedAgent, setSelectedAgent] = React.useState('');
  const [targetListType, setTargetListType] = React.useState('');
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [manualNumbers, setManualNumbers] = React.useState('');
  const [callSettings, setCallSettings] = React.useState<CallSettings>({
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'America/New_York',
    maxCallsPerDay: 100,
    retryAttempts: 3,
    daysBetweenRetries: 2,
    leaveVoicemail: true,
    callRecording: true
  });

  const [selectedVoice, setSelectedVoice] = React.useState('');
  const [isPlaying, setIsPlaying] = React.useState<string | null>(null);
  const [isLaunching, setIsLaunching] = React.useState(false);
  const [launchProgress, setLaunchProgress] = React.useState(0);
  const [showVerification, setShowVerification] = React.useState(false);
  const [campaignStats, setCampaignStats] = React.useState<any>(null);
  const [estimatedContacts, setEstimatedContacts] = React.useState(0);

  // Auto-adjust max calls based on contact count
  React.useEffect(() => {
    if (estimatedContacts > 0) {
      const maxCalls = Math.min(Math.max(10, estimatedContacts * 2), 200);
      setCallSettings(prev => ({ ...prev, maxCallsPerDay: maxCalls }));
    }
  }, [estimatedContacts]);
  const [devMode, setDevMode] = React.useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      // Simulate contact count
      setEstimatedContacts(Math.floor(Math.random() * 500) + 100);
    }
  };

  const canProceedFromStep1 = () => {
    return campaignName.trim() !== '' && campaignGoals.trim() !== '' && campaignType !== '';
  };

  const canProceedFromStep4 = () => {
    if (targetListType === 'upload' && uploadedFile) return true;
    if (targetListType === 'manual' && manualNumbers.trim()) return true;
    if (targetListType === 'existing') return true;
    return false;
  };

  const handleLaunchCampaign = async () => {
    setIsLaunching(true);
    setCurrentStep(6);
    
    // Simulate launch progress
    for (let i = 0; i <= 100; i += 20) {
      setLaunchProgress(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Show verification modal after progress reaches 100%
    setShowVerification(true);
  };

  const handleVerificationComplete = async (email: string, phone: string) => {
    setShowVerification(false);
    
    // Calculate realistic duration based on settings
    const contactsCount = estimatedContacts || 250;
    const dailyCalls = callSettings.maxCallsPerDay;
    const daysNeeded = Math.ceil(contactsCount / dailyCalls);
    const estimatedDuration = daysNeeded === 1 ? '1 day' : 
                             daysNeeded <= 3 ? `${daysNeeded} days` :
                             daysNeeded <= 7 ? '1 week' : 
                             `${Math.ceil(daysNeeded / 7)} weeks`;
    
    // Set campaign stats
    setCampaignStats({
      totalContacts: contactsCount,
      callsScheduled: contactsCount,
      estimatedDuration: estimatedDuration,
      startTime: new Date().toLocaleString(),
      status: 'Active'
    });
    
    setIsLaunching(false);
  };

  // Only allow explicit navigation via button clicks
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  // Dev mode auto-fill effect
  React.useEffect(() => {
    if (devMode) {
      setCampaignName('Q4 Sales Outreach Campaign');
      setCampaignGoals('Generate 50 qualified leads for our SaaS platform through targeted outreach to mid-market companies');
      setCampaignType('sales');
      setSelectedAgent('agent-1');
      setSelectedVoice('voice-1');
      setTargetListType('manual');
      setManualNumbers('+1 555-0123\n+1 555-0124\n+1 555-0125\n+1 555-0126\n+1 555-0127');
      setEstimatedContacts(6);
      setCallSettings({
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'America/New_York',
        maxCallsPerDay: 12, // Auto-adjusted: 6 contacts × 2 = 12 max calls
        retryAttempts: 3,
        daysBetweenRetries: 2,
        leaveVoicemail: true,
        callRecording: true
      });
    }
  }, [devMode]);

  const handlePlayVoice = (voiceId: string, previewText: string) => {
    setIsPlaying(voiceId);
    // Simulate audio playback
    setTimeout(() => {
      setIsPlaying(null);
    }, 2000);
  };

  return (
    <TooltipProvider>
      <div 
        className="min-h-screen bg-orange-500 relative pb-8" 
        style={{ 
          fontFamily: 'Noyh-Bold, sans-serif',
          backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      >
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => setDevMode(!devMode)}
            className={`h-10 px-4 text-sm font-black uppercase ${
              devMode
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-black'
            } border-2 border-black`}
          >
            DEV MODE {devMode ? 'ON' : 'OFF'}
          </Button>
        </div>
      )}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-8 pb-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Persistent Title Card */}
          <Card className="transform rotate-1 relative overflow-hidden">
            <CardHeader className="relative">
              <div className="absolute top-2 left-4 w-8 h-8 bg-orange-600 border-2 border-black flex items-center justify-center">
                <UilPhone className="h-4 w-4 text-white" />
              </div>
              <div className="absolute top-2 right-4 w-8 h-8 bg-orange-500 border-2 border-black flex items-center justify-center">
                <UilPhoneVolume className="h-4 w-4 text-white" />
              </div>
              <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
                <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
              </div>
              <div className="absolute bottom-2 right-8 w-4 h-4 bg-red-500 border-2 border-black -rotate-12"></div>
              <div className="flex justify-center mb-4">
                <Button className="w-20 h-20 bg-orange-600 hover:bg-orange-700 border-4 border-black p-0">
                {currentStep === 1 && <UilBriefcase className="h-12 w-12 text-white" />}
                {currentStep === 2 && <UilRobot className="h-12 w-12 text-white" />}
                {currentStep === 3 && <UilPhone className="h-12 w-12 text-white" />}
                {currentStep === 4 && <UilUsersAlt className="h-12 w-12 text-white" />}
                {currentStep === 5 && <UilClock className="h-12 w-12 text-white" />}
                {currentStep === 6 && <UilPlay className="h-12 w-12 text-white" />}
                {currentStep === 7 && <UilCheckCircle className="h-12 w-12 text-white" />}
              </Button>
              </div>
              <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                {currentStep === 1 && 'CAMPAIGN CREATION'}
                {currentStep === 2 && 'AGENT SELECTION'}
                {currentStep === 3 && 'VOICE SELECTION'}
                {currentStep === 4 && 'TARGET AUDIENCE'}
                {currentStep === 5 && 'CALL CONFIGURATION'}
                {currentStep === 6 && 'LAUNCH READY'}
                {currentStep === 7 && (isLaunching ? 'LAUNCHING CAMPAIGN' : 'CAMPAIGN LAUNCHED')}
              </CardTitle>
              <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
                {currentStep === 1 && 'BUILD YOUR OUTREACH STRATEGY'}
                {currentStep === 2 && 'CHOOSE YOUR AI REPRESENTATIVE'}
                {currentStep === 3 && 'SELECT THE PERFECT VOICE'}
                {currentStep === 4 && 'DEFINE WHO TO REACH'}
                {currentStep === 5 && 'OPTIMIZE YOUR CAMPAIGN'}
                {currentStep === 6 && 'REVIEW AND DEPLOY'}
                {currentStep === 7 && (isLaunching ? 'SETTING UP YOUR CAMPAIGN' : 'YOUR CAMPAIGN IS LIVE')}
              </p>
              <div className="flex justify-center items-center mt-3 gap-2">
                <div className="w-3 h-3 bg-orange-600 animate-pulse"></div>
                <div className="w-2 h-6 bg-black"></div>
                <div className="w-4 h-4 bg-orange-500 animate-pulse delay-150"></div>
                <div className="w-2 h-8 bg-black"></div>
                <div className="w-3 h-3 bg-orange-600 animate-pulse delay-300"></div>
              </div>
            </CardHeader>
          </Card>
          {/* Step 1: Campaign Setup */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Campaign Details Card */}
              <Card className="transform -rotate-1">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                      CAMPAIGN SETUP
                    </h1>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-xl font-black uppercase mb-3 block">
                        CAMPAIGN NAME
                      </label>
                      <Input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="e.g., Q4 Sales Blitz, Customer Feedback"
                        className="h-16 text-lg font-semibold border-4 border-black rounded-[3px]"
                      />
                    </div>

                    <div>
                      <label className="text-xl font-black uppercase mb-3 block">
                        CAMPAIGN TYPE
                      </label>
                      <TooltipProvider>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="relative">
                          {campaignType === 'sales' && (
                            <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                              <div className="relative">
                                <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                                  <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                                    SELECTED
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Card 
                                className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
                                  campaignType === 'sales' ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                                }`}
                                onClick={() => setCampaignType('sales')}
                              >
                                <CardContent className="p-4 text-center">
                                  <UilTachometerFast className="h-8 w-8 mx-auto mb-2" />
                                  <h4 className="font-black uppercase">SALES</h4>
                                  <p className="text-sm text-gray-600">Outbound prospecting</p>
                                </CardContent>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Focused on qualifying leads and booking meetings. Agents use persistent follow-up and objection handling techniques.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          {campaignType === 'followup' && (
                            <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                              <div className="relative">
                                <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                                  <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                                    SELECTED
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Card 
                                className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
                                  campaignType === 'followup' ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                                }`}
                                onClick={() => setCampaignType('followup')}
                              >
                                <CardContent className="p-4 text-center">
                                  <UilBell className="h-8 w-8 mx-auto mb-2" />
                                  <h4 className="font-black uppercase">FOLLOW-UP</h4>
                                  <p className="text-sm text-gray-600">Re-engage leads</p>
                                </CardContent>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Re-engage existing leads or customers. Agents focus on relationship building and identifying new opportunities.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          {campaignType === 'survey' && (
                            <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                              <div className="relative">
                                <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                                  <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                                    SELECTED
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Card 
                                className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
                                  campaignType === 'survey' ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                                }`}
                                onClick={() => setCampaignType('survey')}
                              >
                                <CardContent className="p-4 text-center">
                                  <UilClipboardNotes className="h-8 w-8 mx-auto mb-2" />
                                  <h4 className="font-black uppercase">SURVEY</h4>
                                  <p className="text-sm text-gray-600">Gather feedback</p>
                                </CardContent>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Collect customer feedback and insights. Agents conduct structured interviews and ensure high completion rates.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      </TooltipProvider>
                    </div>

                    <div>
                      <label className="text-xl font-black uppercase mb-3 block">
                        CAMPAIGN GOALS
                      </label>
                      <Textarea
                        value={campaignGoals}
                        onChange={(e) => setCampaignGoals(e.target.value)}
                        placeholder="What do you want to achieve? e.g., Book 50 demos, collect customer feedback, qualify 100 leads..."
                        className="min-h-[120px] text-lg font-semibold border-4 border-black rounded-[3px] resize-none"
                      />
                    </div>
                  </div>

                  {/* Info Box */}
                  <Card className="bg-yellow-100 border-2 border-black mt-6">
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
                          <p className="text-sm font-bold">CAMPAIGN TIPS</p>
                          <p className="text-sm text-gray-700 mt-1">
                            Give your campaign a clear name and specific goals. This helps our AI agents understand 
                            your objectives and adapt their conversations accordingly.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    className="w-full mt-8 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedFromStep1()}
                  >
                    <span className="flex items-center justify-center">
                      CONTINUE
                      <UilArrowRight className="ml-2 h-6 w-6" />
                    </span>
                  </Button>
                </CardContent>
              </Card>

              
              {/* Custom Info Cards */}
              <Card className="transform -rotate-1 relative overflow-hidden bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Button
                      size="icon"
                      variant="default"
                      className="w-12 h-12 flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white border-black"
                    >
                      <UilChartGrowth className="h-6 w-6 text-white" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                        CAMPAIGN PERFORMANCE AT SCALE
                      </h3>
                      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                        Our campaigns achieve <span className="font-black text-orange-600">3x higher connection rates</span> than traditional dialers. 
                        AI-powered scheduling ensures calls happen at optimal times, while intelligent retry logic maximizes reach without annoying prospects.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Real-time campaign analytics</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">AI-optimized call timing</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Smart retry logic</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Voicemail detection</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="transform rotate-1 relative overflow-hidden bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Button
                      size="icon"
                      variant="default"
                      className="w-12 h-12 flex-shrink-0 bg-yellow-400 hover:bg-yellow-400/90 text-black"
                    >
                      <UilAnalytics className="h-6 w-6 text-black" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                        CONVERSION OPTIMIZATION
                      </h3>
                      <p className="text-gray-700 text-lg leading-relaxed">
                        Track every interaction and optimize for conversions. Our AI learns from each call, improving scripts and timing to 
                        <span className="font-black text-orange-600"> boost your conversion rates by up to 40%</span>. Get detailed insights on what works 
                        and what doesn&apos;t, with actionable recommendations for improvement.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Info Section for Step 1 */}
          {currentStep === 1 && (
            <InfoSection customContent={{
              icon: <UilBriefcase className="h-6 w-6 text-white" />,
              title: "Build Powerful Outreach Campaigns",
              description: "Create targeted campaigns that convert. Our AI-powered approach combines smart goal setting, intelligent campaign types, and strategic planning to maximize your outreach success and drive meaningful business results.",
              benefits: [
                "3x higher conversion rates than traditional dialers",
                "AI-optimized campaign strategies and timing",
                "Real-time performance tracking and analytics",
                "Intelligent lead qualification and scoring"
              ],
              faqs: [
                {
                  icon: <UilBriefcase className="h-5 w-5" />,
                  question: "What makes campaign types important?",
                  answer: "Different campaign types are optimized for specific outcomes. Sales campaigns focus on conversion and qualification, Follow-up campaigns nurture existing relationships, and Survey campaigns gather valuable feedback - each with tailored AI strategies."
                },
                {
                  icon: <UilChartGrowth className="h-5 w-5" />,
                  question: "How do clear goals improve performance?",
                  answer: "Specific goals help our AI adapt conversation strategies in real-time. Whether booking demos or qualifying leads, clear objectives enable the system to optimize scripts, timing, and follow-up sequences for maximum success."
                },
                {
                  icon: <UilTachometerFast className="h-5 w-5" />,
                  question: "Can I modify my campaign after launching?",
                  answer: "Absolutely! You can pause, modify goals, adjust targeting, or change campaign types anytime. Our system adapts immediately to new parameters while maintaining conversation quality and tracking performance changes."
                }
              ]
            }} />
          )}

          {/* Step 2: Agent Selection */}
          {currentStep === 2 && (
            <Card className="transform -rotate-1">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                    SELECT YOUR AGENT
                  </h1>
                </div>
                <p className="text-xl text-center text-gray-700 mb-8">
                  Choose which AI agent will handle your campaign calls
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {mockAgents.map((agent) => (
                    <div key={agent.id} className="relative">
                      {selectedAgent === agent.id && (
                        <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                          <div className="relative">
                            <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                              <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                                SELECTED
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <Card 
                        className={`cursor-pointer border-4 border-black hover:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all ${
                          selectedAgent === agent.id ? 'bg-orange-100 shadow-[8px_8px_0_rgba(0,0,0,1)]' : 'bg-white'
                        }`}
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Button size="icon" variant="header" className="w-16 h-16 bg-orange-500 hover:bg-orange-600 flex-shrink-0">
                            <UilRobot className="h-8 w-8 text-white" />
                          </Button>
                          <div className="flex-1">
                            <h3 className="text-xl font-black uppercase mb-2">{agent.name}</h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-orange-200 text-black border-2 border-black">
                                {agent.language}
                              </Badge>
                              <Badge className="bg-yellow-200 text-black border-2 border-black">
                                {agent.pitch}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  ))}
                </div>

                {/* Info Box */}
                <Card className="bg-yellow-100 border-2 border-black mt-6">
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
                        <p className="text-sm font-bold">AGENT SELECTION</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Choose an agent that matches your campaign type. Sales agents are persistent, 
                          support agents are empathetic, and booking agents focus on scheduling.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4 mt-8">
                  <Button
                    className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
                    onClick={() => setCurrentStep(1)}
                  >
                    <UilArrowLeft className="mr-2 h-6 w-6" />
                    BACK
                  </Button>
                  <Button
                    className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                    onClick={() => setCurrentStep(3)}
                    disabled={!selectedAgent}
                  >
                    CONTINUE
                    <UilArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Section for Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              
              {/* Custom Info Cards */}
              <Card className="transform rotate-1 relative overflow-hidden bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Button
                      size="icon"
                      variant="default"
                      className="w-12 h-12 flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white border-black"
                    >
                      <UilRobot className="h-6 w-6 text-white" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                        AI-POWERED AGENT EXCELLENCE
                      </h3>
                      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                        Our AI agents achieve <span className="font-black text-orange-600">85% conversation success rates</span> by adapting their approach in real-time. 
                        Each agent specializes in different conversation styles, from assertive sales pitches to empathetic support interactions.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Natural conversation flow</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Objection handling</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Sentiment analysis</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Multi-language support</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Info Section for Step 2 */}
          {currentStep === 2 && (
            <InfoSection customContent={{
              icon: <UilRobot className="h-6 w-6 text-white" />,
              title: "Choose Your Perfect AI Representative",
              description: "Select the AI agent that best matches your campaign goals. Each agent is trained with specialized conversation skills, industry knowledge, and personality traits optimized for different business scenarios and customer interactions.",
              benefits: [
                "85% conversation success rates across all agent types",
                "Real-time conversation adaptation and objection handling",
                "Specialized training for sales, support, and appointments",
                "Natural personality matching for authentic interactions"
              ],
              faqs: [
                {
                  icon: <UilRobot className="h-5 w-5" />,
                  question: "What makes each agent different?",
                  answer: "Sales Champion excels at discovery calls and lead qualification with assertive techniques. Support Hero handles customer service with empathy and problem-solving skills. Booking Pro specializes in appointment scheduling with persistence and calendar management."
                },
                {
                  icon: <UilUsersAlt className="h-5 w-5" />,
                  question: "How do agents handle different personality types?",
                  answer: "Our AI agents use real-time sentiment analysis to adapt their approach. They can shift from formal to casual, adjust pace and enthusiasm, and modify their questioning style based on prospect responses and engagement levels."
                },
                {
                  icon: <UilInfoCircle className="h-5 w-5" />,
                  question: "Can agents speak multiple languages fluently?",
                  answer: "Yes! Each agent supports multiple languages with native-level pronunciation and cultural awareness. They understand regional business customs, appropriate formality levels, and industry-specific terminology for natural conversations."
                }
              ]
            }} />
          )}

          {/* Step 3: Voice Selection */}
          {currentStep === 3 && (
            <Card className="transform -rotate-1">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                    SELECT YOUR VOICE
                  </h1>
                </div>
                <p className="text-xl text-center text-gray-700 mb-8">
                  Choose the perfect voice for your AI agent
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {voices.filter(voice => !voice.premium).map((voice) => (
                    <div key={voice.id} className="relative">
                      {selectedVoice === voice.id && (
                        <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                          <div className="relative">
                            <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                              <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                                SELECTED
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <Card 
                        className={`cursor-pointer border-4 border-black hover:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all ${
                          selectedVoice === voice.id ? 'bg-orange-100 shadow-[8px_8px_0_rgba(0,0,0,1)]' : 'bg-white'
                        }`}
                        onClick={() => setSelectedVoice(voice.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Button size="icon" variant="header" className="w-16 h-16 bg-orange-500 hover:bg-orange-600 flex-shrink-0">
                              <UilPhone className="h-8 w-8 text-white" />
                            </Button>
                            <div className="flex-1">
                              <h3 className="text-xl font-black uppercase mb-2">{voice.name}</h3>
                              <p className="text-gray-700 mb-3">{voice.description}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-2 border-black hover:bg-orange-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayVoice(voice.id, voice.previewText);
                                }}
                              >
                                {isPlaying === voice.id ? (
                                  <>
                                    <UilPause className="h-4 w-4 mr-1" />
                                    PLAYING
                                  </>
                                ) : (
                                  <>
                                    <UilPlay className="h-4 w-4 mr-1" />
                                    PREVIEW
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                  
                  <div className="md:col-span-2">
                    <PremiumFeatureCard 
                      title="CREATE YOUR OWN VOICE"
                      description="Clone your own voice for personalized calls. Use advanced AI to create a perfect replica of your voice for authentic conversations with prospects."
                      price="$99/month"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button
                    className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
                    onClick={() => setCurrentStep(2)}
                  >
                    <UilArrowLeft className="mr-2 h-6 w-6" />
                    BACK
                  </Button>
                  <Button
                    className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                    onClick={() => setCurrentStep(6)}
                    disabled={!selectedVoice}
                  >
                    CONTINUE
                    <UilArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </div>

                {/* Info Box */}
                <Card className="bg-yellow-100 border-2 border-black mt-6">
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
                        <p className="text-sm font-bold">VOICE SELECTION</p>
                          <p className="text-sm text-gray-700 mt-1">
                            Choose a voice that matches your brand personality. Preview each option to hear how they&apos;ll sound to your prospects.
                          </p>                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Target List */}
          {currentStep === 4 && (
            <Card className="transform rotate-1">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                    TARGET LIST
                  </h1>
                </div>
                <p className="text-xl text-center text-gray-700 mb-8">
                  Who should we call?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="relative">
                    {targetListType === 'upload' && (
                      <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                        <div className="relative">
                          <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                            <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                              SELECTED
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <Card 
                      className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
                        targetListType === 'upload' ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                      }`}
                      onClick={() => setTargetListType('upload')}
                    >
                      <CardContent className="p-6 text-center">
                        <UilUpload className="h-8 w-8 mx-auto mb-2" />
                        <h4 className="font-black uppercase mb-1">UPLOAD CSV</h4>
                        <p className="text-sm text-gray-600">Import your contact list</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative">
                    {targetListType === 'existing' && (
                      <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                        <div className="relative">
                          <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                            <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                              SELECTED
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <Card 
                      className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
                        targetListType === 'existing' ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                      }`}
                      onClick={() => setTargetListType('existing')}
                    >
                      <CardContent className="p-6 text-center">
                        <UilUsersAlt className="h-8 w-8 mx-auto mb-2" />
                        <h4 className="font-black uppercase mb-1">EXISTING LEADS</h4>
                        <p className="text-sm text-gray-600">Use Hunter results</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative">
                    {targetListType === 'manual' && (
                      <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                        <div className="relative">
                          <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                            <Star15 color="#FFD700" size={80} className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" stroke="black" strokeWidth={8} />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                              SELECTED
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <Card 
                      className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
                        targetListType === 'manual' ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                      }`}
                      onClick={() => setTargetListType('manual')}
                    >
                      <CardContent className="p-6 text-center">
                        <UilListUl className="h-8 w-8 mx-auto mb-2" />
                        <h4 className="font-black uppercase mb-1">MANUAL ENTRY</h4>
                        <p className="text-sm text-gray-600">Add numbers directly</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {targetListType === 'upload' && (
                  <Card className="bg-orange-50 border-4 border-black">
                    <CardContent className="p-8">
                      <div className="border-4 border-dashed border-black rounded-lg p-8 text-center bg-white">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer">
                          <Button size="icon" variant="header" className="w-16 h-16 mb-4 bg-orange-500 hover:bg-orange-600">
                            <UilUpload className="h-8 w-8 text-white" />
                          </Button>
                          <p className="text-lg font-bold">Click to upload CSV file</p>
                          <p className="text-sm text-gray-600 mt-2">Format: Name, Phone Number, Company (optional)</p>
                        </label>
                      </div>
                      {uploadedFile && (
                        <div className="mt-4 p-4 bg-green-50 border-2 border-black rounded">
                          <p className="font-bold">✓ {uploadedFile.name} uploaded</p>
                          <p className="text-sm text-gray-600">Estimated contacts: {estimatedContacts}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {targetListType === 'existing' && (
                  <Card className="bg-orange-50 border-4 border-black">
                    <CardContent className="p-8 text-center">
                      <UilUsersAlt className="h-16 w-16 mx-auto mb-4 text-orange-600" />
                      <h3 className="text-xl font-black uppercase mb-2">250 LEADS AVAILABLE</h3>
                      <p className="text-gray-700 mb-4">From your recent Hunter search</p>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        USE ALL LEADS
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {targetListType === 'manual' && (
                  <Card className="bg-orange-50 border-4 border-black">
                    <CardContent className="p-8">
                      <label className="text-lg font-black uppercase mb-3 block">
                        PHONE NUMBERS (ONE PER LINE)
                      </label>
                      <Textarea
                        value={manualNumbers}
                        onChange={(e) => setManualNumbers(e.target.value)}
                        placeholder="+1 555-0123&#10;+1 555-0124&#10;+1 555-0125"
                        className="min-h-[200px] text-lg font-semibold border-4 border-black rounded-[3px] resize-none font-mono"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        Enter phone numbers with country code
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-4 mt-8">
                  <Button
                    className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
                    onClick={() => setCurrentStep(3)}
                  >
                    <UilArrowLeft className="mr-2 h-6 w-6" />
                    BACK
                  </Button>
                  <Button
                    className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                    onClick={() => setCurrentStep(6)}
                  >
                    CONTINUE
                    <UilArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </div>

                {/* Info Box */}
                <Card className="bg-yellow-100 border-2 border-black mt-6">
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
                        <p className="text-sm font-bold">TARGET LIST TIPS</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Upload a CSV for bulk imports, use existing leads from Hunter searches, 
                          or manually enter numbers for smaller campaigns. We&apos;ll validate all numbers before calling.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* Info Section for Step 3 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              
              {/* Custom Info Cards */}
              <Card className="transform -rotate-1 relative overflow-hidden bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Button
                      size="icon"
                      variant="default"
                      className="w-12 h-12 flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white border-black"
                    >
                      <UilUsersAlt className="h-6 w-6 text-white" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                        INTELLIGENT LEAD MANAGEMENT
                      </h3>
                      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                        Our system validates and enriches every contact before calling. <span className="font-black text-orange-600">Invalid numbers are automatically filtered</span>, 
                        while valid contacts are enhanced with timezone detection and optimal call time predictions.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Phone number validation</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Timezone detection</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">DNC list checking</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Duplicate removal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Info Section for Step 3 */}
          {currentStep === 4 && (
            <InfoSection customContent={{
              icon: <UilUsersAlt className="h-6 w-6 text-white" />,
              title: "Smart Target Audience Management",
              description: "Upload, import, or select your ideal prospects with intelligent data validation and enrichment. Our system automatically optimizes contact lists for maximum reachability while ensuring compliance with calling regulations.",
              benefits: [
                "Automatic phone number validation and formatting",
                "Real-time timezone detection for optimal call timing",
                "DNC list checking and compliance management",
                "Duplicate detection and contact data enrichment"
              ],
              faqs: [
                {
                  icon: <UilUpload className="h-5 w-5" />,
                  question: "What format should my CSV file be in?",
                  answer: "Upload CSV files with columns for Name, Phone Number, and optionally Company. Our system accepts various formats and automatically standardizes the data for optimal calling. Include country codes for international numbers."
                },
                {
                  icon: <UilUsersAlt className="h-5 w-5" />,
                  question: "How does the system validate phone numbers?",
                  answer: "We verify number format, check for valid area codes, detect mobile vs landline, and cross-reference against Do Not Call lists. Invalid numbers are automatically flagged and excluded from your campaign to maintain compliance."
                },
                {
                  icon: <UilClipboardNotes className="h-5 w-5" />,
                  question: "Can I use leads from Hunter or other sources?",
                  answer: "Absolutely! Import existing leads from Hunter searches, CRM exports, or any lead generation tool. Our system will validate and enhance the data with additional information like timezone and optimal calling times."
                }
              ]
            }} />
          )}

          {/* Step 4: Call Settings */}
          {currentStep === 5 && (
            <Card className="transform -rotate-1 relative overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                    CALL SETTINGS
                  </h1>
                </div>
                <div className="space-y-6">
                  {/* Schedule Settings */}
                  <Card className="bg-orange-50 border-2 border-black">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                        <UilClock className="h-5 w-5" />
                        SCHEDULE
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-bold uppercase">Start Time</label>
                          <Input
                            type="time"
                            value={callSettings.startTime}
                            onChange={(e) => setCallSettings({...callSettings, startTime: e.target.value})}
                            className="h-12 font-semibold border-2 border-black"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold uppercase">End Time</label>
                          <Input
                            type="time"
                            value={callSettings.endTime}
                            onChange={(e) => setCallSettings({...callSettings, endTime: e.target.value})}
                            className="h-12 font-semibold border-2 border-black"
                          />
                        </div>
                      </div>
                      <div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <label className="text-sm font-bold uppercase cursor-help">
                                Timezone
                                <UilInfoCircle className="inline-block h-3 w-3 ml-1 text-gray-600" />
                              </label>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>All call times will be scheduled according to this timezone. Calls automatically adjust for each contact&apos;s local time.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Select
                          value={callSettings.timezone}
                          onValueChange={(value) => setCallSettings({...callSettings, timezone: value})}
                        >
                          <SelectTrigger className="w-full h-12 px-4 text-lg font-semibold border-4 border-black bg-white hover:bg-gray-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-white">
                            {timezones.map(tz => (
                              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Capacity Settings */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <label className="text-lg font-black uppercase block">
                        MAX CALLS PER DAY: {callSettings.maxCallsPerDay}
                      </label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-0 bg-transparent border-none outline-none">
                            <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Maximum number of calls your agents will make in a 24-hour period. Helps manage campaign pacing.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider 
                      value={[callSettings.maxCallsPerDay]}
                      onValueChange={(value) => setCallSettings({...callSettings, maxCallsPerDay: value[0]})}
                      min={1}
                      max={Math.max(20, Math.min(200, estimatedContacts * 5))}
                      step={1}
                      className="mb-2"
                    />
                    <div className="text-sm text-gray-600 space-y-1">
                      {estimatedContacts > 0 && (
                        <>
                          <div>• {estimatedContacts} contacts</div>
                          <div>• {callSettings.maxCallsPerDay} calls/day</div>
                          <div>• 
                            {callSettings.maxCallsPerDay < estimatedContacts ? 'Conservative pace' :
                             callSettings.maxCallsPerDay <= estimatedContacts * 2 ? 'Balanced pace' :
                             'Aggressive pace'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Retry Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-black uppercase block">
                          RETRY ATTEMPTS: {callSettings.retryAttempts}
                        </label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-0 bg-transparent border-none outline-none">
                              <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black cursor-help" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Number of times to retry unanswered calls. Set to 0 to disable retries.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Slider 
                        value={[callSettings.retryAttempts]}
                        onValueChange={(value) => setCallSettings({...callSettings, retryAttempts: value[0]})}
                        min={0}
                        max={5}
                        step={1}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        {callSettings.retryAttempts === 0 ? 'No retries - single attempt only' :
                         callSettings.retryAttempts === 1 ? 'One retry attempt' :
                         `${callSettings.retryAttempts} retry attempts`}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-black uppercase block">
                          DAYS BETWEEN: {callSettings.daysBetweenRetries}
                        </label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-0 bg-transparent border-none outline-none">
                              <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black cursor-help" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Wait time between retry attempts to avoid being too persistent.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Slider 
                        value={[callSettings.daysBetweenRetries]}
                        onValueChange={(value) => setCallSettings({...callSettings, daysBetweenRetries: value[0]})}
                        min={1}
                        max={7}
                        step={1}
                        disabled={callSettings.retryAttempts === 0}
                      />
                      {callSettings.retryAttempts === 0 ? (
                        <p className="text-xs text-gray-500 mt-1">Enable retry attempts to configure retry delay</p>
                      ) : (
                        <p className="text-xs text-gray-600 mt-1">
                          {callSettings.daysBetweenRetries === 1 ? 'Next day retry' :
                           callSettings.daysBetweenRetries === 7 ? 'Weekly retry cycle' :
                           `Wait ${callSettings.daysBetweenRetries} days between attempts`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-orange-50 border-2 border-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UilVoicemail className="h-5 w-5" />
                            <span className="font-black uppercase">Voicemail</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="p-0 bg-transparent border-none outline-none">
                                  <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black cursor-help" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>AI agent will leave a voicemail if the call goes to voicemail. Increases message delivery rate.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch 
                            checked={callSettings.leaveVoicemail}
                            onCheckedChange={(checked) => setCallSettings({...callSettings, leaveVoicemail: checked})}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-2 border-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UilPhone className="h-5 w-5" />
                            <span className="font-black uppercase">Recording</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="p-0 bg-transparent border-none outline-none">
                                  <UilInfoCircle className="h-3 w-3 text-gray-500 hover:text-black cursor-help" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Record all calls for quality assurance and training. Stored securely with compliance standards.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch 
                            checked={callSettings.callRecording}
                            onCheckedChange={(checked) => setCallSettings({...callSettings, callRecording: checked})}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <PremiumFeatureCard 
                    title="SMART SCHEDULING"
                    description="AI optimizes call times based on answer rates. Automatically adjusts schedule for each timezone."
                    price="$49/month"
                  />
                </div>

                <div className="flex gap-4 mt-8">
                  <Button
                    className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
                    onClick={() => setCurrentStep(3)}
                  >
                    <UilArrowLeft className="mr-2 h-6 w-6" />
                    BACK
                  </Button>
                  <Button
                    className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                    onClick={() => setCurrentStep(6)}
                  >
                    CONTINUE
                    <UilArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </div>

                {/* Info Box */}
                <Card className="bg-yellow-100 border-2 border-black mt-6">
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
                        <p className="text-sm font-bold">CALL SETTINGS</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Configure when your agents should call. We respect timezone settings and 
                          automatically skip weekends and holidays. Enable recording for quality assurance.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* Info Section for Step 4 */}
          {currentStep === 5 && (
            <div className="space-y-6">
              
              {/* Custom Info Cards */}
              <Card className="transform rotate-1 relative overflow-hidden bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Button
                      size="icon"
                      variant="default"
                      className="w-12 h-12 flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white border-black"
                    >
                      <UilClock className="h-6 w-6 text-white" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                        SMART SCHEDULING TECHNOLOGY
                      </h3>
                      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                        Our AI analyzes <span className="font-black text-orange-600">millions of call patterns</span> to determine optimal contact times. 
                        Automatic timezone adjustments and holiday detection ensure your calls always happen at the right moment, maximizing connection rates while respecting boundaries.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Answer rate optimization</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Automatic timezone handling</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Holiday detection</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Business hours compliance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Info Section for Step 4 */}
          {currentStep === 5 && (
            <InfoSection customContent={{
              icon: <UilClock className="h-6 w-6 text-white" />,
              title: "Optimize Call Timing & Performance",
              description: "Configure intelligent call scheduling and performance settings that maximize connection rates while respecting boundaries. Our AI-powered timing optimization ensures calls happen when prospects are most likely to answer and engage.",
              benefits: [
                "AI-optimized call timing for 40% higher answer rates",
                "Automatic timezone handling across global contacts",
                "Smart retry logic that respects prospect preferences",
                "Compliance with business hours and holiday detection"
              ],
              faqs: [
                {
                  icon: <UilClock className="h-5 w-5" />,
                  question: "How does AI optimize call timing?",
                  answer: "Our system analyzes millions of successful calls to identify patterns. It considers factors like industry, time zone, historical answer rates, and even weather patterns to determine the optimal time to reach each specific contact."
                },
                {
                  icon: <UilVoicemail className="h-5 w-5" />,
                  question: "Should I enable voicemail messages?",
                  answer: "Yes! Voicemail messages increase callback rates by 23%. Our AI agents leave personalized, professional messages that reference your campaign goals and provide clear next steps for interested prospects to engage."
                },
                {
                  icon: <UilPhone className="h-5 w-5" />,
                  question: "How many retry attempts work best?",
                  answer: "We recommend 2-3 retry attempts with 2-3 days between calls. This balances persistence with respect for prospects' time. Our smart retry system adjusts timing based on previous call outcomes and prospect engagement signals."
                }
              ]
            }} />
          )}

          {/* Step 5: Preview & Launch */}
          {currentStep === 6 && (
            <Card className="transform rotate-1 relative overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                    PREVIEW & LAUNCH
                  </h1>
                </div>
                <div className="space-y-6">
                  {/* Campaign Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-white border-2 border-black transform -rotate-1">
                      <CardContent className="p-4">
                        <h4 className="font-black uppercase mb-2">Campaign</h4>
                        <p className="text-lg font-bold">{campaignName}</p>
                        <Badge className="bg-orange-200 text-black border-2 border-black mt-2">
                          {campaignType.toUpperCase()}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-2 border-black transform rotate-1">
                      <CardContent className="p-4">
                        <h4 className="font-black uppercase mb-2">Agent</h4>
                        <p className="text-lg font-bold">
                          {mockAgents.find(a => a.id === selectedAgent)?.name || 'Selected Agent'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-2 border-black transform -rotate-1">
                      <CardContent className="p-4">
                        <h4 className="font-black uppercase mb-2">Contacts</h4>
                        <p className="text-2xl font-black text-orange-600">
                          {estimatedContacts || 250}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-2 border-black transform rotate-1">
                      <CardContent className="p-4">
                        <h4 className="font-black uppercase mb-2">Schedule</h4>
                        <p className="text-sm font-bold">
                          {callSettings.startTime} - {callSettings.endTime}
                        </p>
                        <p className="text-xs text-gray-600">{callSettings.timezone}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Goals Recap */}
                  <Card className="bg-orange-50 border-2 border-black">
                    <CardContent className="p-4">
                      <h4 className="font-black uppercase mb-2">Goals</h4>
                      <p className="text-gray-700">{campaignGoals}</p>
                    </CardContent>
                  </Card>

                  {/* Launch Button */}
                  <div className="text-center">
                  <Button
                    className="px-12 py-4 h-16 text-xl font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                    onClick={handleLaunchCampaign}
                  >
                    <UilPlay className="mr-2 h-6 w-6" />
                    LAUNCH CAMPAIGN
                  </Button>                    <p className="text-sm text-gray-600 mt-4">
                      You can pause or modify the campaign anytime from the dashboard
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <Card className="bg-yellow-100 border-2 border-black mt-6">
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
                        <p className="text-sm font-bold">LAUNCH READINESS</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Review all settings before launching. Your campaign will start immediately and 
                          begin calling contacts based on your schedule. You can pause or modify settings anytime.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="w-full mt-8 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
                  onClick={() => setCurrentStep(6)}
                >
                  <UilArrowLeft className="mr-2 h-6 w-6" />
                  BACK TO SETTINGS
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Section for Step 5 */}
          {currentStep === 6 && (
            <div className="space-y-6">
              
              {/* Custom Info Cards */}
              <Card className="transform -rotate-1 relative overflow-hidden bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Button
                      size="icon"
                      variant="default"
                      className="w-12 h-12 flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white border-black"
                    >
                      <UilPlay className="h-6 w-6 text-white" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                        LAUNCH WITH CONFIDENCE
                      </h3>
                      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                        Your campaign is ready to achieve <span className="font-black text-orange-600">exceptional results</span>. 
                        Our platform handles thousands of concurrent calls while maintaining conversation quality. Real-time monitoring and adjustment capabilities ensure optimal performance from day one.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Real-time performance tracking</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Instant campaign adjustments</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">Comprehensive call analytics</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span className="text-black font-medium">24/7 monitoring</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Info Section for Step 5 */}
          {currentStep === 6 && (
            <InfoSection customContent={{
              icon: <UilPlay className="h-6 w-6 text-white" />,
              title: "Ready to Launch Your Campaign",
              description: "Your AI-powered calling campaign is fully configured and ready to deliver outstanding results. With intelligent agents, optimized targeting, and smart scheduling, you're set to achieve exceptional conversion rates and meaningful business growth.",
              benefits: [
                "Instant deployment with professional-quality setup",
                "Real-time campaign monitoring and live adjustments",
                "Comprehensive analytics and performance insights",
                "24/7 system monitoring with automatic optimization"
              ],
              faqs: [
                {
                  icon: <UilPlay className="h-5 w-5" />,
                  question: "What happens immediately after I launch?",
                  answer: "Your AI agents begin calling according to your schedule within minutes. You'll see real-time updates in the dashboard showing call progress, connection rates, and conversation outcomes. The system automatically adapts for optimal performance."
                },
                {
                  icon: <UilAnalytics className="h-5 w-5" />,
                  question: "How can I track campaign performance?",
                  answer: "Access comprehensive dashboards with live call monitoring, conversion metrics, call recordings, transcripts, and detailed analytics. Get insights on best-performing scripts, optimal call times, and prospect engagement patterns."
                },
                {
                  icon: <UilClock className="h-5 w-5" />,
                  question: "Can I pause or modify the campaign after launching?",
                  answer: "Yes! You have full control to pause, adjust targeting, modify scripts, change scheduling, or stop the campaign at any time. All changes take effect immediately without losing your progress or data."
                }
              ]
            }} />
          )}

          {/* Step 6: Launch Progress */}
          {currentStep === 6 && (
            <Card className="transform rotate-1 relative overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                    {isLaunching ? 'LAUNCHING CAMPAIGN' : 'CAMPAIGN LAUNCHED'}
                  </h1>
                </div>
                <div className="space-y-6">
                  {isLaunching ? (
                    <>
                      <Progress value={launchProgress} className="h-4" />
                      <p className="text-center text-lg">
                        Setting up your campaign...
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Campaign Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-white border-2 border-black">
                          <CardContent className="p-4 text-center">
                            <UilPhone className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                            <p className="text-sm font-bold uppercase text-gray-600">Total Contacts</p>
                            <p className="text-2xl font-black">{campaignStats?.totalContacts}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-white border-2 border-black">
                          <CardContent className="p-4 text-center">
                            <UilCalendarAlt className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                            <p className="text-sm font-bold uppercase text-gray-600">Est. Duration</p>
                            <p className="text-2xl font-black">{campaignStats?.estimatedDuration}</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-orange-50 border-2 border-black">
                        <CardContent className="p-4">
                          <h4 className="font-black uppercase mb-2">Campaign Details</h4>
                          <p className="text-gray-700">
                            <strong>Name:</strong> {campaignName}<br/>
                            <strong>Type:</strong> {campaignType}<br/>
                            <strong>Agent:</strong> {mockAgents.find(a => a.id === selectedAgent)?.name}<br/>
                            <strong>Status:</strong> <span className="text-green-600 font-bold">Active</span>
                          </p>
                        </CardContent>
                      </Card>

                      <p className="text-xl text-center text-gray-700">
                        Your campaign is now live! Calls will begin according to your schedule.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          className="flex-1 h-14 text-lg font-black uppercase bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => window.location.href = '/dashboard/calls'}
                        >
                          VIEW CAMPAIGN
                          <UilAnalytics className="ml-2 h-6 w-6" />
                        </Button>
                        <Button
                          className="flex-1 h-14 text-lg font-black uppercase bg-[rgb(0,82,255)] hover:bg-blue-600 text-white"
                          onClick={() => window.location.href = '/dashboard'}
                        >
                          GO TO DASHBOARD
                          <UilArrowRight className="ml-2 h-6 w-6" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Info Box */}
                {!isLaunching && (
                  <Card className="bg-yellow-100 border-2 border-black mt-6">
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
                          <p className="text-sm font-bold">CAMPAIGN ACTIVE</p>
                          <p className="text-sm text-gray-700 mt-1">
                            Your AI agents are now making calls. Track progress in real-time from the dashboard. 
                            You&apos;ll receive notifications for important events and completed conversations.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info Section for Step 6 */}
          {currentStep === 6 && !isLaunching && (
            <div className="space-y-6">
              
              {/* Custom Info Cards */}
              <Card className="transform rotate-1 relative overflow-hidden bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Button
                      size="icon"
                      variant="default"
                      className="w-12 h-12 flex-shrink-0 bg-green-600 hover:bg-green-700 text-white border-black"
                    >
                      <UilCheckCircle className="h-6 w-6 text-white" />
                    </Button>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                        CAMPAIGN LIVE & SCALING
                      </h3>
                      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                        Your AI agents are now <span className="font-black text-orange-600">actively making calls</span> and engaging with prospects. 
                        Our system automatically scales to handle response volumes while maintaining quality. Every conversation improves future performance through machine learning.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span className="text-black font-medium">Live call monitoring</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span className="text-black font-medium">Automatic scaling</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span className="text-black font-medium">Real-time optimization</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span className="text-black font-medium">Performance learning</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Info Section for Step 6 */}
          {currentStep === 6 && !isLaunching && (
            <InfoSection customContent={{
              icon: <UilCheckCircle className="h-6 w-6 text-white" />,
              title: "Your Campaign is Now Live",
              description: "Congratulations! Your AI-powered calling campaign is now active and delivering results. Monitor real-time performance, track conversion rates, and watch as your AI agents engage prospects with professional, personalized conversations that drive business growth.",
              benefits: [
                "Live call monitoring with real-time conversation insights",
                "Automatic performance optimization through machine learning",
                "Instant notification of qualified leads and appointments",
                "Continuous improvement with every successful interaction"
              ],
              faqs: [
                {
                  icon: <UilAnalytics className="h-5 w-5" />,
                  question: "Where can I view live campaign performance?",
                  answer: "Access your comprehensive dashboard to see real-time call metrics, live call monitoring, conversation transcripts, lead qualification status, and detailed performance analytics. Get instant notifications for important events and successful conversions."
                },
                {
                  icon: <UilCheckCircle className="h-5 w-5" />,
                  question: "How will I know when prospects are interested?",
                  answer: "The system sends instant notifications for qualified leads, scheduled appointments, and positive responses. You'll receive detailed summaries with prospect information, conversation highlights, and recommended next steps for follow-up."
                },
                {
                  icon: <UilClock className="h-5 w-5" />,
                  question: "What should I expect in the first few hours?",
                  answer: "Initial calls begin immediately based on your schedule. You'll see connection rates, conversation quality metrics, and early performance indicators within the first hour. The AI learns quickly and optimizes approach for better results throughout the day."
                }
              ]
            }} />
          )}
        </div>
      </div>



      {/* Verification Modal */}
      {showVerification && (
        <VerificationModal
          isOpen={showVerification}
          onClose={() => setShowVerification(false)}
          onComplete={handleVerificationComplete}
          devMode={devMode}
        />
      )}
      
      <div className="mt-8">
        <OnboardingFooter />
      </div>
    </div>
    </TooltipProvider>
  );
}