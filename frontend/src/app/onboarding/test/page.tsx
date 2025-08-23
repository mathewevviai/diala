'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TwitchTestimonials from '@/components/onboarding/TwitchTestimonials';

export default function TestOnboardingPage() {
  const items = React.useMemo(() => Array.from({ length: 9 }), []);

  return (
    <div
      className="min-h-screen bg-orange-500 relative pb-8"
      style={{
        fontFamily: 'Noyh-Bold, sans-serif',
        backgroundImage:
          'linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}
    >
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-8 pb-8">
        <div className="w-full max-w-4xl space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {items.map((_, index) => (
              <Card key={index} className="border-4 border-black bg-white">
                <CardContent className="p-4">
                  <TwitchTestimonials url="" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
