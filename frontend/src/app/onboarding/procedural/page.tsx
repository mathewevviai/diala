'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// The OnboardingFooter is no longer needed.
// import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { UilMicrophone, UilMusic, UilInfoCircle, UilArrowRight, UilArrowLeft, UilPlay, UilCheck, UilDownloadAlt, UilSpinner } from '@tooni/iconscout-unicons-react';
import { Star15 } from '@/components/ui/star';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import VerificationModal from '@/components/custom/modals/verification-modal';
import { AudioGenerationProgress } from '@/components/onboarding/procedural/AudioGenerationProgress';

interface AudioConfig {
  prompt: string;
  duration: number;
  intensity: number;
  name: string;
}

interface AudioJob {
  _id: Id<"proceduralAudioJobs">;
  jobId: string;
  userId: string;
  config: AudioConfig;
  status: "pending" | "processing" | "completed" | "failed";
  audioUrl?: string;
  audioId?: string;
  fileName?: string;
  fileSize?: number;
  metadata?: {
    size: string;
    duration: string;
    quality: string;
    format: string;
  };
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  processingTime?: number;
}

interface GeneratedAudio {
  id: string;
  url: string;
  config: AudioConfig;
  metadata: {
    size: string;
    duration: string;
    quality: string;
  };
}

