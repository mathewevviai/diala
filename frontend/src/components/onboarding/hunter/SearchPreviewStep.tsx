'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PremiumFeatureCard from '@/components/custom/premium-feature-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UilArrowLeft,
  UilSearch,
  UilInfoCircle,
  UilClipboardNotes,
  UilChartGrowth
} from '@tooni/iconscout-unicons-react';
import { StepProps } from './types';

export function SearchPreviewStep({
  searchName,
  searchObjective,
  searchCriteria,
  customIndustry,
  selectedSources,
  canStartSearch,
  startSearch,
  setCurrentStep,
  userUsageStats
}: StepProps) {
  return (
    <Card className="transform rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            READY TO HUNT
          </h1>
        </div>
        <div className="space-y-6">
          <Card className="bg-violet-100 border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)]">
            <CardContent className="p-6">
              <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
                <UilClipboardNotes className="h-6 w-6" />
                SEARCH SUMMARY
              </h3>
              <div className="space-y-4">
                <div className="bg-white border-2 border-black rounded-lg p-3">
                  <p className="text-xs font-black uppercase text-gray-600 mb-1">SEARCH NAME</p>
                  <p className="font-bold text-lg">{searchName}</p>
                </div>
                <div className="bg-white border-2 border-black rounded-lg p-3">
                  <p className="text-xs font-black uppercase text-gray-600 mb-1">OBJECTIVE</p>
                  <p className="font-semibold">{searchObjective}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border-2 border-black rounded-lg p-3">
                    <p className="text-xs font-black uppercase text-gray-600 mb-1">INDUSTRY</p>
                    <p className="font-bold">{searchCriteria.industry === 'Other' ? customIndustry : searchCriteria.industry}</p>
                  </div>
                  <div className="bg-white border-2 border-black rounded-lg p-3">
                    <p className="text-xs font-black uppercase text-gray-600 mb-1">LOCATION</p>
                    <p className="font-bold">{searchCriteria.location}</p>
                  </div>
                </div>
                {searchCriteria.companySize && (
                  <div className="bg-white border-2 border-black rounded-lg p-3">
                    <p className="text-xs font-black uppercase text-gray-600 mb-1">COMPANY SIZE</p>
                    <p className="font-bold">{searchCriteria.companySize} employees</p>
                  </div>
                )}
                {searchCriteria.jobTitles.length > 0 && (
                  <div className="bg-white border-2 border-black rounded-lg p-3">
                    <p className="text-xs font-black uppercase text-gray-600 mb-1">TARGET ROLES</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {searchCriteria.jobTitles.map((title) => (
                        <Badge key={title} className="bg-violet-200 text-black border-2 border-black">
                          {title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-white border-2 border-black rounded-lg p-3">
                  <p className="text-xs font-black uppercase text-gray-600 mb-1">LEAD SOURCES</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSources.map((source) => (
                      <Badge key={source} className="bg-green-200 text-black border-2 border-black">
                        {source.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-violet-100 border-2 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] transform -rotate-1">
            <CardContent className="p-6 text-center">
              <UilChartGrowth className="h-12 w-12 mx-auto mb-3 text-violet-600" />
              <h3 className="text-2xl font-black uppercase mb-2">ESTIMATED RESULTS</h3>
              <p className="text-4xl font-black text-violet-600 mb-2">30</p>
              <p className="text-lg font-medium">QUALIFIED LEADS</p>
            </CardContent>
          </Card>

          <PremiumFeatureCard
            title="PREMIUM PLAN"
            description="Get 10,000 qualified leads per month with unlimited searches and 10x lead generation"
            price="$100/month"
            badge="PREMIUM"
            className="transform rotate-2"
          />

          <div className="bg-violet-50 border-2 border-black rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Button size="sm" variant="neutral" className="bg-white flex-shrink-0">
                <UilInfoCircle className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-sm font-bold">WHAT HAPPENS NEXT</p>
                <p className="text-sm text-gray-700 mt-1">
                  We&apos;ll search across all selected sources, verify contact information, and compile your lead list. 
                  This typically takes 3-5 minutes depending on search complexity.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => setCurrentStep(3.5)}
            >
              <UilArrowLeft className="mr-2 h-6 w-6" />
              BACK
            </Button>
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
              onClick={() => {
                // Check limits before starting search
                if (userUsageStats?.usage.searchesRemaining === 0) {
                  alert('You have reached your daily search limit. Please upgrade your plan to continue.');
                  return;
                }
                if (userUsageStats?.usage.leadsRemaining === 0) {
                  alert('You have reached your monthly lead limit. Please upgrade your plan to continue.');
                  return;
                }
                startSearch();
              }}
              disabled={!canStartSearch()}
            >
              START HUNTING
              <UilSearch className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}