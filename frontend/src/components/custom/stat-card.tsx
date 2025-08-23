import * as React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { UilArrowUp, UilArrowDown } from '@tooni/iconscout-unicons-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  trend?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
    label: string;
  };
  subtitle?: string;
  progress?: number | {
    label: string;
    value: number;
  };
  status?: {
    label: string;
    color: string;
  };
  bgGradient?: string;
  textColor?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  iconBgColor = 'bg-[rgb(0,82,255)]',
  trend,
  subtitle,
  progress,
  status,
  bgGradient = 'from-white to-gray-50',
  textColor = 'text-black'
}: StatCardProps) {
  const getTrendColor = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-blue-600';
    }
  };

  let finalBgClass = `bg-gradient-to-br ${bgGradient}`;
  let finalTextColor = textColor;

  if (bgGradient === 'from-white to-gray-50') {
    const colorMatch = iconBgColor.match(/bg-([a-z]+)-(\d+)/);
    if (colorMatch) {
      const color = colorMatch[1];
      finalBgClass = `bg-${color}-50`;
      finalTextColor = 'text-black';
    }
  }

  const progressValue = progress !== undefined ? (typeof progress === 'number' ? progress : progress.value) : undefined;
  const progressLabel = progress && typeof progress === 'object' ? progress.label : 'Progress';

  return (
    <Card className={cn("border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]", finalBgClass, finalTextColor)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              size="icon"
              variant="default"
              className={cn(
                "w-12 h-12 border-4 border-black",
                iconBgColor
              )}
            >
              {icon}
            </Button>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold">{value}</h3>
                {trend && (
                  <div className={`flex items-center gap-1 text-sm ${getTrendColor(trend.type)}`}>
                    {trend.type === 'positive' ? (
                      <UilArrowUp className="h-4 w-4" />
                    ) : (
                      <UilArrowDown className="h-4 w-4" />
                    )}
                    <span>{trend.value}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {status && (
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 ${status.color}`} />
              <span className="text-sm text-muted-foreground">{status.label}</span>
            </div>
          )}
        </div>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        )}
        {progressValue !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{progressLabel}</span>
              <span className="text-sm text-muted-foreground">{progressValue}%</span>
            </div>
            <div className="h-2 bg-gray-100 border-2 border-black">
              <div
                className={cn("h-full", iconBgColor)}
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}