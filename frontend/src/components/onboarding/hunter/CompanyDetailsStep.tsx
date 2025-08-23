'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star15 } from '@/components/ui/star';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UilArrowRight,
  UilArrowLeft,
  UilInfoCircle
} from '@tooni/iconscout-unicons-react';
import { StepProps } from './types';

export function CompanyDetailsStep({
  searchCriteria,
  setSearchCriteria,
  toggleJobTitle,
  setCurrentStep,
  jobTitles
}: StepProps) {
  return (
    <Card className="transform -rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            COMPANY DETAILS
          </h1>
        </div>
        <p className="text-xl text-center text-gray-700 mb-8">
          Narrow down your ideal prospect profile
        </p>
        <div className="space-y-6">
          {/* Company Size */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xl font-black uppercase block">
                COMPANY SIZE <span className="text-sm font-normal">(OPTIONAL)</span>
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0 bg-transparent border-none outline-none">
                    <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Filter companies by employee count. Smaller companies are often more accessible, larger ones have bigger budgets.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['1-10', '11-50', '51-100', '101-500', '501-1000', '1000+'].map((size) => (
                <Button
                  key={size}
                  variant={searchCriteria.companySize === size ? "header" : "outline"}
                  className={`h-12 font-bold border-2 border-black relative ${
                    searchCriteria.companySize === size ? 'bg-yellow-400' : 'bg-white hover:bg-violet-100'
                  }`}
                  onClick={() => setSearchCriteria({...searchCriteria, companySize: size})}
                >
                  {searchCriteria.companySize === size && (
                    <div className="absolute -top-4 -right-4 z-[100]" style={{animation: 'overshoot 0.3s ease-out'}}>
                      <div className="relative">
                        <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                          <Star15 color="#FFD700" size={40} className="w-10 h-10" stroke="black" strokeWidth={4} />
                        </div>
                      </div>
                    </div>
                  )}
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Job Titles */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xl font-black uppercase block">
                TARGET JOB TITLES <span className="text-sm font-normal">(OPTIONAL)</span>
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0 bg-transparent border-none outline-none">
                    <UilInfoCircle className="h-4 w-4 text-gray-500 hover:text-black cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Target specific job roles. Select multiple titles to cast a wider net. AI will find similar roles automatically.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {jobTitles.map((title) => (
                <Button
                  key={title}
                  variant="subheader"
                  className={`h-12 font-bold border-2 border-black relative ${
                     searchCriteria.jobTitles.includes(title) 
                      ? 'bg-yellow-400' 
                      : 'bg-white hover:bg-violet-50'                  }`}
                  onClick={() => toggleJobTitle(title)}
                >
                  {searchCriteria.jobTitles.includes(title) && (
                    <div className="absolute -top-4 -right-4 z-[100]" style={{animation: 'overshoot 0.3s ease-out'}}>
                      <div className="relative">
                        <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                          <Star15 color="#FFD700" size={40} className="w-10 h-10" stroke="black" strokeWidth={4} />
                        </div>
                      </div>
                    </div>
                  )}
                  {title}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-violet-50 border-2 border-black rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Button size="sm" variant="neutral" className="bg-white flex-shrink-0">
                <span className="text-violet-600 font-black">2</span>
              </Button>
              <div>
                <p className="text-sm font-bold">STEP 2 OF 3</p>
                <p className="text-sm text-gray-700 mt-1">
                  Both fields are optional. Skip if you want to cast a wide net or be specific to target exact decision-makers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => setCurrentStep(2)}
            >
              <UilArrowLeft className="mr-2 h-6 w-6" />
              BACK
            </Button>
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
              onClick={() => setCurrentStep(2.75)}
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