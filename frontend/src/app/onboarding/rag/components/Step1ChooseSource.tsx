'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star15 } from '@/components/ui/star';
import { 
  UilYoutube, 
  UilFile, 
  UilLink, 
  UilDatabase,
  UilInfoCircle,
  UilArrowRight
} from '@tooni/iconscout-unicons-react';
import Image from 'next/image';

interface Step1ChooseSourceProps {
  selectedSourceType: string;
  onSourceTypeSelect: (type: string) => void;
  onContinue: () => void;
}

export function Step1ChooseSource({ selectedSourceType, onSourceTypeSelect, onContinue }: Step1ChooseSourceProps) {
  const sourceTypes = [
    {
      type: 'youtube',
      icon: UilYoutube,
      title: 'YOUTUBE VIDEOS',
      description: 'Ingest transcripts from channels or playlists',
      color: 'bg-red-500 hover:bg-red-600',
      bgColor: 'bg-cyan-50'
    },
    {
      type: 'tiktok',
      icon: null, // Will use Image component
      title: 'TIKTOK VIDEOS',
      description: 'Process creator content and trends',
      color: 'bg-black hover:bg-gray-800',
      bgColor: 'bg-cyan-50',
      customIcon: true
    },
    {
      type: 'twitch',
      icon: null, // Will use Image component
      title: 'TWITCH STREAMS',
      description: 'Extract content from live streams and VODs',
      color: 'bg-purple-500 hover:bg-purple-600',
      bgColor: 'bg-cyan-50',
      customIcon: true
    },
    {
      type: 'documents',
      icon: UilFile,
      title: 'DOCUMENTS',
      description: 'Upload PDFs, Word docs, or text files',
      color: 'bg-orange-500 hover:bg-orange-600',
      bgColor: 'bg-cyan-50'
    },
    {
      type: 'urls',
      icon: UilLink,
      title: 'WEB PAGES',
      description: 'Scrape content from websites',
      color: 'bg-blue-500 hover:bg-blue-600',
      bgColor: 'bg-cyan-50'
    },
    {
      type: 'csv',
      icon: UilDatabase,
      title: 'STRUCTURED DATA',
      description: 'Import CSV or knowledge base files',
      color: 'bg-green-500 hover:bg-green-600',
      bgColor: 'bg-cyan-50'
    }
  ];

  return (
    <Card className="transform rotate-1 relative">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            SELECT YOUR SOURCE
          </h1>
        </div>
        <p className="text-xl text-center text-gray-700 mb-8">
          What type of content do you want to feed your AI agent?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {sourceTypes.map((source) => (
              <Card 
              key={source.type}
               className={`cursor-pointer transform hover:scale-105 transition-transform border-4 border-black hover:shadow-[8px_8px_0_rgba(0,0,0,1)] ${source.bgColor} relative`}              onClick={() => {
                if (selectedSourceType === source.type) {
                  onSourceTypeSelect(''); // Unselect if already selected
                } else {
                  onSourceTypeSelect(source.type);
                }
              }}
            >
              {selectedSourceType === source.type && (
                <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-[999]" style={{animation: 'overshoot 0.3s ease-out'}}>
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
              )}              <CardContent className="p-6 text-center">
                <Button size="icon" variant="header" className={`w-16 h-16 mb-4 ${source.color}`}>
                  {source.customIcon ? (
                    source.type === 'tiktok' ? (
                      <Image src="/tiktok.svg" alt="TikTok" width={32} height={32} className="h-8 w-8 filter brightness-0 invert" />
                    ) : source.type === 'twitch' ? (
                      <Image src="/twitch.svg" alt="Twitch" width={32} height={32} className="h-8 w-8 filter brightness-0 invert" />
                    ) : null
                  ) : (
                    <source.icon className="h-8 w-8 text-white" />
                  )}
                </Button>
                <h3 className="text-2xl font-black uppercase mb-2">{source.title}</h3>
                <p className="text-gray-700">{source.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <div className="mt-8">
          <Button
            className="w-full h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black border-2 border-black"
            onClick={onContinue}
            disabled={!selectedSourceType}
          >
            <span className="flex items-center justify-center w-full">
              Continue
              <UilArrowRight className="ml-2 h-6 w-6" />
            </span>
          </Button>
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
                  <p className="text-sm font-bold uppercase">CHOOSING YOUR SOURCE</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Select the type of content you want to transform into searchable knowledge. Each source type has different processing capabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}