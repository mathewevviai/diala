'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UilSearch,
  UilBuilding,
  UilGlobe,
  UilDatabase
} from '@tooni/iconscout-unicons-react';
import { StepProps } from './types';
import PremiumFeatureCard from '@/components/custom/premium-feature-card';

export function SearchProgressStep({
  currentStatus,
  searchProgress
}: StepProps) {
  return (
    <Card className="transform -rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            HUNTING IN PROGRESS
          </h1>
        </div>
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-violet-400 border-4 border-black rounded-full mb-4">
              <UilSearch className="h-12 w-12 text-black animate-pulse" />
            </div>
            <p className="text-xl font-bold text-gray-700">{currentStatus}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span>PROGRESS</span>
              <span>{searchProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 border-2 border-black overflow-hidden">
              <div
                className="bg-violet-400 h-full transition-all duration-500"
                style={{ width: `${searchProgress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="bg-violet-50 border-2 border-black">
              <CardContent className="p-4 text-center">
                <UilBuilding className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-bold uppercase">Directories</p>
                <p className="text-2xl font-black">{searchProgress >= 20 ? '✓' : '...'}</p>
              </CardContent>
            </Card>
            <Card className="bg-violet-50 border-2 border-black">
              <CardContent className="p-4 text-center">
                <UilGlobe className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-bold uppercase">Web</p>
                <p className="text-2xl font-black">{searchProgress >= 40 ? '✓' : '...'}</p>
              </CardContent>
            </Card>
            <Card className="bg-violet-50 border-2 border-black">
              <CardContent className="p-4 text-center">
                <UilDatabase className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-bold uppercase">Database</p>
                <p className="text-2xl font-black">{searchProgress >= 60 ? '✓' : '...'}</p>
              </CardContent>
            </Card>
          </div>

          <PremiumFeatureCard
            title="SPEED UP SEARCHES"
            description="Upgrade to search 10x faster with priority processing"
            features={[
              'Priority search queue',
              'Parallel processing',
              'No rate limits',
              'Real-time results'
            ]}
            currentPlan="basic"
          />
        </div>
      </CardContent>
    </Card>
  );
}