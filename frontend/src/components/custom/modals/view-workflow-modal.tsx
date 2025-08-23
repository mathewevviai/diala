import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  UilTimes, 
  UilCheckCircle,
  UilClock,
  UilSearchAlt,
  UilBuilding,
  UilMapMarker,
  UilFilter,
  UilLinkedin,
  UilFileExport,
  UilDatabase,
  UilGlobe,
  UilUsersAlt,
  UilLink,
  UilExclamationTriangle
} from '@tooni/iconscout-unicons-react';

interface SearchWorkflow {
  id: string;
  name: string;
  status: 'idle' | 'searching' | 'scraping' | 'analyzing' | 'validating' | 'completed' | 'failed';
  progress: number;
  parameters: {
    location: string;
    businessType: string;
    keywords: string[];
    includeLinkedIn: boolean;
    searchDepth: number;
  };
  stats: {
    pagesFound: number;
    pagesScraped: number;
    businessesExtracted: number;
    businessesValidated: number;
    matchRate: number;
  };
  createdAt: string;
  completedAt?: string;
  estimatedTime?: string;
}

interface ViewWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: SearchWorkflow | null;
  onExport?: (format: 'csv' | 'crm') => void;
}

export default function ViewWorkflowModal({ isOpen, onClose, workflow, onExport }: ViewWorkflowModalProps) {
  if (!isOpen || !workflow) return null;

  const getStatusColor = (status: SearchWorkflow['status']) => {
    switch (status) {
      case 'idle': return 'bg-gray-100 text-gray-700 border-gray-400';
      case 'searching': return 'bg-blue-100 text-blue-700 border-blue-400';
      case 'scraping': return 'bg-yellow-100 text-yellow-700 border-yellow-400';
      case 'analyzing': return 'bg-purple-100 text-purple-700 border-purple-400';
      case 'validating': return 'bg-orange-100 text-orange-700 border-orange-400';
      case 'completed': return 'bg-green-100 text-green-700 border-green-400';
      case 'failed': return 'bg-red-100 text-red-700 border-red-400';
    }
  };

  const getStatusIcon = (status: SearchWorkflow['status']) => {
    switch (status) {
      case 'idle': return <UilClock className="w-5 h-5" />;
      case 'searching': return <UilSearchAlt className="w-5 h-5 animate-pulse" />;
      case 'scraping': return <UilLink className="w-5 h-5 animate-pulse" />;
      case 'analyzing': return <UilDatabase className="w-5 h-5 animate-pulse" />;
      case 'validating': return <UilCheckCircle className="w-5 h-5 animate-pulse" />;
      case 'completed': return <UilCheckCircle className="w-5 h-5" />;
      case 'failed': return <UilExclamationTriangle className="w-5 h-5" />;
    }
  };

  const getWorkflowSteps = () => {
    const steps = [
      { name: 'Search Pages', status: workflow.progress >= 0, progress: Math.min(workflow.progress, 20) },
      { name: 'Scrape Data', status: workflow.progress >= 25, progress: Math.min(Math.max(workflow.progress - 20, 0), 25) },
      { name: 'Analyze Content', status: workflow.progress >= 50, progress: Math.min(Math.max(workflow.progress - 45, 0), 25) },
      { name: 'Validate Results', status: workflow.progress >= 75, progress: Math.min(Math.max(workflow.progress - 70, 0), 25) },
      { name: 'Complete', status: workflow.progress === 100, progress: workflow.progress === 100 ? 5 : 0 }
    ];
    return steps;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-background max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b-4 border-black bg-[rgb(0,82,255)] relative sticky top-0 z-10">
          <CardTitle className="text-2xl font-black uppercase text-white pr-10" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            WORKFLOW DETAILS - {workflow.name}
          </CardTitle>
          <Button
            variant="neutral"
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <UilTimes className="h-5 w-5 text-black" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 border-2 border-black ${getStatusColor(workflow.status).split(' ')[0]}`}>
                    {getStatusIcon(workflow.status)}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-gray-600">Status</p>
                    <Badge className={`border-2 border-black font-bold uppercase ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-400 border-2 border-black">
                    <UilClock className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-gray-600">Progress</p>
                    <p className="text-2xl font-black text-black">{workflow.progress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-400 border-2 border-black">
                    <UilBuilding className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-gray-600">Businesses Found</p>
                    <p className="text-2xl font-black text-black">{workflow.stats.businessesExtracted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Steps */}
          <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <CardHeader className="border-b-4 border-black bg-yellow-50">
              <CardTitle className="text-lg font-black uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Workflow Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {getWorkflowSteps().map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 border-4 border-black flex items-center justify-center font-bold text-sm
                      ${step.status ? 'bg-[rgb(0,82,255)] text-white shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'bg-gray-300 text-gray-600'}
                    `}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm uppercase">{step.name}</p>
                      <Progress value={step.progress} className="h-2 border-2 border-black mt-1" />
                    </div>
                    <div className="text-sm font-bold">
                      {step.status ? '✓' : '○'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Parameters */}
          <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <CardHeader className="border-b-4 border-black bg-blue-50">
              <CardTitle className="text-lg font-black uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Search Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <UilMapMarker className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">Location</p>
                      <p className="font-bold">{workflow.parameters.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <UilBuilding className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">Business Type</p>
                      <p className="font-bold">{workflow.parameters.businessType}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <UilSearchAlt className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">Search Depth</p>
                      <p className="font-bold">{workflow.parameters.searchDepth} levels</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <UilLinkedin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">LinkedIn Integration</p>
                      <Badge className={`border-2 border-black ${workflow.parameters.includeLinkedIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {workflow.parameters.includeLinkedIn ? 'ENABLED' : 'DISABLED'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <UilFilter className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">Keywords</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {workflow.parameters.keywords.map((keyword) => (
                          <Badge key={keyword} className="border-2 border-black bg-white text-black">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <CardHeader className="border-b-4 border-black bg-green-50">
              <CardTitle className="text-lg font-black uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Statistics & Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <UilGlobe className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-xs font-black uppercase text-gray-600">Pages Found</p>
                  <p className="text-2xl font-black text-black">{workflow.stats.pagesFound.toLocaleString()}</p>
                </div>
                
                <div className="p-4 bg-yellow-50 border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <UilLink className="w-6 h-6 text-yellow-600 mb-2" />
                  <p className="text-xs font-black uppercase text-gray-600">Pages Scraped</p>
                  <p className="text-2xl font-black text-black">{workflow.stats.pagesScraped.toLocaleString()}</p>
                </div>
                
                <div className="p-4 bg-purple-50 border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <UilBuilding className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-xs font-black uppercase text-gray-600">Businesses</p>
                  <p className="text-2xl font-black text-black">{workflow.stats.businessesExtracted}</p>
                </div>
                
                <div className="p-4 bg-green-50 border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <UilCheckCircle className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-xs font-black uppercase text-gray-600">Match Rate</p>
                  <p className="text-2xl font-black text-green-600">{workflow.stats.matchRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <CardHeader className="border-b-4 border-black bg-orange-50">
              <CardTitle className="text-lg font-black uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 border-2 border-black">
                  <div className="w-3 h-3 bg-[rgb(0,82,255)] border-2 border-black"></div>
                  <div className="flex-1">
                    <p className="font-bold">Workflow Started</p>
                    <p className="text-sm text-gray-600">{new Date(workflow.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                {workflow.completedAt && (
                  <div className="flex items-center gap-4 p-3 bg-gray-50 border-2 border-black">
                    <div className="w-3 h-3 bg-green-500 border-2 border-black"></div>
                    <div className="flex-1">
                      <p className="font-bold">Workflow Completed</p>
                      <p className="text-sm text-gray-600">{new Date(workflow.completedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {workflow.estimatedTime && workflow.status !== 'completed' && (
                  <div className="flex items-center gap-4 p-3 bg-yellow-50 border-2 border-black">
                    <div className="w-3 h-3 bg-yellow-500 border-2 border-black"></div>
                    <div className="flex-1">
                      <p className="font-bold">Estimated Completion</p>
                      <p className="text-sm text-gray-600">{workflow.estimatedTime}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          {workflow.status === 'completed' && onExport && (
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => onExport('csv')}
                className="flex-1"
                style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
              >
                <UilFileExport className="w-5 h-5 mr-2" />
                EXPORT TO CSV
              </Button>
              <Button 
                onClick={() => onExport('crm')}
                variant="neutral"
                className="flex-1"
                style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
              >
                <UilDatabase className="w-5 h-5 mr-2" />
                EXPORT TO CRM
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}