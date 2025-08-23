'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UilBookAlt,
  UilClock,
  UilChartGrowth,
  UilArrowRight,
  UilRocket,
  UilStar,
  UilFileAlt,
  UilLightbulbAlt
} from '@tooni/iconscout-unicons-react';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { Star15 } from '@/components/ui/star';

interface Guide {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  category: string;
  steps: number;
  popular: boolean;
}

const mockGuides: Guide[] = [
  {
    id: '1',
    title: 'COMPLETE SETUP GUIDE FOR YOUR FIRST AGENT',
    description: 'Step-by-step walkthrough to create, configure, and deploy your first AI voice agent from scratch.',
    difficulty: 'beginner',
    estimatedTime: '30 mins',
    category: 'Getting Started',
    steps: 8,
    popular: true
  },
  {
    id: '2',
    title: 'OPTIMIZING CALL SCRIPTS FOR CONVERSION',
    description: 'Learn how to craft compelling scripts that drive results and improve your agent performance metrics.',
    difficulty: 'intermediate',
    estimatedTime: '45 mins',
    category: 'Sales Optimization',
    steps: 12,
    popular: true
  },
  {
    id: '3',
    title: 'ADVANCED VOICE CLONING TECHNIQUES',
    description: 'Master the art of creating natural-sounding voice clones with advanced customization options.',
    difficulty: 'advanced',
    estimatedTime: '60 mins',
    category: 'Voice Technology',
    steps: 15,
    popular: false
  },
  {
    id: '4',
    title: 'INTEGRATING HUNTER FOR LEAD GENERATION',
    description: 'Connect Hunter search capabilities to automatically populate your call lists with qualified leads.',
    difficulty: 'intermediate',
    estimatedTime: '40 mins',
    category: 'Lead Generation',
    steps: 10,
    popular: false
  }
];

export default function GuidesPage() {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState('all');
  const [selectedGuide, setSelectedGuide] = React.useState<string | null>(null);

  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const filteredGuides = selectedDifficulty === 'all' 
    ? mockGuides 
    : mockGuides.filter(guide => guide.difficulty === selectedDifficulty);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  return (
    <div 
      className="min-h-screen bg-cyan-400 relative pb-8" 
      style={{ 
        fontFamily: 'Noyh-Bold, sans-serif',
        backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }}
    >
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-8 pb-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Title Card */}
          <Card className="transform rotate-1 relative overflow-hidden">
            <CardHeader className="relative">
              {/* Decorative elements */}
              <div className="absolute top-2 left-4 w-8 h-8 bg-cyan-600 border-2 border-black flex items-center justify-center">
                <UilBookAlt className="h-4 w-4 text-white" />
              </div>
              <div className="absolute top-2 right-4 w-8 h-8 bg-cyan-500 border-2 border-black flex items-center justify-center">
                <UilLightbulbAlt className="h-4 w-4 text-white" />
              </div>
              <div className="absolute bottom-3 left-6 w-6 h-6 bg-blue-400 border-2 border-black rotate-12">
                <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
              </div>
              <div className="absolute bottom-2 right-8 w-4 h-4 bg-purple-500 border-2 border-black -rotate-12"></div>
              
              {/* Central icon button */}
              <div className="flex justify-center mb-4">
                <Button className="w-20 h-20 bg-cyan-600 hover:bg-cyan-700 border-4 border-black p-0">
                  <UilBookAlt className="h-12 w-12 text-white" />
                </Button>
              </div>
              
              <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                GUIDES
              </CardTitle>
              
              <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
                Step-by-step tutorials to master Diala
              </p>
              
              {/* Animated decorative bars */}
              <div className="flex justify-center items-center mt-3 gap-2">
                <div className="w-3 h-3 bg-cyan-600 animate-pulse"></div>
                <div className="w-2 h-6 bg-black"></div>
                <div className="w-4 h-4 bg-cyan-500 animate-pulse delay-150"></div>
                <div className="w-2 h-8 bg-black"></div>
                <div className="w-3 h-3 bg-cyan-600 animate-pulse delay-300"></div>
              </div>
            </CardHeader>
          </Card>

          {/* Difficulty Filter */}
          <div className="flex flex-wrap gap-2 justify-center">
            {difficulties.map((difficulty) => (
              <Button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`uppercase font-black ${
                  selectedDifficulty === difficulty
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-white hover:bg-gray-100 text-black'
                } border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_rgba(0,0,0,1)]`}
              >
                {difficulty}
              </Button>
            ))}
          </div>

          {/* Popular Guides Section */}
          <Card className="transform -rotate-1 relative overflow-hidden bg-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Button
                  size="icon"
                  variant="default"
                  className="w-12 h-12 flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white border-black"
                >
                  <UilRocket className="h-6 w-6 text-white" />
                </Button>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                    MOST POPULAR GUIDES
                  </h3>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                    Start with these <span className="font-black text-cyan-600">community favorites</span> to get up and running quickly.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockGuides.filter(guide => guide.popular).map((guide) => (
                      <div key={guide.id} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                        <span className="text-black font-medium">{guide.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuides.map((guide, index) => (
              <div key={guide.id} className="relative">
                {selectedGuide === guide.id && (
                  <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" 
                       style={{animation: 'overshoot 0.3s ease-out'}}>
                    <div className="relative">
                      <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                        <Star15 color="#00CED1" size={80} 
                                className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" 
                                stroke="black" strokeWidth={8} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" 
                              style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                          SELECTED
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <Card 
                  className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all transform ${
                    index % 2 === 0 ? 'rotate-1' : '-rotate-1'
                  } ${
                    selectedGuide === guide.id ? 'bg-cyan-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'
                  }`}
                  onClick={() => setSelectedGuide(guide.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-black uppercase text-lg flex-1 pr-2">{guide.title}</h4>
                      {guide.popular && (
                        <Badge className="bg-cyan-500 text-white border-2 border-black flex-shrink-0">
                          <UilStar className="h-3 w-3 mr-1" />
                          POPULAR
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{guide.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={`border-2 ${getDifficultyColor(guide.difficulty)}`}>
                        {guide.difficulty.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <UilClock className="h-3 w-3" />
                          <span className="font-bold">{guide.estimatedTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UilFileAlt className="h-3 w-3" />
                          <span className="font-bold">{guide.steps} steps</span>
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
              </div>
            ))}
          </div>

          {/* Info Box */}
          <Card className="bg-cyan-100 border-2 border-black mt-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Button 
                  size="sm" 
                  variant="neutral" 
                  className="bg-cyan-400 hover:bg-cyan-500 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] flex-shrink-0"
                >
                  <UilChartGrowth className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-sm font-bold">TRACK YOUR PROGRESS</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Complete guides to unlock achievements and gain expertise. Your progress is automatically saved, so you can continue where you left off anytime.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8">
            <OnboardingFooter />
          </div>
        </div>
      </div>
    </div>
  );
}