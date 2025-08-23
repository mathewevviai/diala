import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { 
  UilTimes, 
  UilBrain,
  UilUpload,
  UilFile,
  UilLink,
  UilRobot,
  UilCheckCircle,
  UilClock,
  UilExclamationTriangle,
  UilYoutube,
  UilDatabase,
  UilFileExport,
  UilChartGrowth,
  UilSync
} from '@tooni/iconscout-unicons-react';

interface RAGWorkflow {
  id: string;
  name: string;
  status: 'queued' | 'scraping' | 'embedding' | 'indexing' | 'validating' | 'completed' | 'failed';
  progress: number;
  type: 'youtube' | 'documents' | 'urls' | 'mixed';
  parameters: {
    sources: string[];
    chunkSize: number;
    overlap: number;
    embeddingModel: string;
    vectorStore: string;
  };
  stats: {
    totalContent: number;
    contentProcessed: number;
    embeddings: number;
    indexSize: string;
    processingTime?: string;
  };
  createdAt: string;
  completedAt?: string;
  estimatedTime?: string;
}

interface ViewRAGWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: RAGWorkflow | null;
  onExport?: (format: 'json' | 'vectors') => void;
  onUse?: () => void;
}

export default function ViewRAGWorkflowModal({ isOpen, onClose, workflow, onExport, onUse }: ViewRAGWorkflowModalProps) {
  if (!isOpen || !workflow) return null;

  const getStatusColor = (status: RAGWorkflow['status']) => {
    switch (status) {
      case 'queued': return 'bg-gray-100 text-gray-700 border-gray-400';
      case 'scraping': return 'bg-purple-100 text-purple-700 border-purple-400';
      case 'embedding': return 'bg-green-100 text-green-700 border-green-400';
      case 'indexing': return 'bg-orange-100 text-orange-700 border-orange-400';
      case 'validating': return 'bg-pink-100 text-pink-700 border-pink-400';
      case 'completed': return 'bg-green-100 text-green-700 border-green-400';
      case 'failed': return 'bg-red-100 text-red-700 border-red-400';
    }
  };

  const getStatusIcon = (status: RAGWorkflow['status']) => {
    switch (status) {
      case 'queued': return <UilClock className="w-5 h-5" />;
      case 'scraping': return <UilLink className="w-5 h-5 animate-pulse" />;
      case 'embedding': return <UilBrain className="w-5 h-5 animate-pulse" />;
      case 'indexing': return <UilDatabase className="w-5 h-5 animate-pulse" />;
      case 'validating': return <UilCheckCircle className="w-5 h-5 animate-pulse" />;
      case 'completed': return <UilCheckCircle className="w-5 h-5" />;
      case 'failed': return <UilExclamationTriangle className="w-5 h-5" />;
    }
  };

  const getTypeIcon = (type: RAGWorkflow['type']) => {
    switch (type) {
      case 'youtube': return <UilYoutube className="w-5 h-5 text-red-500" />;
      case 'documents': return <UilFile className="w-5 h-5 text-blue-500" />;
      case 'urls': return <UilLink className="w-5 h-5 text-green-500" />;
      case 'mixed': return <UilDatabase className="w-5 h-5 text-purple-500" />;
    }
  };

  const getWorkflowSteps = () => {
    const steps = [
      { name: 'Scrape Content', status: workflow.progress >= 0, progress: Math.min(workflow.progress, 20) },
      { name: 'Generate Embeddings', status: workflow.progress >= 25, progress: Math.min(Math.max(workflow.progress - 20, 0), 30) },
      { name: 'Build Index', status: workflow.progress >= 55, progress: Math.min(Math.max(workflow.progress - 50, 0), 30) },
      { name: 'Validate', status: workflow.progress >= 85, progress: Math.min(Math.max(workflow.progress - 80, 0), 15) },
      { name: 'Complete', status: workflow.progress === 100, progress: workflow.progress === 100 ? 5 : 0 }
    ];
    return steps;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-background max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b-4 border-black bg-[rgb(0,82,255)] relative sticky top-0 z-10">
          <CardTitle className="text-2xl font-black uppercase text-white pr-10" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
            RAG WORKFLOW DETAILS - {workflow.name}
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
                    <UilChartGrowth className="w-5 h-5 text-black" />
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
                    <UilBrain className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-gray-600">Embeddings</p>
                    <p className="text-2xl font-black text-black">{workflow.stats.embeddings.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Steps */}
          <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <CardHeader className="border-b-4 border-black bg-yellow-50">
              <CardTitle className="text-lg font-black uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Processing Progress
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

          {/* Workflow Configuration */}
          <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <CardHeader className="border-b-4 border-black bg-blue-50">
              <CardTitle className="text-lg font-black uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Configuration Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(workflow.type)}
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">Content Type</p>
                      <p className="font-bold capitalize">{workflow.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <UilDatabase className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">Vector Store</p>
                      <p className="font-bold capitalize">{workflow.parameters.vectorStore}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <UilBrain className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">Embedding Model</p>
                      <p className="font-bold">{workflow.parameters.embeddingModel}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <UilChartGrowth className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">Chunk Size</p>
                      <p className="font-bold">{workflow.parameters.chunkSize} tokens</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <UilSync className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">Overlap</p>
                      <p className="font-bold">{workflow.parameters.overlap} tokens</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <UilFile className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-black uppercase text-gray-600">Sources</p>
                      <p className="font-bold">{workflow.parameters.sources.length} item(s)</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sources List */}
          <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <CardHeader className="border-b-4 border-black bg-purple-50">
              <CardTitle className="text-lg font-black uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Content Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {workflow.parameters.sources.map((source, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black">
                    {source.includes('youtube') && <UilYoutube className="w-5 h-5 text-red-500 flex-shrink-0" />}
                    {source.startsWith('http') && !source.includes('youtube') && <UilLink className="w-5 h-5 text-green-500 flex-shrink-0" />}
                    {!source.startsWith('http') && <UilFile className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{source}</p>
                      <p className="text-xs text-gray-600">
                        {source.includes('youtube') ? 'YouTube Video/Channel' : 
                         source.startsWith('http') ? 'Web URL' : 'Document File'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <CardHeader className="border-b-4 border-black bg-green-50">
              <CardTitle className="text-lg font-black uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                Processing Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <UilFile className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-xs font-black uppercase text-gray-600">Content Processed</p>
                  <p className="text-2xl font-black text-black">{workflow.stats.contentProcessed}/{workflow.stats.totalContent}</p>
                </div>
                
                <div className="p-4 bg-green-50 border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <UilBrain className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-xs font-black uppercase text-gray-600">Embeddings</p>
                  <p className="text-2xl font-black text-black">{workflow.stats.embeddings.toLocaleString()}</p>
                </div>
                
                <div className="p-4 bg-purple-50 border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <UilDatabase className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-xs font-black uppercase text-gray-600">Index Size</p>
                  <p className="text-2xl font-black text-black">{workflow.stats.indexSize}</p>
                </div>
                
                <div className="p-4 bg-orange-50 border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <UilClock className="w-6 h-6 text-orange-600 mb-2" />
                  <p className="text-xs font-black uppercase text-gray-600">Processing Time</p>
                  <p className="text-2xl font-black text-black">{workflow.stats.processingTime || 'TBD'}</p>
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
                    <p className="font-bold">Workflow Created</p>
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

          {/* Action Buttons */}
          {workflow.status === 'completed' && (onExport || onUse) && (
            <div className="flex gap-4 pt-4">
              {onUse && (
                <Button 
                  onClick={onUse}
                  className="flex-1"
                  style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                >
                  <UilRobot className="w-5 h-5 mr-2" />
                  USE IN AGENTS
                </Button>
              )}
              {onExport && (
                <>
                  <Button 
                    onClick={() => onExport('json')}
                    variant="neutral"
                    className="flex-1"
                    style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                  >
                    <UilFileExport className="w-5 h-5 mr-2" />
                    EXPORT JSON
                  </Button>
                  <Button 
                    onClick={() => onExport('vectors')}
                    variant="neutral"
                    className="flex-1"
                    style={{ fontFamily: 'Noyh-Bold, sans-serif' }}
                  >
                    <UilDatabase className="w-5 h-5 mr-2" />
                    EXPORT VECTORS
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}