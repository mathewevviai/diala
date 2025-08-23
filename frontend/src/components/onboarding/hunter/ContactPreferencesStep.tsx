'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  UilArrowRight,
  UilArrowLeft,
  UilEnvelope,
  UilPhone
} from '@tooni/iconscout-unicons-react';
import { StepProps } from './types';
import PremiumFeatureCard from '@/components/custom/premium-feature-card';

export function ContactPreferencesStep({
  contactPreferences,
  setContactPreferences,
  setCurrentStep
}: StepProps) {
  return (
    <Card className="transform -rotate-1 relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            CONTACT PREFERENCES
          </h1>
        </div>
        <p className="text-xl text-center text-gray-700 mb-8">
          Select what contact information to include
        </p>
        <div className="space-y-6">
          <Card className="border-2 border-black bg-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="header" className="w-12 h-12 bg-blue-500">
                    <UilEnvelope className="h-6 w-6 text-white" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-black uppercase">EMAIL ADDRESSES</h3>
                    <p className="text-sm text-gray-600">Include verified business emails</p>
                  </div>
                </div>
                <Switch
                  checked={contactPreferences.includeEmails}
                  onCheckedChange={(checked) => 
                    setContactPreferences({...contactPreferences, includeEmails: checked})
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black bg-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="header" className="w-12 h-12 bg-green-500">
                    <UilPhone className="h-6 w-6 text-white" />
                  </Button>
                  <div>
                    <h3 className="text-lg font-black uppercase">PHONE NUMBERS</h3>
                    <p className="text-sm text-gray-600">Include direct dial and mobile numbers</p>
                  </div>
                </div>
                <Switch
                  checked={contactPreferences.includePhones}
                  onCheckedChange={(checked) => 
                    setContactPreferences({...contactPreferences, includePhones: checked})
                  }
                />
              </div>
            </CardContent>
          </Card>

          <PremiumFeatureCard
            title="LINKEDIN INTEGRATION"
            description="Access LinkedIn profiles and advanced social selling features"
            features={[
              'LinkedIn profile URLs and data',
              'Connection degree insights',
              'Recent LinkedIn activity',
              'Shared connections',
              'InMail credits included'
            ]}
            currentPlan="basic"
          />

          <PremiumFeatureCard
            title="ADVANCED ENRICHMENT"
            description="Get even more valuable data about your leads"
            features={[
              'Email verification and deliverability checks',
              'Social media profiles (Twitter, Facebook)',
              'Personal mobile numbers',
              'Technology stack used by company',
              'Recent news and triggers',
              'Buying intent signals'
            ]}
            currentPlan="basic"
          />

          <div className="flex gap-4">
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-gray-300 hover:bg-gray-400 text-black"
              onClick={() => setCurrentStep(2.75)}
            >
              <UilArrowLeft className="mr-2 h-6 w-6" />
              BACK
            </Button>
            <Button
              className="flex-1 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
              onClick={() => setCurrentStep(3.5)}
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