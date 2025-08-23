'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UilArrowRight,
  UilArrowLeft,
  UilInfoCircle,
  UilSearch
} from '@tooni/iconscout-unicons-react';
import { StepProps } from './types';

export function SearchKeywordsStep({
  searchCriteria,
  setSearchCriteria,
  setCurrentStep
}: StepProps) {
  return (
    <Card className="transform rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            SEARCH KEYWORDS
          </h1>
        </div>
        <p className="text-xl text-center text-gray-700 mb-8">
          Fine-tune your search with specific keywords
        </p>
        <div className="space-y-6">
          {/* Keywords */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xl font-black uppercase block">
                SEARCH KEYWORDS <span className="text-sm font-normal">(OPTIONAL)</span>
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0 bg-transparent border-none outline-none">
                    <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Add keywords to refine your search. Use commas to separate multiple terms. Example: &quot;SaaS, B2B, startup&quot;</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="text"
              value={searchCriteria.keywords}
              onChange={(e) => setSearchCriteria({...searchCriteria, keywords: e.target.value})}
              placeholder="e.g., SaaS, B2B, Enterprise, Cloud, API, Integration"
              className="h-14 text-lg font-semibold border-4 border-black rounded-[3px]"
            />
          </div>

          {/* Info about keywords */}
          <Card className="bg-violet-50 border-2 border-black">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Button
                  size="icon"
                  variant="default"
                  className="w-12 h-12 flex-shrink-0 bg-violet-600 hover:bg-violet-700 text-white border-black"
                >
                  <UilSearch className="h-6 w-6 text-white" />
                </Button>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-black mb-3 uppercase">
                    SMART KEYWORD MATCHING
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    Our AI will search for these keywords on company websites, social profiles, and business listings. 
                    The more specific your keywords, the more targeted your results.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                      <span className="text-black text-xs font-medium">Technology stack keywords</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                      <span className="text-black text-xs font-medium">Business model terms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                      <span className="text-black text-xs font-medium">Service offerings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                      <span className="text-black text-xs font-medium">Industry-specific terms</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-violet-50 border-2 border-black rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Button size="sm" variant="neutral" className="bg-white flex-shrink-0">
                <span className="text-violet-600 font-black">3</span>
              </Button>
              <div>
                <p className="text-sm font-bold">FINAL STEP</p>
                <p className="text-sm text-gray-700 mt-1">
                  Keywords help narrow your search but are completely optional. Leave blank to find all companies in your target industry and location.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => setCurrentStep(2.5)}
            >
              <UilArrowLeft className="mr-2 h-6 w-6" />
              BACK
            </Button>
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
              onClick={() => setCurrentStep(3)}
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