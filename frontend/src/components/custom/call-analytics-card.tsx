'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UilChart, UilCommentAltMessage, UilExclamationTriangle, UilCheckCircle } from '@tooni/iconscout-unicons-react';
import { EnhancedCall } from '@/types/calls';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CallAnalyticsCardProps {
  analytics: CallAnalytics;
}

export default function CallAnalyticsCard({ analytics }: CallAnalyticsCardProps) {
  return (
    <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
      <CardHeader className="border-b-4 border-black bg-cyan-400">
        <div className="flex items-center gap-3">
          <UilChart className="h-6 w-6 text-white" />
          <CardTitle className="text-xl font-black uppercase text-white">CALL ANALYTICS</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Sentiment Analysis */}
        <div>
          <h3 className="text-sm font-black uppercase text-gray-600 mb-2">Sentiment Analysis</h3>
          <Card className="border-2 border-black bg-cyan-50">
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={analytics.sentimentHistory}>
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                  />
                  <YAxis 
                    domain={[-100, 100]}
                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#000" 
                    strokeWidth={2}
                    dot={{ fill: '#000', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Talk Ratio */}
        <div>
          <h3 className="text-sm font-black uppercase text-gray-600 mb-2">Talk Ratio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-black bg-cyan-50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black uppercase text-gray-600">Agent</span>
                    <span className="font-black">{analytics.talkRatio.agent}%</span>
                  </div>
                  <Progress value={analytics.talkRatio.agent} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-black bg-cyan-50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black uppercase text-gray-600">Customer</span>
                    <span className="font-black">{analytics.talkRatio.customer}%</span>
                  </div>
                  <Progress value={analytics.talkRatio.customer} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Keywords & Insights */}
        <div>
          <h3 className="text-sm font-black uppercase text-gray-600 mb-2">Keywords & Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-black bg-cyan-50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <span className="text-sm font-black uppercase text-gray-600 block">Keywords Detected</span>
                  <div className="flex flex-wrap gap-1">
                    {analytics.keywordsDetected.map((keyword, index) => (
                      <Badge key={index} className="font-black uppercase border-2 border-black bg-blue-100 text-blue-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-black bg-cyan-50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <span className="text-sm font-black uppercase text-gray-600 block">Objections Raised</span>
                  <div className="flex flex-wrap gap-1">
                    {analytics.objectionsRaised.map((objection, index) => (
                      <Badge key={index} className="font-black uppercase border-2 border-black bg-red-100 text-red-800">
                        {objection}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-black bg-cyan-50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <span className="text-sm font-black uppercase text-gray-600 block">Commitments Made</span>
                  <div className="flex flex-wrap gap-1">
                    {analytics.commitmentsMade.map((commitment, index) => (
                      <Badge key={index} className="font-black uppercase border-2 border-black bg-green-100 text-green-800">
                        {commitment}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <div>
          <h3 className="text-sm font-black uppercase text-gray-600 mb-2">Next Steps</h3>
          <Card className="border-2 border-black bg-cyan-50">
            <CardContent className="p-3">
              <div className="space-y-2">
                {analytics.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <UilCheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}