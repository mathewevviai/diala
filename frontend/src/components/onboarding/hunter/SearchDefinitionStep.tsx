'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star15 } from '@/components/ui/star';
import { 
  UilArrowRight,
  UilInfoCircle,
  UilSearch,
  UilDatabase,
  UilChartGrowth,
  UilGlobe,
  UilBuilding
} from '@tooni/iconscout-unicons-react';
import { StepProps } from './types';
import PremiumFeatureCard from '@/components/custom/premium-feature-card';

export function SearchDefinitionStep({
  searchName,
  setSearchName,
  searchObjective,
  setSearchObjective,
  selectedSources,
  handleSourceSelect,
  setCurrentStep,
  userUsageStats,
  leadSources
}: StepProps) {
  return (
    <Card className="transform rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Info Section */}
          <Card className="bg-violet-50 border-2 border-black">
            <CardContent className="p-6">
              <h3 className="text-2xl font-black uppercase mb-3">INTELLIGENT LEAD HUNTER</h3>
              <p className="text-lg text-gray-700 mb-4">
                Hunter combines powerful search capabilities with automated outreach to find and contact your perfect customers.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                  <span className="font-medium">Multi-source search</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                  <span className="font-medium">Smart filtering</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                  <span className="font-medium">Automated outreach</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                  <span className="font-medium">Real-time enrichment</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <label className="text-xl font-black uppercase mb-3 block">
              SEARCH NAME
            </label>
            <Input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g., Q4 Enterprise Outreach"
              className="h-16 text-lg font-semibold border-4 border-black rounded-[3px]"
            />
          </div>
          
          <div>
            <label className="text-xl font-black uppercase mb-3 block">
              SEARCH OBJECTIVE
            </label>
            <Textarea
              value={searchObjective}
              onChange={(e) => setSearchObjective(e.target.value)}
              placeholder="What type of leads are you looking for? What's your ideal customer profile?"
              className="min-h-[120px] text-lg font-semibold border-4 border-black rounded-[3px] resize-none"
            />
          </div>
          
          {/* Lead Sources */}
          <div>
            <label className="text-xl font-black uppercase mb-3 block">
              SELECT LEAD SOURCES
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leadSources.map((source) => {
                const isLocked = source.id === 'database' || source.id === 'directory';
                return (
                  <Card 
                    key={source.id}
                    className={`transform transition-all border-4 border-black relative ${
                      isLocked 
                        ? 'bg-gray-100 opacity-75 cursor-not-allowed' 
                        : `cursor-pointer hover:scale-105 ${
                            selectedSources.includes(source.id) 
                              ? 'shadow-[8px_8px_0_rgba(0,0,0,1)] z-10 bg-yellow-400'
                              : 'bg-violet-50'
                          }`
                    }`}
                    onClick={() => !isLocked && handleSourceSelect(source.id)}
                  >
                    {!isLocked && selectedSources.includes(source.id) && (
                      <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-[100]" style={{animation: 'overshoot 0.3s ease-out'}}>
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
                    <CardContent className="p-6 text-center relative">
                      {isLocked && (
                        <Badge className="absolute top-2 right-2 bg-yellow-200 text-black border-2 border-black">
                          LOCKED
                        </Badge>
                      )}
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                        isLocked 
                          ? 'bg-gray-400'
                          : selectedSources.includes(source.id) ? 'bg-yellow-400' : source.color
                      }`}>
                        {React.cloneElement(source.icon, { 
                          className: `h-8 w-8 ${
                            isLocked 
                              ? 'text-white'
                              : selectedSources.includes(source.id) ? 'text-black' : 'text-white'
                          }` 
                        })}
                      </div>
                      <h3 className="text-lg font-black uppercase mb-1">{source.name}</h3>
                      <p className="text-sm">{isLocked ? 'Premium feature' : source.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          
          {/* Usage Stats Display */}
          {userUsageStats && (
            <Card className="bg-violet-50 border-2 border-black">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-black uppercase text-sm">Your Usage Today</h4>
                  <Badge className={`border-2 border-black ${
                    userUsageStats.subscription?.tier === 'free' ? 'bg-gray-200' :
                    userUsageStats.subscription?.tier === 'premium' ? 'bg-yellow-200' : 'bg-purple-200'
                  } text-black`}>
                    {userUsageStats.subscription?.tier?.toUpperCase()} PLAN
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-bold">Searches Today</p>
                    <p className="text-violet-600">
                      {userUsageStats.usage.searchesToday} / {
                        userUsageStats.usage.searchesRemaining === -1 
                          ? '∞' 
                          : userUsageStats.subscription?.searchesPerDay
                      }
                    </p>
                  </div>
                  <div>
                    <p className="font-bold">Leads This Month</p>
                    <p className="text-violet-600">
                      {userUsageStats.usage.leadsThisMonth} / {
                        userUsageStats.usage.leadsRemaining === -1 
                          ? '∞' 
                          : userUsageStats.subscription?.totalLeadsPerMonth
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-violet-50 border-2 border-black rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Button size="sm" variant="neutral" className="bg-white flex-shrink-0">
                <UilInfoCircle className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-sm font-bold">PRO TIP</p>
                <p className="text-sm text-gray-700 mt-1">
                  Using multiple sources increases lead quality and quantity. We&apos;ll cross-reference data for accuracy.
                </p>
              </div>
            </div>
          </div>
          
          <Button
            className="w-full h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
            onClick={() => {
              // Check if user has remaining searches
              if (userUsageStats?.usage.searchesRemaining === 0) {
                alert('You have reached your daily search limit. Please upgrade your plan to continue.');
                return;
              }
              setCurrentStep(2);
            }}
            disabled={!searchName || !searchObjective || selectedSources.length === 0}
          >
            CONTINUE
            <UilArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* Bottom Info Sections - Can be imported separately or included */
export function SearchDefinitionInfoSections() {
  return (
    <div className="mt-12 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      <Card className="transform -rotate-1 relative overflow-hidden bg-violet-50">
        <CardContent className="relative pt-6">
          <div className="flex items-start gap-4">
            <Button
              size="icon"
              variant="default"
              className="w-12 h-12 flex-shrink-0 bg-violet-600 hover:bg-violet-700 text-white border-black"
            >
              <UilSearch className="h-6 w-6 text-white" />
            </Button>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                LEAD GENERATION POWERHOUSE
              </h3>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                Hunter finds <span className="font-black text-violet-600">10x more qualified leads</span> than traditional methods by searching 
                across web directories, business listings, and B2B databases simultaneously. Our AI-powered enrichment ensures every lead comes with 
                verified contact information and detailed insights.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                  <span className="text-black font-medium">Cross-platform lead search</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                  <span className="text-black font-medium">Real-time data enrichment</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                  <span className="text-black font-medium">Email verification included</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                  <span className="text-black font-medium">Direct dial numbers</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transform rotate-1 relative overflow-hidden bg-violet-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Button
              size="icon"
              variant="default"
              className="w-12 h-12 flex-shrink-0 bg-yellow-400 hover:bg-yellow-400/90 text-black"
            >
              <UilDatabase className="h-6 w-6 text-black" />
            </Button>
            <div className="flex-1">
              <h3 className="text-xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                DATA ACCURACY GUARANTEE
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Every lead is <span className="font-black text-violet-600">triple-verified</span> across multiple data sources. 
                Our proprietary matching algorithm ensures 95%+ accuracy on contact information, while continuous updates keep your 
                lead data fresh and actionable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PremiumFeatureCard
        title="ADVANCED SEARCH FILTERS"
        description="Unlock powerful filtering options to find exactly who you need"
        features={[
          'Technographic data (tech stack used)',
          'Funding and revenue filters',
          'Intent data and buying signals',
          'Social media activity level',
          'Custom boolean search queries'
        ]}
        currentPlan="basic"
      />
    </div>
  );
}