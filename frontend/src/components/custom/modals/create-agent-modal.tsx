import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Slider } from '../../ui/slider';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import PremiumFeatureCard from '../premium-feature-card';
import { cn } from '@/lib/utils';
import {
  UilTimes,
  UilRobot,
  UilMicrophone,
  UilLanguage,
  UilSetting,
  UilCheckCircle,
  UilExclamationTriangle,
  UilPlay,
  UilLock,
  UilDollarSign,
  UilHeadphonesAlt,
  UilCalendarAlt,
  UilDesktop
} from '@tooni/iconscout-unicons-react';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agentData: AgentFormData) => void;
}

export interface AgentFormData {
  // Step 1: Basic Information
  name: string;
  description: string;
  purpose: 'sales' | 'support' | 'appointment' | 'technical' | 'custom';
  customPurpose?: string;
  
  // Step 2: Voice Configuration
  voiceProvider: 'elevenlabs' | 'chatterbox';
  voiceId: string;
  voiceStyle: 'professional' | 'friendly' | 'energetic' | 'calm' | 'custom';
  speechRate: number;
  pitch: number;
  
  // Step 3: Language & Behavior
  language: string;
  responseDelay: number;
  interruptionSensitivity: number;
  silenceThreshold: number;
  maxCallDuration: number;
  
  // Step 4: Advanced Settings
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enableTranscription: boolean;
  enableAnalytics: boolean;
  webhookUrl?: string;
  
  // Step 5: Knowledge Base
  ragWorkflows: string[];
  knowledgeBaseSettings: {
    relevanceThreshold: number;
    maxResults: number;
    focusAreas?: number[];
  };
}