export default function ProceduralAudioGenerator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    prompt: "a quiet coffee shop with gentle background chatter and the soft clinking of ceramic cups and saucers",
    duration: 30,
    intensity: 0.7,
    name: 'Coffee Shop Ambiance'
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [modalProgress, setModalProgress] = useState(0);
  const [modalStatus, setModalStatus] = useState<'generating' | 'verifying' | 'completed' | 'error'>('generating');

  // Convex hooks
  const createJob = useMutation(api.proceduralAudio.createJob);
  const getJob = useQuery(api.proceduralAudio.getJob, jobId ? { jobId } : "skip");
  const userId = "current-user"; // Replace with actual user ID from auth

  // Auto-select coffee shop preset for dev mode
  useEffect(() => {
    if (devMode) {
      setAudioConfig({
        prompt: "a cozy coffee shop with gentle background chatter, soft jazz music, and the occasional clinking of ceramic coffee cups and saucers",
        duration: 30,
        intensity: 0.8,
        name: 'Dev Coffee Shop'
      });
      setSelectedPreset('cozy-cafe');
    }
  }, [devMode]);

  // Coffee shop presets
  const coffeeShopPresets = [
    {
      id: 'cozy-cafe',
      name: 'Cozy Café',
      config: {
        prompt: "a cozy coffee shop with gentle background chatter, soft jazz music, and the occasional clinking of coffee cups",
        duration: 30,
        intensity: 0.6,
        name: 'Cozy Café'
      }
    },
    {
      id: 'busy-coffee',
      name: 'Busy Coffee Shop',
      config: {
        prompt: "a bustling coffee shop with energetic conversations, espresso machine sounds, and constant cup clinking",
        duration: 30,
        intensity: 0.9,
        name: 'Busy Coffee Shop'
      }
    },
    {
      id: 'quiet-morning',
      name: 'Quiet Morning Coffee',
      config: {
        prompt: "a peaceful morning coffee shop with soft instrumental music and gentle cup stirring sounds",
        duration: 30,
        intensity: 0.4,
        name: 'Quiet Morning Coffee'
      }
    },
    {
      id: 'cups-clinking',
      name: 'Cups Clinking Focus',
      config: {
        prompt: "coffee shop ambiance focused on the rhythmic clinking of ceramic cups and saucers with soft background chatter",
        duration: 30,
        intensity: 0.8,
        name: 'Cups Clinking Focus'
      }
    }
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return audioConfig.name.trim() !== '';
      case 2:
        // The primary action button is now 'Create', not 'Continue'
        return selectedPreset !== null;
      case 3:
        return getJob?.status === 'completed' || getJob?.status === 'failed';
      case 4:
        return generatedAudio !== null;
      default:
        return true;
    }
  };

  // Update generated audio when job completes
  useEffect(() => {
    if (getJob && getJob.status === 'completed' && getJob.audioUrl) {
      setGeneratedAudio({
        id: getJob.jobId,
        url: getJob.audioUrl,
        config: getJob.config,
        metadata: {
          size: getJob.metadata?.size || 'Unknown',
          duration: `${getJob.config.duration}s`,
          quality: getJob.metadata?.quality || '44.1kHz/16-bit'
        }
      });
      
      setModalStatus('completed');
      setModalProgress(100);
      
    } else if (getJob && getJob.status === 'failed') {
      setError(getJob.error || 'Failed to generate audio');
      setModalStatus('error');
    }
  }, [getJob]);

  // Simulate progress during generation
  useEffect(() => {
    if (jobId && getJob?.status === 'processing') {
      const progressInterval = setInterval(() => {
        setModalProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          return newProgress;
        });
      }, 500);
      
      return () => clearInterval(progressInterval);
    }
  }, [jobId, getJob?.status]);

  const handleGenerateAudio = async () => {
    if (!canProceed()) return;
    setError(null);
    // Gate generation behind verification modal
    setShowGenerationModal(true);
    setModalStatus('generating');
    setModalProgress(0);
  };

  const handleGenerationComplete = () => {
    setShowGenerationModal(false);
    setCurrentStep(3);
  };

  const handleModalVerify = () => {
    setModalStatus('verifying');
    setTimeout(() => {
      setModalStatus('completed');
      setTimeout(() => {
        setShowGenerationModal(false);
        setCurrentStep(3);
      }, 1500);
    }, 1000);
  };

  const handleModalClose = () => {
    // If user closes without verifying, stay on Generate (step 2)
    setShowGenerationModal(false);
    setCurrentStep(2);
  };

  const handleModalDownload = () => {
    handleDownload();
  };

  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleDownload = () => {
    if (generatedAudio?.url) {
      const link = document.createElement('a');
      link.href = generatedAudio.url;
      link.download = `${audioConfig.name.replace(/\s+/g, '-')}.wav`;
      link.click();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="transform -rotate-1">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                  COFFEE SHOP AUDIO
                </h1>
                <p className="text-lg text-gray-700 mt-2">
                  Create ambient coffee shop sounds with cups clinking
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xl font-black uppercase mb-3 block">
                    Scene Name
                  </label>
                  <Input
                    value={audioConfig.name}
                    onChange={(e) => setAudioConfig({...audioConfig, name: e.target.value})}
                    placeholder="e.g., Morning Coffee Shop, Cozy Café"
                    className="h-16 text-lg font-semibold border-4 border-black rounded-[3px]"
                  />
                </div>

                <div>
                  <label className="text-xl font-black uppercase mb-3 block">
                    Coffee Shop Description
                  </label>
                  <textarea
                    value={audioConfig.prompt}
                    onChange={(e) => setAudioConfig({...audioConfig, prompt: e.target.value})}
                    placeholder="Describe the coffee shop scene..."
                    className="w-full h-24 text-lg font-semibold border-4 border-black rounded-[3px] p-3"
                  />
                </div>

                <div>
                  <label className="text-xl font-black uppercase mb-3 block">
                    Intensity: {(audioConfig.intensity * 100).toFixed(0)}%
                  </label>
                  <Slider
                    value={[audioConfig.intensity]}
                    onValueChange={(value) => setAudioConfig({...audioConfig, intensity: value[0]})}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className="mb-2"
                  />
                  <p className="text-sm text-gray-600">10% - 100% ambiance intensity</p>
                </div>

                <Card className="bg-yellow-100 border-2 border-black">
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
                        <p className="text-sm font-bold">COFFEE SHOP TIP</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Higher intensity adds more cup clinking and background chatter. Lower intensity creates a more peaceful atmosphere.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4 mt-8">
                  <Button
                    className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                    onClick={handleContinue}
                    disabled={!canProceed()}
                  >
                    CONTINUE
                    <UilArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="transform rotate-1">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                  GENERATE AUDIO
                </h1>
                <p className="text-lg text-gray-700 mt-2">
                  Choose a preset or create your custom coffee shop ambiance
                </p>
              </div>

              {error && (
                <Card className="bg-red-100 border-2 border-red-500 mb-6">
                  <CardContent className="p-4">
                    <p className="text-red-700 font-bold">Error: {error}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {coffeeShopPresets.map((preset) => (
                  <div key={preset.id} className="relative">
                    {selectedPreset === preset.id && (
                      <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 z-20" 
                           style={{animation: 'overshoot 0.3s ease-out'}}>
                        <div className="relative">
                          <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                            <Star15 color="#FFD700" size={80} 
                                    className="w-20 h-20 sm:w-24 sm:h-24" 
                                    stroke="black" strokeWidth={8} />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-black font-black text-[10px] uppercase tracking-wider transform rotate-12"
                                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                              SELECTED
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <Card 
                      className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
                        selectedPreset === preset.id ? 'bg-purple-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                      }`}
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setAudioConfig(preset.config);
                      }}
                    >
                      <CardContent className="p-6">
                        <h4 className="font-black uppercase text-xl mb-2">{preset.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {preset.config.duration}s • {Math.round(preset.config.intensity * 100)}% intensity
                        </p>
                        <p className="text-sm text-gray-700">{preset.config.prompt.substring(0, 80)}...</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Fixed: Both buttons now have the same variant and styling */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button
                  variant="default"
                  className="w-1/2 h-14 text-lg font-black uppercase bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={() => setCurrentStep(1)}
                >
                  <UilArrowLeft className="mr-2 h-6 w-6" />
                  BACK
                </Button>
                <Button
                  variant="default"
                  className="w-1/2 h-14 text-lg font-black uppercase bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={handleGenerateAudio}
                  disabled={getJob?.status === 'processing' || getJob?.status === 'pending' || !canProceed()}
                >
                  {getJob?.status === 'processing' ? (
                    <>
                      <UilSpinner className="mr-2 h-5 w-5 animate-spin" />
                      BREWING...
                    </>
                  ) : getJob?.status === 'pending' ? (
                    <>
                      <UilSpinner className="mr-2 h-5 w-5 animate-spin" />
                      QUEUED...
                    </>
                  ) : (
                    <>
                      <UilMicrophone className="mr-2 h-5 w-5" />
                      CREATE COFFEE SHOP AUDIO
                    </>
                  )}
                </Button>
              </div>

              {getJob?.status === 'processing' && (
                <div className="mt-6">
                  <Progress value={getJob.progress || 50} className="h-4" />
                  <p className="text-center text-lg mt-2">
                    {getJob.currentStage || 'Creating your coffee shop ambiance...'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        if (getJob?.status === 'processing' || getJob?.status === 'pending') {
          return (
            <AudioGenerationProgress
              progress={modalProgress}
              status={getJob?.currentStage || 'Creating your coffee shop ambiance...'}
              audioName={audioConfig.name}
            />
          );
        }
        
        return (
          <Card className="transform -rotate-1">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
                  ENJOY
                </h1>
                <p className="text-lg text-gray-700 mt-2">
                  Your coffee shop ambiance is ready
                </p>
              </div>

              {generatedAudio && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-purple-500 border-4 border-black mx-auto mb-4 flex items-center justify-center">
                      <UilCheck className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-black uppercase">Audio Generated Successfully!</h3>
                  </div>

                  <Card className="bg-purple-50 border-2 border-black">
                    <CardContent className="p-6">
                      <h4 className="text-xl font-black uppercase mb-4">Your Coffee Shop Audio</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-bold">Name:</span>
                          <span>{generatedAudio.config.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">Type:</span>
                          <span>Coffee Shop Ambiance</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">Duration:</span>
                          <span>{generatedAudio.config.duration} seconds</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">File Size:</span>
                          <span>{generatedAudio.metadata.size}</span>
                        </div>
                      </div>

                      {generatedAudio.url && (
                        <div className="mt-4">
                          <audio controls className="w-full">
                            <source src={generatedAudio.url} type="audio/wav" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* FIX: Replaced 'Use in Project' with 'Create Another' for clear navigation */}
                  <div className="flex gap-4">
                    <Button
                      variant="neutral"
                      className="flex-1 h-14 text-lg font-black uppercase bg-white hover:bg-gray-100 text-black border-4 border-black"
                      onClick={() => setCurrentStep(1)}
                    >
                      <UilArrowLeft className="mr-2 h-5 w-5" />
                      Create Another
                    </Button>
                    <Button
                      className="flex-1 h-14 text-lg font-black uppercase bg-purple-500 hover:bg-purple-600 text-white"
                      onClick={handleDownload}
                      disabled={!generatedAudio.url}
                    >
                      <UilDownloadAlt className="mr-2 h-5 w-5" />
                      Download Audio
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div
        className="min-h-screen bg-purple-500 relative pb-8"
        style={{
          fontFamily: 'Noyh-Bold, sans-serif',
          backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      >
        {/* Dev Mode Toggle */}
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
                {/* Decorative elements */}
                <div className="absolute top-2 left-4 w-8 h-8 bg-purple-600 border-2 border-black flex items-center justify-center">
                  <UilMicrophone className="h-4 w-4 text-white" />
                </div>
                <div className="absolute top-2 right-4 w-8 h-8 bg-purple-500 border-2 border-black flex items-center justify-center">
                  <UilMusic className="h-4 w-4 text-white" />
                </div>
                <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
                  <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
                </div>
                <div className="absolute bottom-2 right-8 w-4 h-4 bg-red-500 border-2 border-black -rotate-12"></div>
                
                {/* Central icon */}
                <div className="flex justify-center mb-4">
                  <Button className="w-20 h-20 bg-purple-600 hover:bg-purple-700 border-4 border-black p-0">
                    {currentStep === 1 && <UilMusic className="h-12 w-12 text-white" />}
                    {currentStep === 2 && <UilMicrophone className="h-12 w-12 text-white" />}
                    {currentStep === 3 && <UilCheck className="h-12 w-12 text-white" />}
                  </Button>
                </div>
                
                {/* Dynamic title */}
                <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                  {currentStep === 1 && 'DESIGN'}
                  {currentStep === 2 && 'GENERATE'}
                  {currentStep === 3 && 'COMPLETE'}
                </CardTitle>
                
                {/* Subtitle */}
                <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
                  {currentStep === 1 && 'Create your coffee shop ambiance'}
                  {currentStep === 2 && 'Generate your audio'}
                  {currentStep === 3 && 'Your audio is ready'}
                </p>
                
                {/* Animated decorative bars */}
                <div className="flex justify-center items-center mt-3 gap-2">
                  <div className="w-3 h-3 bg-purple-600 animate-pulse"></div>
                  <div className="w-2 h-6 bg-black"></div>
                  <div className="w-4 h-4 bg-purple-500 animate-pulse delay-150"></div>
                  <div className="w-2 h-8 bg-black"></div>
                  <div className="w-3 h-3 bg-purple-600 animate-pulse delay-300"></div>
                </div>
              </CardHeader>
            </Card>

            {/* Step Content */}
            {renderStepContent()}

            {/* FIX: OnboardingFooter component has been removed entirely. */}
            
            {/* Verification Modal */}
            <VerificationModal
              isOpen={showGenerationModal}
              onClose={handleModalClose}
              onComplete={async (_email, _phone) => {
                // Start job after verification completes
                try {
                  const newJobId = await createJob({
                    config: audioConfig,
                    userId
                  });
                  setJobId(newJobId);
                  setShowGenerationModal(false);
                  setCurrentStep(3);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to create job');
                  setShowGenerationModal(false);
                }
              }}
              devMode={devMode}
            />

          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}