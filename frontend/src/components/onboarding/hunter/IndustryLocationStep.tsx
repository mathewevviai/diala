'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star15 } from '@/components/ui/star';
import { 
  UilArrowRight,
  UilArrowLeft
} from '@tooni/iconscout-unicons-react';
import { StepProps } from './types';

export function IndustryLocationStep({
  searchCriteria,
  setSearchCriteria,
  customIndustry,
  setCustomIndustry,
  setCurrentStep,
  industries
}: StepProps) {
  return (
    <Card className="transform rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            INDUSTRY & LOCATION
          </h1>
        </div>
        <p className="text-xl text-center text-gray-700 mb-8">
          Define your target market and geographic focus
        </p>
        <div className="space-y-6">
          {/* Industry Selection */}
          <div>
            <label className="text-xl font-black uppercase mb-3 block">
              TARGET INDUSTRY
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {industries.map((industry) => (
                <Button
                  key={industry}
                  variant={searchCriteria.industry === industry || (industry === 'Other' && searchCriteria.industry === customIndustry) ? "header" : "default"}
                  className={`h-12 font-bold border-2 border-black relative ${
                     searchCriteria.industry === industry || (industry === 'Other' && searchCriteria.industry === customIndustry) 
                      ? 'bg-yellow-400' 
                      : 'bg-white hover:bg-violet-100'                  }`}
                  onClick={() => {
                    if (industry === 'Other') {
                      setSearchCriteria({...searchCriteria, industry: customIndustry || 'Other'});
                    } else {
                      setSearchCriteria({...searchCriteria, industry});
                      setCustomIndustry('');
                    }
                  }}
                >
                  {(searchCriteria.industry === industry || (industry === 'Other' && searchCriteria.industry === customIndustry)) && (
                    <div className="absolute -top-4 -right-4 z-[100]" style={{animation: 'overshoot 0.3s ease-out'}}>
                      <div className="relative">
                        <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                          <Star15 color="#FFD700" size={40} className="w-10 h-10" stroke="black" strokeWidth={4} />
                        </div>
                      </div>
                    </div>
                  )}
                  {industry}
                </Button>
              ))}
            </div>
            {/* Custom Industry Input */}
            {(searchCriteria.industry === 'Other' || searchCriteria.industry === customIndustry) && (
              <Input
                type="text"
                value={customIndustry}
                onChange={(e) => {
                  setCustomIndustry(e.target.value);
                  setSearchCriteria({...searchCriteria, industry: e.target.value || 'Other'});
                }}
                placeholder="Enter custom industry..."
                className="h-12 text-lg font-semibold border-4 border-black rounded-[3px]"
              />
            )}
          </div>

          {/* Location */}
          <div>
            <label className="text-xl font-black uppercase mb-3 block">
              TARGET LOCATION
            </label>
            <Input
              type="text"
              value={searchCriteria.location}
              onChange={(e) => setSearchCriteria({...searchCriteria, location: e.target.value})}
              placeholder="e.g., United States, California, San Francisco"
              className={`h-14 text-lg font-semibold border-4 border-black rounded-[3px] ${
                searchCriteria.location && searchCriteria.location.toLowerCase() === searchCriteria.industry.toLowerCase() 
                  ? 'border-red-500' 
                  : ''
              }`}
            />
            {searchCriteria.location && searchCriteria.location.toLowerCase() === searchCriteria.industry.toLowerCase() && (
              <p className="text-red-500 text-sm mt-2 font-bold">
                Location must be a geographic location, not the same as industry
              </p>
            )}
          </div>

          <div className="bg-violet-50 border-2 border-black rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Button size="sm" variant="neutral" className="bg-white flex-shrink-0">
                <span className="text-violet-600 font-black">1</span>
              </Button>
              <div>
                <p className="text-sm font-bold">STEP 1 OF 3</p>
                <p className="text-sm text-gray-700 mt-1">
                  Start with broad targeting - we&apos;ll help you narrow down to specific companies and contacts in the next steps.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => setCurrentStep(1)}
            >
              <UilArrowLeft className="mr-2 h-6 w-6" />
              BACK
            </Button>
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
              onClick={() => setCurrentStep(2.5)}
              disabled={!searchCriteria.industry || !searchCriteria.location}
            >
              CONTINUE
              <UilArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}