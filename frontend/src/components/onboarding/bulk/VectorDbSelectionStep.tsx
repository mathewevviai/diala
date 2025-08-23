'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star15 } from '@/components/ui/star';
import { UilDatabase, UilArrowRight, UilArrowLeft, UilInfoCircle, UilCloud, UilServer, UilHeart } from '@tooni/iconscout-unicons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BulkOnboardingState, VectorDatabase } from './types';

interface VectorDbSelectionStepProps {
  state: BulkOnboardingState;
  setState: (updates: Partial<BulkOnboardingState>) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
}

export function VectorDbSelectionStep({ 
  state, 
  setState, 
  setCurrentStep,
  handleStepChange
}: VectorDbSelectionStepProps) {
  
  const vectorDatabases: VectorDatabase[] = [
    {
      id: 'pinecone',
      label: 'PINECONE',
      Icon: UilCloud,
      color: 'bg-purple-500',
      tooltip: 'Managed vector database with excellent performance and scalability. Zero-configuration setup with enterprise-grade security.',
      description: 'Cloud-native vector database optimized for production workloads. Handles billions of vectors with millisecond search latency.',
      isPremium: false,
      hosting: 'Managed Cloud',
      scalability: 'Excellent',
      setup: 'Easy',
      bestFor: 'Production',
      pricing: 'Pay-per-use',
      features: ['Serverless & managed', 'Built-in metadata filtering', 'Real-time updates', 'Enterprise security', 'Auto-scaling']
    },
    {
      id: 'chromadb',
      label: 'CHROMADB',
      Icon: UilServer,
      color: 'bg-blue-500',
      tooltip: 'Open-source embedding database that runs locally or in the cloud. Perfect for development and rapid prototyping.',
      description: 'Lightweight, fast, and easy to use. Perfect for prototyping and small to medium-scale deployments.',
      isPremium: false,
      hosting: 'Self-hosted',
      scalability: 'Good',
      setup: 'Simple',
      bestFor: 'Development',
      pricing: 'Free',
      features: ['Open source & free', 'Python-first API', 'Local development', 'Minimal dependencies', 'Easy integration']
    },
    {
      id: 'weaviate',
      label: 'WEAVIATE',
      Icon: UilHeart,
      color: 'bg-green-500',
      tooltip: 'Enterprise-grade vector search engine with GraphQL API and advanced ML capabilities.',
      description: 'Enterprise-grade vector database with built-in ML models, multimodal search, and advanced filtering capabilities.',
      isPremium: true,
      hosting: 'Cloud/Self',
      scalability: 'Excellent',
      setup: 'Advanced',
      bestFor: 'Enterprise',
      pricing: 'Variable',
      features: ['GraphQL API', 'Multi-modal search', 'Built-in ML models', 'Complex filtering', 'Kubernetes ready']
    },
    {
      id: 'convex',
      label: 'CONVEX',
      Icon: UilDatabase,
      color: 'bg-orange-500',
      tooltip: 'Convex is the backend-as-a-service with built-in vector search. Seamlessly integrated with your existing Convex data.',
      description: 'Convex provides native vector search capabilities directly integrated with your database. No separate vector database needed.',
      isPremium: false,
      hosting: 'Managed Cloud',
      scalability: 'Excellent',
      setup: 'Easy',
      bestFor: 'Convex Apps',
      pricing: 'Included',
      features: ['Native integration', 'Real-time sync', 'Automatic indexing', 'Zero-config setup', 'Convex-native']
    }
  ];

  const canProceedFromStep5 = () => state.selectedVectorDb !== null;

  const handleVectorDbSelect = (vectorDb: VectorDatabase) => {
    setState({ selectedVectorDb: vectorDb });
  };

  return (
    <div className="space-y-8">
      <Card className="transform -rotate-1">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
              CHOOSE VECTOR DATABASE
            </h1>
            <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">
              Select where your vector embeddings will be stored for fast semantic search and retrieval.
            </p>
          </div>
          
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
              {vectorDatabases.map((vectorDb) => (
                <div key={vectorDb.id} className="relative h-full">
                  {state.selectedVectorDb?.id === vectorDb.id && (
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
                        className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all h-full ${
                          state.selectedVectorDb?.id === vectorDb.id ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                        }`}
                        onClick={() => handleVectorDbSelect(vectorDb)}
                      >
                        <CardContent className="p-4 h-full flex flex-col">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-12 h-12 ${vectorDb.color} border-4 border-black flex items-center justify-center flex-shrink-0 relative`}>
                              <vectorDb.Icon className="h-8 w-8 text-white" />
                              {vectorDb.isPremium && (
                                <div className="absolute -top-1 -right-1 bg-yellow-400 border-2 border-black rounded-full p-0.5">
                                  <UilDatabase className="h-2 w-2 text-black" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-black uppercase text-base leading-tight">{vectorDb.label}</h4>
                              {vectorDb.isPremium && (
                                <span className="inline-block bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 border border-black mt-1">
                                  PREMIUM
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-700 mb-3 leading-relaxed flex-shrink-0">{vectorDb.description}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3 flex-shrink-0">
                            <div className="bg-gray-100 border-2 border-black p-1.5">
                              <div className="font-bold text-gray-600 text-[10px]">HOSTING</div>
                              <div className="font-black text-xs">{vectorDb.hosting}</div>
                            </div>
                            <div className="bg-gray-100 border-2 border-black p-1.5">
                              <div className="font-bold text-gray-600 text-[10px]">SCALABILITY</div>
                              <div className="font-black text-xs">{vectorDb.scalability}</div>
                            </div>
                            <div className="bg-gray-100 border-2 border-black p-1.5">
                              <div className="font-bold text-gray-600 text-[10px]">SETUP</div>
                              <div className="font-black text-xs">{vectorDb.setup}</div>
                            </div>
                            <div className="bg-gray-100 border-2 border-black p-1.5">
                              <div className="font-bold text-gray-600 text-[10px]">PRICING</div>
                              <div className="font-black text-xs">{vectorDb.pricing}</div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="font-bold text-gray-600 text-[10px] mb-1">KEY FEATURES</div>
                            <div className="flex flex-wrap gap-1">
                              {vectorDb.features.slice(0, 3).map((feature, index) => (
                                <span key={index} className="bg-cyan-200 text-black text-[10px] font-bold px-1.5 py-0.5 border border-black">
                                  {feature}
                                </span>
                              ))}
                              {vectorDb.features.length > 3 && (
                                <span className="bg-gray-200 text-black text-[10px] font-bold px-1.5 py-0.5 border border-black">
                                  +{vectorDb.features.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{vectorDb.tooltip}</p>
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
                  <p className="text-sm font-bold">CHOOSING A VECTOR DATABASE</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Pinecone offers managed cloud hosting perfect for production. ChromaDB provides free, open-source local development. 
                    Weaviate delivers enterprise features with advanced ML capabilities. All three seamlessly support your vector embeddings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-8">
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => handleStepChange(4)}
            >
              <UilArrowLeft className="mr-2 h-6 w-6" />
              BACK
            </Button>
            <Button
              className={`flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black ${!canProceedFromStep5() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setCurrentStep(6)}
              disabled={!canProceedFromStep5()}
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