import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UilClock,
  UilFileAlt,
  UilArrowRight,
  UilStar
} from '@tooni/iconscout-unicons-react';

interface GuideCardProps {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  steps: number;
  popular?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function GuideCard({
  title,
  description,
  difficulty,
  estimatedTime,
  steps,
  popular = false,
  selected = false,
  onClick
}: GuideCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  return (
    <Card 
      className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
        selected ? 'bg-cyan-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-black uppercase text-lg flex-1 pr-2">{title}</h4>
          {popular && (
            <Badge className="bg-cyan-500 text-white border-2 border-black flex-shrink-0">
              <UilStar className="h-3 w-3 mr-1" />
              POPULAR
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <div className="flex items-center justify-between mb-4">
          <Badge className={`border-2 ${getDifficultyColor(difficulty)}`}>
            {difficulty.toUpperCase()}
          </Badge>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <UilClock className="h-3 w-3" />
              <span className="font-bold">{estimatedTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <UilFileAlt className="h-3 w-3" />
              <span className="font-bold">{steps} steps</span>
            </div>
          </div>
        </div>
        <Button 
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_rgba(0,0,0,1)]"
        >
          START GUIDE
          <UilArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}