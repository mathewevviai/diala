'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  UilCog, 
  UilShield, 
  UilDollarAlt, 
  UilStar,
  UilCircle,
  UilSquare,
  UilExchange,
  UilEdit,
  UilCheck,
  UilServer
} from '@tooni/iconscout-unicons-react';

interface ServiceStatus {
  name: string;
  provider: string;
  description: string;
  status: string;
  statusColor: string;
}

interface CostMetric {
  label: string;
  cost: string;
  description: string;
  color: string;
}

interface PremiumFeature {
  name: string;
  status: 'active' | 'premium' | 'limited';
  description: string;
  usage?: {
    current: number;
    total: number;
    percentage: number;
  };
  color: string;
  bgColor: string;
}

interface ComplianceControl {
  name: string;
  description: string;
  enabled: boolean;
}

interface SystemSettingsMonitorProps {
  title?: string;
  bgColor?: string;
  serviceStatuses?: ServiceStatus[];
  costMetrics?: CostMetric[];
  premiumFeatures?: PremiumFeature[];
  complianceControls?: ComplianceControl[];
  callDuration?: number;
  qualityScore?: number;
  complianceStatus?: string;
}

export default function SystemSettingsMonitor({
  title = "SYSTEM CONFIGURATION & MONITORING",
  bgColor = "bg-gray-50",
  serviceStatuses,
  costMetrics,
  premiumFeatures,
  complianceControls,
  callDuration = 263,
  qualityScore = 94,
  complianceStatus = "PASS"
}: SystemSettingsMonitorProps) {
  
  const defaultServiceStatuses: ServiceStatus[] = [
    {
      name: "SIP Provider",
      provider: "Telnyx",
      description: "Voice carrier service",
      status: "Connected",
      statusColor: "text-green-600"
    },
    {
      name: "Speech-to-Text",
      provider: "Deepgram",
      description: "Real-time transcription",
      status: "Streaming",
      statusColor: "text-green-600"
    },
    {
      name: "AI Language Model",
      provider: "OpenAI GPT-4",
      description: "Conversation engine",
      status: "Active",
      statusColor: "text-green-600"
    },
    {
      name: "Text-to-Speech",
      provider: "ElevenLabs",
      description: "Voice synthesis",
      status: "Premium Voice",
      statusColor: "text-green-600"
    },
    {
      name: "Call Recording",
      provider: "AWS S3",
      description: "Storage & compliance",
      status: "Live Recording",
      statusColor: "text-blue-600"
    },
    {
      name: "Analytics Engine",
      provider: "Diala AI",
      description: "Real-time insights",
      status: "Processing",
      statusColor: "text-purple-600"
    }
  ];

  const defaultCostMetrics: CostMetric[] = [
    { label: "PER MINUTE", cost: "$0.0089", description: "SIP Carrier", color: "green" },
    { label: "STT COST", cost: "$0.0043", description: "Deepgram", color: "blue" },
    { label: "AI TOKENS", cost: "$0.0156", description: "OpenAI", color: "purple" },
    { label: "TOTAL/MIN", cost: "$0.0298", description: "All Services", color: "yellow" }
  ];

  const defaultPremiumFeatures: PremiumFeature[] = [
    {
      name: "Advanced AI Coaching",
      status: "active",
      description: "Real-time intervention suggestions",
      usage: { current: 142, total: 180, percentage: 78 },
      color: "green",
      bgColor: "bg-green-50"
    },
    {
      name: "Call Recording",
      status: "premium",
      description: "High-quality audio storage",
      usage: { current: 3200, total: 10000, percentage: 34 },
      color: "blue",
      bgColor: "bg-blue-50"
    },
    {
      name: "Sentiment Analysis",
      status: "active",
      description: "Real-time emotion detection",
      usage: { current: 4560, total: 5000, percentage: 91 },
      color: "purple",
      bgColor: "bg-purple-50"
    },
    {
      name: "Call Transfer",
      status: "limited",
      description: "Supervisor call takeover",
      color: "gray",
      bgColor: "bg-gray-50"
    }
  ];

  const defaultComplianceControls: ComplianceControl[] = [
    { name: "Auto-Recording", description: "All calls recorded by default", enabled: true },
    { name: "Compliance Mode", description: "GDPR/CCPA data protection", enabled: true },
    { name: "Quality Alerts", description: "Real-time performance warnings", enabled: true }
  ];

  const displayServiceStatuses = serviceStatuses || defaultServiceStatuses;
  const displayCostMetrics = costMetrics || defaultCostMetrics;
  const displayPremiumFeatures = premiumFeatures || defaultPremiumFeatures;
  const displayComplianceControls = complianceControls || defaultComplianceControls;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${bgColor} p-6 border-2 sm:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_rgba(0,0,0,1)]`}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="header" size="header" className="bg-gray-400">
          <UilCog className="h-5 w-5 text-white" />
        </Button>
        <h3 className="font-black uppercase text-lg text-gray-800">{title}</h3>
      </div>
      
      {/* Active Call Infrastructure */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-blue-400">
            <UilServer className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">ACTIVE CALL INFRASTRUCTURE</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            {displayServiceStatuses.slice(0, 3).map((service, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
                <div>
                  <div className="font-bold text-sm">{service.name}</div>
                  <div className="text-xs text-gray-600">{service.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm">{service.provider}</div>
                  <div className={`text-xs ${service.statusColor}`}>✓ {service.status}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {displayServiceStatuses.slice(3).map((service, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
                <div>
                  <div className="font-bold text-sm">{service.name}</div>
                  <div className="text-xs text-gray-600">{service.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm">{service.provider}</div>
                  <div className={`text-xs ${service.statusColor}`}>✓ {service.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Call Cost Breakdown */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-green-400">
            <UilDollarAlt className="h-3 w-3 text-black" />
          </Button>
          <div className="font-black text-sm">LIVE CALL COST BREAKDOWN</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {displayCostMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className={`text-lg font-black text-${metric.color}-600`}>{metric.cost}</div>
              <div className="text-xs text-gray-600 font-bold">{metric.label}</div>
              <div className="text-xs text-gray-500">{metric.description}</div>
            </div>
          ))}
        </div>
        
        <div className="p-3 bg-yellow-50 border-2 border-yellow-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">Current Call Cost</div>
              <div className="text-xs text-gray-600">Duration: {formatDuration(callDuration)}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-green-600">${(callDuration * 0.0298 / 60).toFixed(4)}</div>
              <div className="text-xs text-gray-600">Running Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Features & Usage */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-purple-400">
            <UilStar className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">PREMIUM FEATURES & USAGE</div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayPremiumFeatures.map((feature, index) => (
              <div key={index} className={cn("p-3 border-2", `${feature.bgColor} border-${feature.color}-300`)}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-bold text-sm text-${feature.color}-800`}>{feature.name}</span>
                  <span className={cn(
                    "px-2 py-1 border border-black text-xs font-bold uppercase",
                    feature.status === 'active' ? `bg-${feature.color}-400 text-black` :
                    feature.status === 'premium' ? `bg-${feature.color}-400 text-white` :
                    "bg-gray-400 text-white"
                  )}>
                    {feature.status.toUpperCase()}
                  </span>
                </div>
                <div className={`text-xs text-${feature.color}-700`}>{feature.description}</div>
                {feature.usage ? (
                  <div className="mt-2">
                    <div className={`w-full bg-${feature.color}-200 border border-${feature.color}-400 h-2`}>
                      <div className={`h-full bg-${feature.color}-400`} style={{ width: `${feature.usage.percentage}%` }}></div>
                    </div>
                    <div className={`text-xs text-${feature.color}-600 mt-1`}>
                      {feature.name === 'Call Recording' 
                        ? `${(feature.usage.current/1000).toFixed(1)}GB/${feature.usage.total/1000}GB monthly limit`
                        : `${feature.usage.current}/${feature.usage.total} ${feature.name.includes('Coaching') ? 'coaching events' : 'API calls'} used`
                      }
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <button className="w-full px-3 py-2 bg-yellow-400 border-2 border-black font-bold text-xs hover:bg-yellow-500">
                      UPGRADE FOR UNLIMITED TRANSFERS
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quality & Compliance Controls */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-cyan-400">
            <UilShield className="h-3 w-3 text-black" />
          </Button>
          <div className="font-black text-sm">QUALITY & COMPLIANCE CONTROLS</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            {displayComplianceControls.map((control, index) => (
              <div key={index} className="flex items-center justify-between p-3 border-2 border-black">
                <div>
                  <div className="font-bold text-sm">{control.name}</div>
                  <div className="text-xs text-gray-600">{control.description}</div>
                </div>
                <div className={cn(
                  "w-10 h-6 border-2 border-black relative",
                  control.enabled ? "bg-green-400" : "bg-gray-300"
                )}>
                  <div className={cn(
                    "absolute top-0.5 w-4 h-4 bg-white border border-black transition-all",
                    control.enabled ? "right-0.5" : "left-0.5"
                  )}></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border-2 border-blue-300">
              <div className="font-bold text-sm text-blue-800 mb-2">Call Quality Score</div>
              <div className="text-2xl font-black text-blue-600">{qualityScore}/100</div>
              <div className="text-xs text-blue-700">Excellent performance</div>
            </div>
            
            <div className="p-3 bg-green-50 border-2 border-green-300">
              <div className="font-bold text-sm text-green-800 mb-2">Compliance Status</div>
              <div className="text-2xl font-black text-green-600">✓ {complianceStatus}</div>
              <div className="text-xs text-green-700">All regulations met</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Emergency Controls */}
      <div className="bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="subheader" size="icon" className="bg-red-400">
            <UilShield className="h-3 w-3 text-white" />
          </Button>
          <div className="font-black text-sm">SYSTEM EMERGENCY CONTROLS</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-red-400 text-white">
            <UilSquare className="h-4 w-4 mr-2" />
            EMERGENCY STOP
          </Button>
          <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-yellow-400 text-black">
            <UilCircle className="h-4 w-4 mr-2" />
            PAUSE AI
          </Button>
          <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-blue-400 text-white">
            <UilExchange className="h-4 w-4 mr-2" />
            FORCE TRANSFER
          </Button>
          <Button size="sm" variant="reverse" style={{ outline: 'none' }} className="bg-purple-400 text-white">
            <UilEdit className="h-4 w-4 mr-2" />
            INCIDENT LOG
          </Button>
        </div>
      </div>
    </div>
  );
}