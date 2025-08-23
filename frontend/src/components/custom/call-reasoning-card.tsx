'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CallReasoning } from '@/types/calls';
import {
  UilBrain,
  UilCommentAltNotes,
  UilExclamationTriangle,
  UilLightbulbAlt,
  UilChartLine,
  UilSmile,
  UilMeh,
  UilFrown,
  UilConfused
} from '@tooni/iconscout-unicons-react';
import { EnhancedCall } from '@/types/calls';

interface CallReasoningCardProps {
  reasoning: CallReasoning;
}

export default function CallReasoningCard({ reasoning }: CallReasoningCardProps) {
  const moodIcons = {
    positive: <UilSmile className="h-5 w-5 text-green-500" />,
    neutral: <UilMeh className="h-5 w-5 text-gray-500" />,
    negative: <UilFrown className="h-5 w-5 text-red-500" />,
    confused: <UilConfused className="h-5 w-5 text-yellow-500" />
  };

  return (
    <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
      <CardHeader className="border-b-4 border-black bg-violet-400">
        <div className="flex items-center gap-3">
          <UilBrain className="h-6 w-6 text-white" />
          <CardTitle className="text-xl font-black uppercase text-white">AI REASONING</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Current Objective */}
        <div>
          <h3 className="text-sm font-black uppercase text-gray-600 mb-2">Current Objective</h3>
          <Card className="border-2 border-black bg-violet-50">
            <CardContent className="p-3">
              <p className="font-medium">{reasoning.currentObjective}</p>
            </CardContent>
          </Card>
        </div>

        {/* Next Points */}
        <div>
          <h3 className="text-sm font-black uppercase text-gray-600 mb-2">Next Points</h3>
          <div className="space-y-2">
            {reasoning.nextPoints.map((point, index) => (
              <Card key={index} className="border-2 border-black bg-violet-50">
                <CardContent className="p-3">
                  <p className="font-medium">{point}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Context Analysis */}
        <div>
          <h3 className="text-sm font-black uppercase text-gray-600 mb-2">Context Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-black bg-violet-50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black uppercase text-gray-600">Customer Mood</span>
                    <Badge className={cn(
                      "font-black uppercase border-2 border-black",
                      reasoning.contextAnalysis.customerMood === 'positive' && "bg-green-400 text-black",
                      reasoning.contextAnalysis.customerMood === 'neutral' && "bg-yellow-400 text-black",
                      reasoning.contextAnalysis.customerMood === 'negative' && "bg-red-400 text-black"
                    )}>
                      {reasoning.contextAnalysis.customerMood.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black uppercase text-gray-600">Engagement</span>
                    <span className="font-black">{reasoning.contextAnalysis.engagementLevel}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-black bg-violet-50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-black uppercase text-gray-600 block mb-1">Objections</span>
                    <div className="flex flex-wrap gap-1">
                      {reasoning.contextAnalysis.objections.map((objection, index) => (
                        <Badge key={index} className="font-black uppercase border-2 border-black bg-red-100 text-red-800">
                          {objection}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-black uppercase text-gray-600 block mb-1">Interests</span>
                    <div className="flex flex-wrap gap-1">
                      {reasoning.contextAnalysis.interests.map((interest, index) => (
                        <Badge key={index} className="font-black uppercase border-2 border-black bg-green-100 text-green-800">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Suggested Responses */}
        <div>
          <h3 className="text-sm font-black uppercase text-gray-600 mb-2">Suggested Responses</h3>
          <div className="space-y-4">
            <Card className="border-2 border-black bg-violet-50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <span className="text-sm font-black uppercase text-gray-600 block">Primary Response</span>
                  <p className="font-medium">{reasoning.suggestedResponses.primary}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <span className="text-sm font-black uppercase text-gray-600 block">Alternative Responses</span>
              {reasoning.suggestedResponses.alternatives.map((response, index) => (
                <Card key={index} className="border-2 border-black bg-violet-50">
                  <CardContent className="p-3">
                    <p className="font-medium">{response}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}