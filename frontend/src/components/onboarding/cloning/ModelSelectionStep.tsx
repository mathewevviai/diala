import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Bot, Heart, MessageSquare, Mic, Image as ImageIcon, Fish, Cloud, Sparkles, Cpu } from 'lucide-react';
import { ModelData } from './types';
import PremiumFeatureCard from '@/components/custom/premium-feature-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star15 } from '@/components/ui/star';
import { useVoiceModels } from '@/hooks/useVoiceModels';

interface ModelSelectionStepProps {
  selectedModel: ModelData | null;
  setSelectedModel: (model: ModelData | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const FALLBACK_MODELS: Array<{ id: string; label: string; icon: any; color: string; tooltip: string }> = [
  { id: 'dia', label: 'dia', icon: Bot, color: 'bg-pink-500', tooltip: 'Ultra-realistic dialogue with multi-speaker support and cloning' },
  { id: 'orpheus', label: 'orpheus', icon: Heart, color: 'bg-red-500', tooltip: 'Human-like speech with zero-shot cloning and emotion control' },
  { id: 'chatterbox', label: 'chatterbox', icon: Mic, color: 'bg-cyan-500', tooltip: 'Open-source TTS with voice cloning' },
  { id: 'sesame-csm', label: 'sesame-csm', icon: Cpu, color: 'bg-green-500', tooltip: 'Sesame CSM 1B - Conversational Speech Model with lifelike AI voice generation and cloning, runs locally' },
  { id: 'elevenlabs', label: 'elevenlabs', icon: Cloud, color: 'bg-purple-500', tooltip: 'Premium cloud-based TTS with natural voice cloning' },
  { id: 'kokoro', label: 'kokoro', icon: Sparkles, color: 'bg-yellow-500', tooltip: 'Emotional TTS model with expressive voice synthesis' },
];


export default function ModelSelectionStep({
  selectedModel,
  setSelectedModel,
  currentStep,
  setCurrentStep,
}: ModelSelectionStepProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const { models: apiModels, isLoading, error } = useVoiceModels();

  // Debug logging to see what's happening with the API
  React.useEffect(() => {
    console.log('[ModelSelection Debug] API State:', {
      apiModels,
      apiModelsLength: apiModels.length,
      isLoading,
      error,
      environment: process.env.NODE_ENV,
      apiUrl: process.env.NEXT_PUBLIC_API_URL
    });
  }, [apiModels, isLoading, error]);



  const modelsData: ModelData[] = useMemo(() => {
    const src = apiModels.length > 0
      ? apiModels.map(m => ({
          id: m.id,
          label: m.label,
          Icon: (FALLBACK_MODELS.find(f => f.id === m.id)?.icon) || Bot,
          color: (FALLBACK_MODELS.find(f => f.id === m.id)?.color) || 'bg-pink-500',
          tooltip: m.description || (FALLBACK_MODELS.find(f => f.id === m.id)?.tooltip) || '',
          imageSrc: null,
          voices: []
        }))
      : FALLBACK_MODELS.map(f => ({ id: f.id, label: f.label, Icon: f.icon, color: f.color, tooltip: f.tooltip, imageSrc: null, voices: [] }));
    return src;
  }, [apiModels]);

  const handleModelSelect = (model: ModelData) => {
    setSelectedModel(model);
    setHoveredButton(null);
  };

  const handleNext = () => {
    if (selectedModel) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="w-full">
      <Card className="w-full p-6 sm:p-8">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {modelsData.map((model) => (
              <div key={model.id} className="relative flex justify-center">
                {selectedModel?.id === model.id && (
                  <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" 
                       style={{animation: 'overshoot 0.3s ease-out'}}>
                    <div className="relative">
                      <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                        <Star15 color="#FFD700" size={80} 
                                className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" 
                                stroke="black" strokeWidth={8} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" 
                              style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                          SELECTED
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <button 
                  className={`w-full bg-background text-foreground font-bold py-6 px-4 border-4 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all duration-150 text-center ${
                    selectedModel?.id === model.id 
                      ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' 
                      : ''
                  }`}
                  onClick={() => handleModelSelect(model)} 
                  onMouseEnter={() => setHoveredButton(model.label)} 
                  onMouseLeave={() => setHoveredButton(null)} 
                  onTouchStart={() => setHoveredButton(model.label)} 
                  onTouchEnd={() => setHoveredButton(null)}
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className={`p-3 border-4 border-border ${model.color} shadow-shadow`}>
                      <model.Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-lg uppercase font-bold">{model.label}</span>
                  </div>
                </button>

                {hoveredButton === model.label && (
                  <div className="absolute bottom-full mb-3 z-10 flex flex-col items-center">
                    <div className="bg-background p-3 border-4 border-border shadow-shadow max-w-xs">
                      <div className="w-32 h-20 border-2 border-border flex items-center justify-center bg-secondary-background mb-3">
                        {model.imageSrc ? (
                          <Image 
                            src={model.imageSrc} 
                            alt={`${model.label} preview`} 
                            width={128}
                            height={80}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-foreground text-sm font-bold text-center">{model.tooltip}</p>
                    </div>
                    <div 
                      className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-border" 
                      style={{ marginTop: '-2px' }} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="w-full mt-8">
            <PremiumFeatureCard 
              title="Advanced Models" 
              description="Access premium AI models with enhanced capabilities"
              price="5 USDC/mo"
            />
          </div>
          <div className="w-full mt-8 flex gap-4">
            <Button
              onClick={handleBack}
              variant="neutral"
              size="lg"
              className="flex-1"
            >
              ← BACK
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedModel}
              variant={selectedModel ? "default" : "neutral"}
              size="lg"
              className={`flex-1 ${!selectedModel ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              CONTINUE →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}