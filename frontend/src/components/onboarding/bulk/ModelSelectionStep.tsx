'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star15 } from '@/components/ui/star';
import { UilBrain, UilArrowRight, UilArrowLeft, UilInfoCircle, UilRobot, UilCloud, UilCog } from '@tooni/iconscout-unicons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BulkOnboardingState, EmbeddingModel } from './types';
import { useEmbeddingModels } from '@/hooks/useEmbeddingModels';

interface ModelSelectionStepProps {
  state: BulkOnboardingState;
  setState: (updates: Partial<BulkOnboardingState>) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
}

export function ModelSelectionStep({ 
  state, 
  setState, 
  setCurrentStep,
  handleStepChange
}: ModelSelectionStepProps) {
  
  const { models: apiModels, isLoading: modelsLoading, error: modelsError } = useEmbeddingModels();
  
  // Icon mapping for models
  const iconMap = {
    'jina-embeddings-v4': UilBrain,
    'gemini-embedding-exp': UilCloud
  };
  
  // Add icons to models
  const embeddingModels: EmbeddingModel[] = apiModels.map(model => ({
    ...model,
    Icon: iconMap[model.id as keyof typeof iconMap] || UilBrain
  }));
  
  // Use API models or fallback
  const modelsToUse = embeddingModels.length > 0 ? embeddingModels : apiModels;

  const canProceedFromStep4 = () => state.selectedEmbeddingModel !== null;

  const handleModelSelect = (model: EmbeddingModel) => {
    setState({ selectedEmbeddingModel: model });
  };

  if (modelsLoading) {
    return (
      <div className="space-y-8">
        <Card className="transform -rotate-1">
          <CardContent className="p-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-black uppercase text-black mb-4">
                LOADING MODELS
              </h1>
              <div className="animate-spin h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Fetching latest model information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="transform -rotate-1">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
              SELECT EMBEDDING MODEL
            </h1>
            <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">
              Choose the AI model that will convert your content into vector embeddings for searchable knowledge bases.
            </p>
            {modelsError && (
              <div className="mt-3 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                Using cached model data (API temporarily unavailable)
              </div>
            )}
          </div>
          
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {modelsToUse.map((model) => (
                <div key={model.id} className="relative">
                  {state.selectedEmbeddingModel?.id === model.id && (
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
                          state.selectedEmbeddingModel?.id === model.id ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                        }`}
                        onClick={() => handleModelSelect(model)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`w-16 h-16 ${model.color} border-4 border-black flex items-center justify-center flex-shrink-0`}>
                              <model.Icon className="h-10 w-10 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-black uppercase text-lg leading-tight">{model.label}</h4>
                              {model.experimental && (
                                <span className="inline-block bg-orange-400 text-black text-xs font-bold px-2 py-1 border-2 border-black mt-1">
                                  EXPERIMENTAL
                                </span>
                              )}
                              {model.ranking && (
                                <span className="inline-block bg-yellow-400 text-black text-xs font-bold px-2 py-1 border-2 border-black mt-1 ml-2">
                                  {model.ranking}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-4">{model.description}</p>
                          
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-gray-100 border-2 border-black p-2">
                              <div className="font-bold text-gray-600">DIMENSIONS</div>
                              <div className="font-black text-lg">{model.dimensions}</div>
                            </div>
                            <div className="bg-gray-100 border-2 border-black p-2">
                              <div className="font-bold text-gray-600">MTEB SCORE</div>
                              <div className="font-black text-lg">{model.mtebScore}</div>
                            </div>
                            <div className="bg-gray-100 border-2 border-black p-2">
                              <div className="font-bold text-gray-600">MAX TOKENS</div>
                              <div className="font-black">{model.maxTokens?.toLocaleString()}</div>
                            </div>
                            <div className="bg-gray-100 border-2 border-black p-2">
                              <div className="font-bold text-gray-600">LANGUAGES</div>
                              <div className="font-black">{model.supportedLanguages}+</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-3 text-xs">
                            {model.multimodal && (
                              <span className="bg-cyan-300 text-black font-bold px-2 py-1 border border-black">
                                MULTIMODAL
                              </span>
                            )}
                            {model.hasMatryoshka && (
                              <span className="bg-pink-300 text-black font-bold px-2 py-1 border border-black">
                                MATRYOSHKA
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{model.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          </TooltipProvider>

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
                  <p className="text-sm font-bold">CHOOSING AN EMBEDDING MODEL</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Choose between our two premium models: Gemini Experimental leads with highest MTEB performance, while Jina V4 provides excellent multimodal capabilities and proven reliability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-8">
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => {
                // For documents platform, skip content selection step (3) and go back to document upload (2)
                const previousStep = state.selectedPlatform === 'documents' ? 2 : state.currentStep - 1;
                handleStepChange(previousStep);
              }}
            >
              <UilArrowLeft className="mr-2 h-6 w-6" />
              BACK
            </Button>
            <Button
              className={`flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black ${!canProceedFromStep4() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setCurrentStep(5)}
              disabled={!canProceedFromStep4()}
            >
              CONTINUE
              <UilArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}