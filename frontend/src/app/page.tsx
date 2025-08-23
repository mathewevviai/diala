'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UilMicrophone, UilDatabase, UilFileAlt, UilSearch, UilCrosshair } from '@tooni/iconscout-unicons-react';

export default function Home() {
  const router = useRouter();

  const onboardingPaths = [
    {
      id: 'voice',
      title: 'VOICE AGENT',
      description: 'Set up AI-powered voice conversations with realistic background sounds',
      icon: UilMicrophone,
      color: 'bg-[rgb(0,82,255)]',
      path: '/onboarding/voice'
    },
    {
      id: 'rag',
      title: 'RAG SYSTEM',
      description: 'Configure Retrieval-Augmented Generation for custom knowledge bases',
      icon: UilDatabase,
      color: 'bg-yellow-400',
      path: '/onboarding/rag'
    },
    {
      id: 'transcripts',
      title: 'TRANSCRIPTS',
      description: 'Manage call recordings and conversation transcripts',
      icon: UilFileAlt,
      color: 'bg-pink-400',
      path: '/onboarding/transcripts'
    },
    {
      id: 'hunter',
      title: 'HUNTER',
      description: 'Intelligent prospect search and automated outreach',
      icon: UilCrosshair,
      color: 'bg-violet-400',
      path: '/onboarding/hunter'
    }
  ];

  return (
    <div className="min-h-screen bg-[rgb(0,82,255)] flex items-center justify-center p-4" style={{ 
      fontFamily: 'Noyh-Bold, sans-serif',
      backgroundImage: `
        linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px'
    }}>
      <div className="w-full max-w-6xl">
        <Card className="mb-8 transform -rotate-1">
          <CardHeader>
            <CardTitle className="text-6xl md:text-7xl font-black uppercase text-center text-black">
              CHOOSE YOUR PATH
            </CardTitle>
            <p className="text-xl text-center text-gray-700 mt-4">
              Select an onboarding experience to get started with Diala
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {onboardingPaths.map((path, index) => {
            const Icon = path.icon;
            return (
              <Card 
                key={path.id}
                className={`transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0 transition-transform cursor-pointer`}
                onClick={() => router.push(path.path)}
              >
                <CardHeader>
                  <div className={`w-16 h-16 ${path.color} border-4 border-black flex items-center justify-center mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-black uppercase text-black mb-2">
                    {path.title}
                  </CardTitle>
                  <p className="text-lg text-gray-700">
                    {path.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full text-lg font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(path.path);
                    }}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}