export default function CreateAgentModal({ isOpen, onClose, onSave }: CreateAgentModalProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState<AgentFormData>({
    name: '',
    description: '',
    purpose: 'sales',
    voiceProvider: 'chatterbox',
    voiceId: '',
    voiceStyle: 'professional',
    speechRate: 1.0,
    pitch: 1.0,
    language: 'en-US',
    responseDelay: 300,
    interruptionSensitivity: 0.5,
    silenceThreshold: 2000,
    maxCallDuration: 30,
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 500,
    enableTranscription: true,
    enableAnalytics: true,
    ragWorkflows: [],
    knowledgeBaseSettings: {
      relevanceThreshold: 0.7,
      maxResults: 5,
    },
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof AgentFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const VOICE_OPTIONS = {
    elevenlabs: [
      { id: 'rachel', name: 'Rachel', style: 'Professional Female' },
      { id: 'drew', name: 'Drew', style: 'Professional Male' },
      { id: 'clyde', name: 'Clyde', style: 'Friendly Male' },
      { id: 'paul', name: 'Paul', style: 'Calm Male' },
    ],
    chatterbox: [
      { id: 'nova', name: 'Nova', style: 'Energetic Female' },
      { id: 'alloy', name: 'Alloy', style: 'Professional Neutral' },
      { id: 'echo', name: 'Echo', style: 'Friendly Neutral' },
      { id: 'fable', name: 'Fable', style: 'Calm Female' },
    ]
  };

  const LANGUAGES = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es-ES', label: 'Spanish (Spain)' },
    { value: 'es-MX', label: 'Spanish (Mexico)' },
    { value: 'fr-FR', label: 'French (France)' },
    { value: 'de-DE', label: 'German (Germany)' },
    { value: 'it-IT', label: 'Italian (Italy)' },
    { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  ];

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        description: '',
        purpose: 'sales',
        voiceProvider: 'chatterbox',
        voiceId: '',
        voiceStyle: 'professional',
        speechRate: 1.0,
        pitch: 1.0,
        language: 'en-US',
        responseDelay: 300,
        interruptionSensitivity: 0.5,
        silenceThreshold: 2000,
        maxCallDuration: 30,
        systemPrompt: '',
        temperature: 0.7,
        maxTokens: 500,
        enableTranscription: true,
        enableAnalytics: true,
        ragWorkflows: [],
        knowledgeBaseSettings: {
          relevanceThreshold: 0.7,
          maxResults: 5,
        },
      });
      setErrors({});
    }
  }, [isOpen]);

  const updateFormData = (updates: Partial<AgentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const errorKeys = Object.keys(updates) as Array<keyof AgentFormData>;
    setErrors(prev => {
      const newErrors = { ...prev };
      errorKeys.forEach(key => delete newErrors[key]);
      return newErrors;
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof AgentFormData, string>> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Agent name is required';
        if (formData.name.length > 50) newErrors.name = 'Name must be less than 50 characters';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.purpose === 'custom' && !formData.customPurpose?.trim()) {
          newErrors.customPurpose = 'Custom purpose is required';
        }
        break;
      case 2:
        if (!formData.voiceId) newErrors.voiceId = 'Please select a voice';
        break;
      case 3:
        if (formData.maxCallDuration < 1 || formData.maxCallDuration > 60) {
          newErrors.maxCallDuration = 'Duration must be between 1 and 60 minutes';
        }
        break;
      case 4:
        if (!formData.systemPrompt.trim()) newErrors.systemPrompt = 'System prompt is required';
        if (formData.webhookUrl && !isValidUrl(formData.webhookUrl)) {
          newErrors.webhookUrl = 'Invalid webhook URL';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-2 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-background max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b-4 border-black bg-[rgb(147,51,234)] relative sticky top-0 z-10">
          <CardTitle className="text-2xl font-black uppercase text-white pr-10" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            CREATE VOICE AGENT - STEP {currentStep} OF 5
          </CardTitle>
          <Button
            variant="neutral"
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <UilTimes className="h-5 w-5 text-black" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((step, index) => (
                <React.Fragment key={step}>
                  <div className={`
                    relative px-4 py-2 border-2 border-black flex items-center justify-center font-bold text-sm
                    transition-all duration-300
                    ${currentStep === step 
                      ? 'bg-[rgb(147,51,234)] text-white scale-105 shadow-[3px_3px_0_rgba(0,0,0,1)]' 
                      : currentStep > step 
                        ? 'bg-[rgb(147,51,234)] text-white shadow-[2px_2px_0_rgba(0,0,0,1)]'
                        : 'bg-gray-300 text-gray-600 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                    }
                  `}>
                    {step}
                  </div>
                  {index < 4 && (
                    <div className={`w-8 h-2 mx-2 border-2 border-black transition-all duration-300 ${
                      currentStep > step 
                        ? 'bg-white shadow-[2px_2px_0_rgba(0,0,0,1)]' 
                        : 'bg-gray-400'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Agent Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="E.g., Sales-Pro-3000"
                  className="border-2 border-black rounded-[3px] text-lg"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <UilExclamationTriangle className="h-4 w-4" />
                    {errors.name}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1">Choose a unique name for your voice agent</p>
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Describe what this agent does..."
                  rows={3}
                  className="border-2 border-black rounded-[3px]"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <UilExclamationTriangle className="h-4 w-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-black mb-3" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Agent Purpose
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'sales', label: 'Sales & Discovery', icon: UilDollarSign, color: 'purple' },
                    { value: 'support', label: 'Customer Support', icon: UilHeadphonesAlt, color: 'green' },
                    { value: 'appointment', label: 'Appointment Setting', icon: UilCalendarAlt, color: 'orange' },
                    { value: 'technical', label: 'Technical Support', icon: UilDesktop, color: 'pink' },
                    { value: 'custom', label: 'Custom Purpose', icon: UilSetting, color: 'gray' }
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <Card 
                        key={option.value}
                        onClick={() => updateFormData({ purpose: option.value as any })}
                        className={cn(
                          "cursor-pointer border-2 border-black transition-all bg-white",
                          formData.purpose === option.value 
                            ? `bg-${option.color}-100 shadow-[4px_4px_0_rgba(0,0,0,1)]` 
                            : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Icon className={cn(
                              "h-6 w-6",
                              formData.purpose === option.value ? `text-${option.color}-600` : 'text-gray-600'
                            )} />
                            <div className="flex-1">
                              <p className="font-bold text-sm">{option.label}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {formData.purpose === 'custom' && (
                <div>
                  <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                    Custom Purpose
                  </label>
                  <Input
                    value={formData.customPurpose || ''}
                    onChange={(e) => updateFormData({ customPurpose: e.target.value })}
                    placeholder="E.g., Product Demo Specialist"
                    className="border-2 border-black rounded-[3px]"
                  />
                  {errors.customPurpose && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <UilExclamationTriangle className="h-4 w-4" />
                      {errors.customPurpose}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="header"
                  onClick={handleNext}
                  disabled={!formData.name || !formData.description}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Voice Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-3" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Voice Provider
                </label>
                <div className="space-y-3">
                  {/* Chatterbox Option */}
                  <Card 
                    onClick={() => updateFormData({ voiceProvider: 'chatterbox', voiceId: '' })}
                    className={cn(
                      "cursor-pointer border-2 border-black transition-all bg-white",
                      formData.voiceProvider === 'chatterbox' 
                        ? "bg-green-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                        : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-lg">Chatterbox</span>
                            <Badge className="bg-green-600 text-white border-2 border-black">OPEN SOURCE</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Free open-source voices</p>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 border-black",
                          formData.voiceProvider === 'chatterbox' && "bg-green-600"
                        )} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* ElevenLabs Option */}
                  <Card 
                    onClick={() => updateFormData({ voiceProvider: 'elevenlabs', voiceId: '' })}
                    className={cn(
                      "cursor-pointer border-2 border-black transition-all relative overflow-hidden bg-white",
                      formData.voiceProvider === 'elevenlabs' 
                        ? "bg-purple-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                        : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-lg">ElevenLabs</span>
                            <Badge className="bg-purple-600 text-white border-2 border-black">PREMIUM</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">High-quality commercial voices</p>
                        </div>
                        <UilLock className="h-6 w-6 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-black mb-3" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Select Voice
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {VOICE_OPTIONS[formData.voiceProvider].map((voice) => (
                    <Card
                      key={voice.id}
                      onClick={() => updateFormData({ voiceId: voice.id })}
                      className={cn(
                        "cursor-pointer border-2 border-black transition-all bg-white",
                        formData.voiceId === voice.id 
                          ? "bg-purple-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                          : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{voice.name}</p>
                            <p className="text-sm text-gray-600">{voice.style}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="neutral"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Preview logic here
                            }}
                          >
                            <UilPlay className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {errors.voiceId && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <UilExclamationTriangle className="h-4 w-4" />
                    {errors.voiceId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-black mb-3" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Voice Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'professional', label: 'Professional' },
                    { value: 'friendly', label: 'Friendly' },
                    { value: 'energetic', label: 'Energetic' },
                    { value: 'calm', label: 'Calm' }
                  ].map((style) => (
                    <Card
                      key={style.value}
                      onClick={() => updateFormData({ voiceStyle: style.value as any })}
                      className={cn(
                        "cursor-pointer border-2 border-black transition-all bg-white",
                        formData.voiceStyle === style.value 
                          ? "bg-purple-100 shadow-[4px_4px_0_rgba(0,0,0,1)]" 
                          : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                      )}
                    >
                      <CardContent className="p-4">
                        <p className="font-bold text-center">{style.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Custom Voice Option */}
              <div className="mt-4">
                <PremiumFeatureCard
                  title="CUSTOM VOICE CLONING"
                  description="Clone your own voice or upload custom voice samples for a truly personalized agent experience"
                  price="$99/month"
                  badge="VOICE CLONING"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-black uppercase">Speech Rate</label>
                  <span className="text-sm font-bold">{formData.speechRate.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[formData.speechRate]}
                  onValueChange={([value]) => updateFormData({ speechRate: value })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Slower</span>
                  <span>Normal</span>
                  <span>Faster</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-black uppercase">Pitch</label>
                  <span className="text-sm font-bold">{formData.pitch.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[formData.pitch]}
                  onValueChange={([value]) => updateFormData({ pitch: value })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Lower</span>
                  <span>Normal</span>
                  <span>Higher</span>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
                  onClick={handleBack}
                >
                  ← Back
                </Button>
                <Button
                  variant="header"
                  onClick={handleNext}
                  disabled={!formData.voiceId}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Language & Behavior */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => updateFormData({ language: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black rounded-[3px] bg-white font-bold"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-black uppercase">Response Delay</label>
                  <span className="text-sm font-bold">{formData.responseDelay}ms</span>
                </div>
                <Slider
                  value={[formData.responseDelay]}
                  onValueChange={([value]) => updateFormData({ responseDelay: value })}
                  min={0}
                  max={2000}
                  step={100}
                />
                <p className="text-xs text-gray-600 mt-1">Time before agent starts speaking</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-black uppercase">Interruption Sensitivity</label>
                  <span className="text-sm font-bold">{(formData.interruptionSensitivity * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[formData.interruptionSensitivity]}
                  onValueChange={([value]) => updateFormData({ interruptionSensitivity: value })}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <p className="text-xs text-gray-600 mt-1">How easily the agent can be interrupted</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-black uppercase">Silence Threshold</label>
                  <span className="text-sm font-bold">{formData.silenceThreshold}ms</span>
                </div>
                <Slider
                  value={[formData.silenceThreshold]}
                  onValueChange={([value]) => updateFormData({ silenceThreshold: value })}
                  min={500}
                  max={5000}
                  step={500}
                />
                <p className="text-xs text-gray-600 mt-1">Wait time before considering silence</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-black uppercase">Max Call Duration</label>
                  <span className="text-sm font-bold">{formData.maxCallDuration} min</span>
                </div>
                <Slider
                  value={[formData.maxCallDuration]}
                  onValueChange={([value]) => updateFormData({ maxCallDuration: value })}
                  min={1}
                  max={60}
                  step={1}
                />
                {errors.maxCallDuration && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <UilExclamationTriangle className="h-4 w-4" />
                    {errors.maxCallDuration}
                  </p>
                )}
              </div>

              <Card className="bg-yellow-50 border-4 border-yellow-400">
                <CardContent className="p-4">
                  <p className="font-black text-sm uppercase mb-1">Behavior Tips</p>
                  <p className="text-sm text-gray-700">
                    Lower interruption sensitivity for more natural conversations.
                    Adjust silence threshold based on expected response times.
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
                  onClick={handleBack}
                >
                  ← Back
                </Button>
                <Button
                  variant="header"
                  onClick={handleNext}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Advanced Settings */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  System Prompt
                </label>
                <Textarea
                  value={formData.systemPrompt}
                  onChange={(e) => updateFormData({ systemPrompt: e.target.value })}
                  placeholder="Define your agent's personality, knowledge, and behavior..."
                  rows={5}
                  className={cn("border-2 border-black rounded-[3px] font-mono text-sm", errors.systemPrompt && "border-red-500")}
                />
                {errors.systemPrompt && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <UilExclamationTriangle className="h-4 w-4" />
                    {errors.systemPrompt}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-black uppercase">Temperature</label>
                    <span className="text-sm font-bold">{formData.temperature.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[formData.temperature]}
                    onValueChange={([value]) => updateFormData({ temperature: value })}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <p className="text-xs text-gray-600 mt-1">Response creativity</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-black uppercase">Max Tokens</label>
                    <span className="text-sm font-bold">{formData.maxTokens}</span>
                  </div>
                  <Slider
                    value={[formData.maxTokens]}
                    onValueChange={([value]) => updateFormData({ maxTokens: value })}
                    min={50}
                    max={2000}
                    step={50}
                  />
                  <p className="text-xs text-gray-600 mt-1">Response length limit</p>
                </div>
              </div>

              <div className="space-y-3">
                <Card className="border-2 border-black bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">Enable Transcription</p>
                        <p className="text-sm text-gray-600">Save call transcripts</p>
                      </div>
                      <Switch
                        checked={formData.enableTranscription}
                        onCheckedChange={(checked) => updateFormData({ enableTranscription: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-black bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">Enable Analytics</p>
                        <p className="text-sm text-gray-600">Track performance metrics</p>
                      </div>
                      <Switch
                        checked={formData.enableAnalytics}
                        onCheckedChange={(checked) => updateFormData({ enableAnalytics: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-black mb-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                  Webhook URL (Optional)
                </label>
                <Input
                  type="url"
                  value={formData.webhookUrl || ''}
                  onChange={(e) => updateFormData({ webhookUrl: e.target.value })}
                  placeholder="https://your-server.com/webhook"
                  className={cn("border-2 border-black rounded-[3px]", errors.webhookUrl && "border-red-500")}
                />
                {errors.webhookUrl && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <UilExclamationTriangle className="h-4 w-4" />
                    {errors.webhookUrl}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1">Receive real-time call events</p>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
                  onClick={handleBack}
                >
                  ← Back
                </Button>
                <Button
                  variant="header"
                  onClick={handleNext}
                  disabled={!formData.systemPrompt}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Knowledge Base */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black uppercase text-black mb-2">SELECT KNOWLEDGE BASE</h3>
                <p className="text-sm text-gray-600 mb-4">Choose RAG workflows to enhance your agent's knowledge and capabilities</p>
              </div>

              {/* Available RAG Workflows */}
              <div className="space-y-3">
                {[
                  {
                    id: 'sales-objection-master',
                    name: 'Sales Objection Master',
                    description: 'Comprehensive sales objection handling with 9 focus areas including price, competition, and timing',
                    stats: { embeddings: 2847, sources: 'YouTube + Documents', focusAreas: 9 },
                    recommended: formData.purpose === 'sales',
                    icon: UilDollarSign,
                    color: 'purple'
                  },
                  {
                    id: 'customer-support-kb',
                    name: 'Customer Support Knowledge',
                    description: 'Product documentation, FAQs, and common troubleshooting procedures',
                    stats: { embeddings: 1523, sources: 'Documents + URLs', focusAreas: 6 },
                    recommended: formData.purpose === 'support',
                    icon: UilHeadphonesAlt,
                    color: 'green'
                  },
                  {
                    id: 'appointment-scripts',
                    name: 'Appointment Setting Playbook',
                    description: 'Proven scripts and techniques for booking meetings and managing calendars',
                    stats: { embeddings: 892, sources: 'Documents', focusAreas: 4 },
                    recommended: formData.purpose === 'appointment',
                    icon: UilCalendarAlt,
                    color: 'orange'
                  },
                  {
                    id: 'technical-docs',
                    name: 'Technical Documentation Hub',
                    description: 'API docs, integration guides, and technical specifications',
                    stats: { embeddings: 3156, sources: 'Documents + URLs', focusAreas: 8 },
                    recommended: formData.purpose === 'technical',
                    icon: UilDesktop,
                    color: 'pink'
                  },
                  {
                    id: 'product-catalog',
                    name: 'Product Catalog & Pricing',
                    description: 'Complete product information, pricing tiers, and feature comparisons',
                    stats: { embeddings: 1098, sources: 'Mixed', focusAreas: 5 },
                    recommended: true,
                    icon: UilSetting,
                    color: 'blue'
                  }
                ].map((workflow) => {
                  const Icon = workflow.icon;
                  const isSelected = formData.ragWorkflows.includes(workflow.id);
                  return (
                    <Card
                      key={workflow.id}
                      onClick={() => {
                        if (isSelected) {
                          updateFormData({ 
                            ragWorkflows: formData.ragWorkflows.filter(id => id !== workflow.id) 
                          });
                        } else {
                          updateFormData({ 
                            ragWorkflows: [...formData.ragWorkflows, workflow.id] 
                          });
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-2 border-black transition-all bg-white",
                        isSelected
                          ? `bg-${workflow.color}-100 shadow-[4px_4px_0_rgba(0,0,0,1)]`
                          : "hover:shadow-[2px_2px_0_rgba(0,0,0,1)]"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 border-2 border-black flex items-center justify-center flex-shrink-0",
                            isSelected ? `bg-${workflow.color}-200` : "bg-gray-100"
                          )}>
                            <Icon className={cn(
                              "h-6 w-6",
                              isSelected ? `text-${workflow.color}-600` : "text-gray-600"
                            )} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-black">{workflow.name}</h4>
                              {workflow.recommended && (
                                <Badge className="bg-green-400 text-black border-2 border-black text-xs font-bold">
                                  RECOMMENDED
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="font-bold">{workflow.stats.embeddings.toLocaleString()} embeddings</span>
                              <span className="text-gray-600">•</span>
                              <span className="font-bold">{workflow.stats.sources}</span>
                              <span className="text-gray-600">•</span>
                              <span className="font-bold">{workflow.stats.focusAreas} focus areas</span>
                            </div>
                          </div>
                          <div className={cn(
                            "w-6 h-6 border-2 border-black flex items-center justify-center",
                            isSelected ? `bg-${workflow.color}-600` : "bg-white"
                          )}>
                            {isSelected && <UilCheckCircle className="h-4 w-4 text-white" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Knowledge Base Settings */}
              <Card className="border-2 border-black bg-white">
                <CardContent className="p-4">
                  <h4 className="font-black uppercase text-sm mb-4">KNOWLEDGE BASE SETTINGS</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-black uppercase">Relevance Threshold</label>
                        <span className="text-sm font-bold">{(formData.knowledgeBaseSettings.relevanceThreshold * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[formData.knowledgeBaseSettings.relevanceThreshold]}
                        onValueChange={([value]) => updateFormData({ 
                          knowledgeBaseSettings: { ...formData.knowledgeBaseSettings, relevanceThreshold: value }
                        })}
                        min={0.5}
                        max={1}
                        step={0.05}
                      />
                      <p className="text-xs text-gray-600 mt-1">Minimum relevance score for retrieved content</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-black uppercase">Max Results</label>
                        <span className="text-sm font-bold">{formData.knowledgeBaseSettings.maxResults}</span>
                      </div>
                      <Slider
                        value={[formData.knowledgeBaseSettings.maxResults]}
                        onValueChange={([value]) => updateFormData({ 
                          knowledgeBaseSettings: { ...formData.knowledgeBaseSettings, maxResults: value }
                        })}
                        min={1}
                        max={20}
                        step={1}
                      />
                      <p className="text-xs text-gray-600 mt-1">Maximum number of relevant results to retrieve</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="neutral"
                  onClick={handleBack}
                >
                  ← Back
                </Button>
                <Button
                  variant="header"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UilRobot className="h-5 w-5 mr-2" />
                      CREATE AGENT
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}