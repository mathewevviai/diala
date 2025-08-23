import * as React from 'react';
import { Card, CardContent } from '../ui/card';
import { UilLock } from '@tooni/iconscout-unicons-react';

interface PremiumFeatureCardProps {
  title: string;
  description: string;
  price?: string;
  badge?: string;
}

export default function PremiumFeatureCard({ 
  title, 
  description, 
  price = "$39/month",
  badge = "PREMIUM" 
}: PremiumFeatureCardProps) {
  return (
    <Card className="w-full relative overflow-hidden">
      <div className="absolute inset-0 bg-gray-200 opacity-50"></div>
      <CardContent className="p-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-black text-black uppercase flex flex-col sm:flex-row sm:items-center gap-2" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
              <span>{title}</span>
              <span className="px-2 py-1 bg-yellow-400 border-2 border-black text-xs font-bold uppercase w-fit">
                {badge}
              </span>
            </h4>
            <p className="text-sm text-gray-700 mt-2">{description}</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-gray-600 font-bold">{price}</span>
            <div className="w-10 h-10 bg-gray-400 border-4 border-black flex items-center justify-center">
              <UilLock className="h-5 w-5 text-gray-700" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}