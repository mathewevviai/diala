import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UilClock,
  UilUser,
  UilArrowRight
} from '@tooni/iconscout-unicons-react';

interface BlogCardProps {
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  category: string;
  date: string;
  selected?: boolean;
  onClick?: () => void;
}

export function BlogCard({
  title,
  excerpt,
  author,
  readTime,
  category,
  date,
  selected = false,
  onClick
}: BlogCardProps) {
  return (
    <Card 
      className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${
        selected ? 'bg-yellow-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <h4 className="font-black uppercase text-lg mb-2">{title}</h4>
        <p className="text-sm text-gray-600 mb-4">{excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold">{author}</span>
            <span className="text-gray-500">•</span>
            <span>{readTime}</span>
          </div>
          <Button 
            size="sm" 
            variant="neutral" 
            className="bg-yellow-400 hover:bg-yellow-500 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]"
          >
            <UilArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}