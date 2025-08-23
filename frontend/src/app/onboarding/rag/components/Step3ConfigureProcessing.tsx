'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UilArrowLeft, 
  UilCloudDownload, 
  UilSetting,
  UilInfoCircle
} from '@tooni/iconscout-unicons-react';
import { AdvancedSettings } from '../types';

interface Step3ConfigureProcessingProps {
  selectedSourceType: string;
  sourceInput: string;
  uploadedFiles: File[];
  advancedSettings: AdvancedSettings;
  onSettingsChange: (settings: AdvancedSettings) => void;
  onBack: () => void;
  onStartProcessing: () => void;
  checkSizeLimit?: {
    allowed: boolean;
    maxSize?: number;
    userTier: string;
  };
  totalFileSize: number;
}

export function Step3ConfigureProcessing({
  selectedSourceType,
  sourceInput,
  uploadedFiles,
  advancedSettings,
  onSettingsChange,
  onBack,
  onStartProcessing,
  checkSizeLimit,
  totalFileSize
}: Step3ConfigureProcessingProps) {
  const getSourceSummary = () => {
    switch (selectedSourceType) {
      case 'youtube':
        return `URL: ${sourceInput}`;
      case 'tiktok':
        return `URL: ${sourceInput}`;
      case 'twitch':
        return `URL: ${sourceInput}`;
      case 'documents':
        return `Files: ${uploadedFiles.length} documents`;
      case 'urls':
        return `URLs: ${sourceInput.split('\n').filter(url => url.trim()).length} pages`;
      case 'csv':
        return `File: ${uploadedFiles[0]?.name || 'CSV file'}`;
      default:
        return 'Source configured';
    }
  };

  return (
    <Card className="transform rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            CONFIGURE PROCESSING
          </h1>
        </div>
        <div className="space-y-6">
          {/* Summary */}
          <Card className="bg-cyan-100 border-2 border-black">
            <CardContent className="p-4">
              <h3 className="text-xl font-black uppercase mb-2">READY TO PROCESS</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <span className="font-bold">Source Type: {selectedSourceType.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  <span className="font-bold">{getSourceSummary()}</span>
                </div>
                {selectedSourceType === 'documents' && checkSizeLimit && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                    <span className="font-bold">
                      File Size: {(totalFileSize / 1024 / 1024).toFixed(2)} MB / 
                      {checkSizeLimit.maxSize ? (checkSizeLimit.maxSize / 1024 / 1024).toFixed(0) : '∞'} MB
                      <Badge className="ml-2" variant={checkSizeLimit.allowed ? "default" : "destructive"}>
                        {checkSizeLimit.userTier}
                      </Badge>
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced" className="border-2 border-black">
              <AccordionTrigger className="text-left font-black py-4 px-4 hover:bg-cyan-100">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="neutral" className="bg-cyan-500 text-white">
                    <UilSetting className="h-4 w-4" />
                  </Button>
                  ADVANCED SETTINGS (OPTIONAL)
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                <TooltipProvider>
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="text-sm font-bold uppercase cursor-help">
                          Chunk Size: {advancedSettings.chunkSize} tokens
                          <UilInfoCircle className="inline-block h-3 w-3 ml-1 text-gray-600" />
                        </label>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Size of text segments for processing. Larger chunks maintain more context but may be less precise. Smaller chunks are more precise but may lose context.</p>
                      </TooltipContent>
                    </Tooltip>
                    <Slider 
                      value={[advancedSettings.chunkSize]}
                      onValueChange={(value) => onSettingsChange({...advancedSettings, chunkSize: value[0]})}
                      min={256}
                      max={1024}
                      step={128}
                      className="mt-2"
                    />
                  </div>
                </TooltipProvider>
                
                <TooltipProvider>
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="text-sm font-bold uppercase cursor-help">
                          Overlap: {advancedSettings.overlap} words
                          <UilInfoCircle className="inline-block h-3 w-3 ml-1 text-gray-600" />
                        </label>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Number of words shared between adjacent chunks. Prevents information loss at chunk boundaries by ensuring continuity.</p>
                      </TooltipContent>
                    </Tooltip>
                    <Slider 
                      value={[advancedSettings.overlap]}
                      onValueChange={(value) => onSettingsChange({...advancedSettings, overlap: value[0]})}
                      min={0}
                      max={Math.floor(advancedSettings.chunkSize / 4)}
                      step={10}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {advancedSettings.overlap > advancedSettings.chunkSize / 4 
                        ? 'High overlap - may create redundant embeddings' 
                        : 'Overlap helps maintain context between chunks'}
                    </p>
                  </div>
                </TooltipProvider>
                
                <TooltipProvider>
                  <div className="flex items-center justify-between">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="text-sm font-bold uppercase cursor-help">
                          Embedding Model
                          <UilInfoCircle className="inline-block h-3 w-3 ml-1 text-gray-600" />
                        </label>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>AI model that converts text into numerical vectors for semantic search. Jina-clip-v2 provides state-of-the-art accuracy.</p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge className="bg-cyan-200 text-black border-2 border-black">
                      {advancedSettings.embeddingModel}
                    </Badge>
                  </div>
                </TooltipProvider>
                
                <TooltipProvider>
                  <div className="flex items-center justify-between">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="text-sm font-bold uppercase cursor-help">
                          Vector Store
                          <UilInfoCircle className="inline-block h-3 w-3 ml-1 text-gray-600" />
                        </label>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Database that stores and searches embedding vectors. Convex provides fast, scalable vector similarity search.</p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge className="bg-cyan-200 text-black border-2 border-black">
                      {advancedSettings.vectorStore}
                    </Badge>
                  </div>
                </TooltipProvider>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="bg-cyan-50 border-2 border-black rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Button size="sm" variant="neutral" className="bg-cyan-100 flex-shrink-0">
                <UilInfoCircle className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-sm font-bold">PROCESSING INFO</p>
                <p className="text-sm text-gray-700 mt-1">
                  We&apos;ll automatically extract text, generate embeddings, and build a searchable index. 
                  This typically takes 2-5 minutes depending on content size.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Help Hint */}
        <div className="mt-8">
          <Card className="bg-yellow-200 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
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
                  <p className="text-sm font-bold uppercase">PROCESSING SETTINGS</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Default settings work great for most use cases. Advanced settings let you fine-tune how content is chunked and embedded for optimal retrieval.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mt-8">
          <Button
            className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
            onClick={onBack}
          >
            <UilArrowLeft className="mr-2 h-6 w-6" />
            BACK
          </Button>
          <Button
            className="flex-1 h-14 text-lg font-black uppercase bg-[rgb(0,82,255)] hover:bg-blue-600 text-white"
            onClick={onStartProcessing}
          >
            START PROCESSING
            <UilCloudDownload className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}