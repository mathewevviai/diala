'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import StatCard from '@/components/custom/stat-card';
import { cn } from '@/lib/utils';
import { 
  UilChart,
  UilArrowGrowth,
  UilArrowDown,
  UilPhone,
  UilClock,
  UilCheckCircle,
  UilTimesCircle,
  UilCalendarAlt,
  UilExport,
  UilFilter,
  UilSmile
} from '@tooni/iconscout-unicons-react';

// Mock data for charts
const callVolumeData = [
  { day: 'Mon', calls: 145 },
  { day: 'Tue', calls: 182 },
  { day: 'Wed', calls: 168 },
  { day: 'Thu', calls: 195 },
  { day: 'Fri', calls: 210 },
  { day: 'Sat', calls: 98 },
  { day: 'Sun', calls: 65 }
];

const agentPerformance = [
  { agent: 'Diala-Tone', success: 92, calls: 245 },
  { agent: 'Echo-Diala', success: 88, calls: 198 },
  { agent: 'Voice-Diala', success: 95, calls: 312 },
  { agent: 'Diala-Belle', success: 90, calls: 156 }
];

const sentimentData = {
  positive: 68,
  neutral: 24,
  negative: 8
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState('week');
  const maxCalls = Math.max(...callVolumeData.map(d => d.calls));

  return (
    <div className="h-full overflow-y-auto space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase">Voice Analytics</h1>
          <p className="text-gray-600 font-bold">Performance insights and call metrics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border-2 border-black font-bold focus:outline-none"
          >
            <option value="today">TODAY</option>
            <option value="week">THIS WEEK</option>
            <option value="month">THIS MONTH</option>
            <option value="year">THIS YEAR</option>
          </select>
          <Button 
            variant="neutral" 
            className="font-bold uppercase"
          >
            <UilFilter className="h-4 w-4 mr-2" />
            FILTER
          </Button>
          <Button 
            variant="default"
            className="font-black uppercase"
          >
            <UilExport className="h-4 w-4 mr-2" />
            EXPORT
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="TOTAL CALLS"
          value="1,063"
          icon={<UilPhone className="h-5 w-5 text-white" />}
          iconBgColor="bg-purple-600"
          bgGradient="from-purple-50 to-purple-100"
          trend={{
            type: 'positive',
            value: '+23%',
            label: 'vs last week'
          }}
        />

        <StatCard
          title="SUCCESS RATE"
          value="91.2%"
          icon={<UilCheckCircle className="h-5 w-5 text-white" />}
          iconBgColor="bg-green-600"
          bgGradient="from-green-50 to-green-100"
          trend={{
            type: 'positive',
            value: '+2.5%',
            label: 'improvement'
          }}
        />

        <StatCard
          title="AVG DURATION"
          value="6:48"
          icon={<UilClock className="h-5 w-5 text-white" />}
          iconBgColor="bg-orange-600"
          bgGradient="from-orange-50 to-orange-100"
          subtitle="MINUTES"
          trend={{
            type: 'neutral',
            value: '-0:32',
            label: 'optimized'
          }}
        />

        <StatCard
          title="SATISFACTION"
          value="4.7/5"
          icon={<UilSmile className="h-5 w-5 text-white" />}
          iconBgColor="bg-pink-600"
          bgGradient="from-pink-50 to-pink-100"
          subtitle="Customer rating"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Volume Chart */}
        <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] lg:col-span-2">
          <CardHeader className="border-b-4 border-black bg-pink-300">
            <CardTitle className="text-xl font-black uppercase">CALL VOLUME</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {callVolumeData.map((day) => (
                <div key={day.day} className="flex items-center gap-4">
                  <span className="w-12 text-sm font-black uppercase">{day.day}</span>
                  <div className="flex-1 relative">
                    <div className="h-8 bg-gray-200 border-2 border-black">
                      <div 
                        className="h-full bg-[rgb(0,82,255)] border-r-2 border-black"
                        style={{ width: `${(day.calls / maxCalls) * 100}%` }}
                      />
                    </div>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold">
                      {day.calls}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
          <CardHeader className="border-b-4 border-black bg-pink-300">
            <CardTitle className="text-xl font-black uppercase">SENTIMENT</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold uppercase flex items-center gap-2">
                    <span className="text-2xl">😊</span> POSITIVE
                  </span>
                  <span className="font-black">{sentimentData.positive}%</span>
                </div>
                <Progress 
                  value={sentimentData.positive} 
                  className="h-4 border-2 border-black bg-gray-200"
                  style={{ 
                    '--progress-color': '#22c55e'
                  } as React.CSSProperties}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold uppercase flex items-center gap-2">
                    <span className="text-2xl">😐</span> NEUTRAL
                  </span>
                  <span className="font-black">{sentimentData.neutral}%</span>
                </div>
                <Progress 
                  value={sentimentData.neutral} 
                  className="h-4 border-2 border-black bg-gray-200"
                  style={{ 
                    '--progress-color': '#6b7280'
                  } as React.CSSProperties}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold uppercase flex items-center gap-2">
                    <span className="text-2xl">😞</span> NEGATIVE
                  </span>
                  <span className="font-black">{sentimentData.negative}%</span>
                </div>
                <Progress 
                  value={sentimentData.negative} 
                  className="h-4 border-2 border-black bg-gray-200"
                  style={{ 
                    '--progress-color': '#ef4444'
                  } as React.CSSProperties}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance */}
      <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
        <CardHeader className="border-b-4 border-black bg-pink-300">
          <CardTitle className="text-xl font-black uppercase">AGENT PERFORMANCE</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agentPerformance.map((agent) => (
              <Card 
                key={agent.agent} 
                className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]"
              >
                <CardContent className="pt-4">
                  <h4 className="font-black uppercase mb-3">{agent.agent}</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="font-black">{agent.success}%</span>
                      </div>
                      <Progress 
                        value={agent.success} 
                        className="h-2 border-2 border-black"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-gray-600">Total Calls</span>
                      <span className="font-black">{agent.calls}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}