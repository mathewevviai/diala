'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UilBrain,
  UilUpload,
  UilFile,
  UilLink,
  UilRobot,
  UilCheckCircle,
  UilClock,
  UilExclamationTriangle,
  UilPlay,
  UilPause,
  UilTrash,
  UilDownloadAlt,
  UilChartGrowth,
  UilYoutube,
  UilDatabase,
  UilSync,
  UilEye,
  UilPlus,
  UilFileExport,
  UilStopCircle,
  UilMultiply,
  UilCog
} from '@tooni/iconscout-unicons-react';
import StatCard from '@/components/custom/stat-card';
import CreateRAGWorkflowModal, { RAGWorkflowData } from '@/components/custom/modals/create-rag-workflow-modal';
import ViewRAGWorkflowModal from '@/components/custom/modals/view-rag-workflow-modal';
import SettingsRAGWorkflowModal from '@/components/custom/modals/settings-rag-workflow-modal';
import DeleteConfirmationModal from '@/components/custom/modals/delete-confirmation-modal';

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

export default function AutoRAGPage() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showViewModal, setShowViewModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<RAGWorkflow | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [workflows, setWorkflows] = React.useState<RAGWorkflow[]>([
    {
      id: '1',
      name: 'Sales Training Videos',
      status: 'embedding',
      progress: 65,
      type: 'youtube',
      parameters: {
        sources: ['https://youtube.com/@salesmastery/videos'],
        chunkSize: 512,
        overlap: 50,
        embeddingModel: 'text-embedding-ada-002',
        vectorStore: 'pinecone'
      },
      stats: {
        totalContent: 45,
        contentProcessed: 29,
        embeddings: 1247,
        indexSize: '124 MB',
        processingTime: '15 min'
      },
      createdAt: '2024-03-15 10:30',
      estimatedTime: '10 min remaining'
    },
    {
      id: '2',
      name: 'Product Documentation',
      status: 'completed',
      progress: 100,
      type: 'documents',
      parameters: {
        sources: ['product-docs.pdf', 'api-reference.pdf', 'user-guide.docx'],
        chunkSize: 256,
        overlap: 25,
        embeddingModel: 'text-embedding-ada-002',
        vectorStore: 'chroma'
      },
      stats: {
        totalContent: 3,
        contentProcessed: 3,
        embeddings: 542,
        indexSize: '48 MB',
        processingTime: '8 min'
      },
      createdAt: '2024-03-14 14:00',
      completedAt: '2024-03-14 14:08'
    },
    {
      id: '3',
      name: 'Competitor Analysis',
      status: 'scraping',
      progress: 25,
      type: 'urls',
      parameters: {
        sources: ['https://competitor1.com/features', 'https://competitor2.com/pricing'],
        chunkSize: 512,
        overlap: 50,
        embeddingModel: 'text-embedding-ada-002',
        vectorStore: 'weaviate'
      },
      stats: {
        totalContent: 12,
        contentProcessed: 3,
        embeddings: 0,
        indexSize: '0 MB'
      },
      createdAt: '2024-03-15 11:45',
      estimatedTime: '20 min remaining'
    },
    {
      id: '4',
      name: 'Customer Success Stories',
      status: 'completed',
      progress: 100,
      type: 'mixed',
      parameters: {
        sources: ['case-studies.pdf', 'https://blog.company.com/success-stories'],
        chunkSize: 512,
        overlap: 50,
        embeddingModel: 'text-embedding-ada-002',
        vectorStore: 'pinecone'
      },
      stats: {
        totalContent: 18,
        contentProcessed: 18,
        embeddings: 892,
        indexSize: '76 MB',
        processingTime: '12 min'
      },
      createdAt: '2024-03-13 09:00',
      completedAt: '2024-03-13 09:12'
    },
    {
      id: '5',
      name: 'Technical Support KB',
      status: 'indexing',
      progress: 80,
      type: 'documents',
      parameters: {
        sources: ['support-tickets.csv', 'faq.json', 'troubleshooting.pdf'],
        chunkSize: 256,
        overlap: 25,
        embeddingModel: 'text-embedding-ada-002',
        vectorStore: 'qdrant'
      },
      stats: {
        totalContent: 156,
        contentProcessed: 156,
        embeddings: 3421,
        indexSize: '287 MB'
      },
      createdAt: '2024-03-15 08:00',
      estimatedTime: '5 min remaining'
    },
    {
      id: '6',
      name: 'Sales Call Transcripts',
      status: 'queued',
      progress: 0,
      type: 'documents',
      parameters: {
        sources: ['call-recordings-q1.txt', 'call-recordings-q2.txt'],
        chunkSize: 512,
        overlap: 50,
        embeddingModel: 'text-embedding-ada-002',
        vectorStore: 'pinecone'
      },
      stats: {
        totalContent: 89,
        contentProcessed: 0,
        embeddings: 0,
        indexSize: '0 MB'
      },
      createdAt: '2024-03-15 12:00',
      estimatedTime: '30 min'
    }
  ]);

  // Modal handlers
  const handleViewWorkflow = (workflow: RAGWorkflow) => {
    setSelectedWorkflow(workflow);
    setShowViewModal(true);
  };

  const handleSettingsWorkflow = (workflow: RAGWorkflow) => {
    setSelectedWorkflow(workflow);
    setShowSettingsModal(true);
  };

  const handleDeleteWorkflow = (workflow: RAGWorkflow) => {
    setSelectedWorkflow(workflow);
    setShowDeleteModal(true);
  };

  const handleSaveWorkflowSettings = (updatedWorkflow: Partial<RAGWorkflow>) => {
    if (!selectedWorkflow) return;
    
    const updatedWorkflows = workflows.map(w => {
      if (w.id === selectedWorkflow.id) {
        return {
          ...w,
          ...updatedWorkflow,
          // Reset progress if parameters changed and workflow was active
          progress: (w.status !== 'completed' && w.status !== 'failed') ? 0 : w.progress,
          status: (w.status !== 'completed' && w.status !== 'failed') ? ('scraping' as const) : w.status,
          stats: (w.status !== 'completed' && w.status !== 'failed') ? {
            totalContent: w.stats.totalContent,
            contentProcessed: 0,
            embeddings: 0,
            indexSize: '0 MB'
          } : w.stats
        };
      }
      return w;
    });
    setWorkflows(updatedWorkflows);
  };

  const handleConfirmDelete = async () => {
    if (!selectedWorkflow) return;
    
    setIsDeleting(true);
    
    // Simulate deletion delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedWorkflows = workflows.filter(w => w.id !== selectedWorkflow.id);
    setWorkflows(updatedWorkflows);
    
    setIsDeleting(false);
    setShowDeleteModal(false);
    setSelectedWorkflow(null);
  };

  const handleExportWorkflow = (format: 'json' | 'vectors') => {
    if (!selectedWorkflow) return;
    
    // Simulate export functionality
    const exportData = {
      workflow: selectedWorkflow.name,
      format: format,
      embeddings: selectedWorkflow.stats.embeddings,
      timestamp: new Date().toISOString()
    };
    
    console.log('Exporting RAG workflow:', exportData);
    // In real implementation, this would trigger file download
  };

  const handleUseWorkflow = () => {
    if (!selectedWorkflow) return;
    
    console.log('Using RAG workflow in agents:', selectedWorkflow.name);
    // In real implementation, this would navigate to agents page with pre-selected RAG
  };

  const closeAllModals = () => {
    setShowViewModal(false);
    setShowSettingsModal(false);
    setShowDeleteModal(false);
    setSelectedWorkflow(null);
  };

  const handleCreateWorkflow = (workflowData: RAGWorkflowData) => {
    const sources = [
      ...workflowData.sources,
      ...(workflowData.youtubeUrl ? [workflowData.youtubeUrl] : []),
      ...(workflowData.urls ? workflowData.urls.split('\n').filter(u => u.trim()) : [])
    ];
    
    const newWorkflowEntry: RAGWorkflow = {
      id: String(workflows.length + 1),
      name: workflowData.name,
      status: 'queued',
      progress: 0,
      type: sources.some(s => s.includes('youtube')) ? 'youtube' : 
            sources.some(s => s.startsWith('http')) ? 'urls' : 'documents',
      parameters: {
        sources,
        chunkSize: workflowData.chunkSize,
        overlap: workflowData.overlap,
        embeddingModel: workflowData.embeddingModel,
        vectorStore: workflowData.vectorStore
      },
      stats: {
        totalContent: sources.length,
        contentProcessed: 0,
        embeddings: 0,
        indexSize: '0 MB'
      },
      createdAt: new Date().toISOString(),
      estimatedTime: '15-30 min'
    };
    
    setWorkflows([...workflows, newWorkflowEntry]);
  };

  const getWorkflowColor = (type: RAGWorkflow['type'], shade: '400' | '600' | '800') => {
    switch (type) {
      case 'youtube': return `bg-purple-${shade}`;
      case 'documents': return `bg-green-${shade}`;
      case 'urls': return `bg-orange-${shade}`;
      case 'mixed': return `bg-pink-${shade}`;
    }
  };

  const getStatusColor = (status: RAGWorkflow['status']) => {
    switch (status) {
      case 'queued': return 'bg-gray-600 text-white';
      case 'scraping': return 'bg-purple-600 text-white';
      case 'embedding': return 'bg-green-600 text-white';
      case 'indexing': return 'bg-orange-600 text-white';
      case 'validating': return 'bg-pink-600 text-white';
      case 'completed': return 'bg-green-600 text-white';
      case 'failed': return 'bg-red-600 text-white';
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

  const getWorkflowCardColor = (type: RAGWorkflow['type']) => {
    switch (type) {
      case 'youtube': return 'bg-purple-600';
      case 'documents': return 'bg-green-600';
      case 'urls': return 'bg-orange-600';
      case 'mixed': return 'bg-pink-600';
    }
  };

  const getSourceTypeColor = (type: RAGWorkflowSource['type']) => {
    switch (type) {
      case 'youtube': return 'bg-purple-800 text-white';
      case 'document': return 'bg-green-800 text-white';
      case 'url': return 'bg-orange-800 text-white';
      default: return 'bg-pink-800 text-white';
    }
  };

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black uppercase text-black mb-2">AUTO-RAG TRAINING</h1>
            <p className="text-lg text-gray-600">Transform content into intelligent knowledge bases for your agents</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="default"
            size="lg"
            className="font-bold"
          >
            <UilPlus className="w-5 h-5 mr-2" />
            NEW WORKFLOW
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Workflows"
          value={workflows.filter(w => w.status !== 'completed' && w.status !== 'failed').length}
          icon={<UilSync className="w-6 h-6 text-white animate-spin" />}
          iconBgColor="bg-purple-600"
          bgGradient="from-purple-50 to-purple-100"
        />

        <StatCard
          title="Total Embeddings"
          value={workflows.reduce((acc, w) => acc + w.stats.embeddings, 0).toLocaleString()}
          icon={<UilBrain className="w-6 h-6 text-white" />}
          iconBgColor="bg-green-600"
          bgGradient="from-green-50 to-green-100"
        />

        <StatCard
          title="Index Size"
          value="635 MB"
          icon={<UilDatabase className="w-6 h-6 text-white" />}
          iconBgColor="bg-orange-600"
          bgGradient="from-orange-50 to-orange-100"
        />

        <StatCard
          title="Completed"
          value={workflows.filter(w => w.status === 'completed').length}
          icon={<UilCheckCircle className="w-6 h-6 text-white" />}
          iconBgColor="bg-pink-600"
          bgGradient="from-pink-50 to-pink-100"
        />
      </div>

      {/* Workflow Cards Grid 3x3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow, index) => (
          <Card 
            key={workflow.id}
            className={`border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all duration-200 bg-yellow-50 transform ${
              index % 3 === 0 ? 'rotate-1' : index % 3 === 1 ? '-rotate-1' : ''
            } min-h-[380px]`}
          >
            <CardHeader className={`border-b-4 border-black ${getWorkflowColor(workflow.type, '400')}`}>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-black uppercase text-white">{workflow.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`border-2 border-black font-bold uppercase text-xs ${getWorkflowColor(workflow.type, '600')} text-white`}>
                      {workflow.type}
                    </Badge>
                    <Badge className={`border-2 border-black font-bold uppercase text-xs ${getWorkflowColor(workflow.type, '800')} text-white`}>
                      {workflow.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="neutral"
                    className="p-2 bg-white"
                    onClick={() => handleViewWorkflow(workflow)}
                    title="View workflow details"
                  >
                    <UilEye className="w-4 h-4 text-black" />
                  </Button>
                  <Button
                    size="sm"
                    variant="neutral"
                    className="p-2 bg-white"
                    onClick={() => handleSettingsWorkflow(workflow)}
                    title="Edit workflow settings"
                  >
                    <UilCog className="w-4 h-4 text-black" />
                  </Button>
                  <Button
                    size="sm"
                    variant="neutral"
                    className="p-2 bg-white"
                    onClick={() => handleDeleteWorkflow(workflow)}
                    title="Delete workflow"
                  >
                    <UilTrash className="w-4 h-4 text-black" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold">PROGRESS</span>
                  <span className="text-xs font-bold">{workflow.progress}%</span>
                </div>
                <Progress value={workflow.progress} className="h-2 border-2 border-black" />
                {workflow.estimatedTime && (
                  <p className="text-xs text-gray-600 mt-1">
                    <UilClock className="w-3 h-3 inline mr-1" />
                    {workflow.estimatedTime}
                  </p>
                )}
              </div>

              {/* Type and Source Info */}
              <div className="space-y-2 mb-3 text-sm">
                <div className="flex items-center gap-2">
                  {workflow.type === 'youtube' && <UilYoutube className="w-4 h-4 text-red-500" />}
                  {workflow.type === 'documents' && <UilFile className="w-4 h-4 text-blue-500" />}
                  {workflow.type === 'urls' && <UilLink className="w-4 h-4 text-green-500" />}
                  {workflow.type === 'mixed' && <UilDatabase className="w-4 h-4 text-purple-500" />}
                  <span className="font-bold capitalize">{workflow.type}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {workflow.parameters.sources.length} source{workflow.parameters.sources.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 bg-gray-50 border-2 border-black">
                  <p className="text-xs font-bold text-gray-600 uppercase">Content</p>
                  <p className="text-lg font-black text-black">{workflow.stats.contentProcessed}/{workflow.stats.totalContent}</p>
                </div>
                <div className="p-2 bg-gray-50 border-2 border-black">
                  <p className="text-xs font-bold text-gray-600 uppercase">Embeddings</p>
                  <p className="text-lg font-black text-black">{workflow.stats.embeddings.toLocaleString()}</p>
                </div>
              </div>

              {/* Vector Store Info */}
              <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                <span className="font-bold">Vector Store: {workflow.parameters.vectorStore}</span>
                <span className="font-bold">{workflow.stats.indexSize}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {workflow.status === 'completed' && (
                  <>
                    <Button variant="default" className="flex-1 px-2 py-1 text-xs font-bold bg-green-600 text-white border-2 border-black">
                      <UilRobot className="w-3 h-3 mr-1" />
                      USE
                    </Button>
                    <Button variant="default" className="flex-1 px-2 py-1 text-xs font-bold bg-yellow-300 text-black border-2 border-black">
                      <UilFileExport className="w-3 h-3 mr-1" />
                      EXPORT
                    </Button>
                  </>
                )}
                {workflow.status !== 'completed' && workflow.status !== 'failed' && workflow.status !== 'queued' && (
                  <Button variant="default" className="flex-1 px-2 py-1 text-xs font-bold bg-red-600 text-white border-2 border-black">
                    <UilStopCircle className="w-3 h-3 mr-1" />
                    STOP
                  </Button>
                )}
                {workflow.status === 'queued' && (
                  <Button variant="default" className="flex-1 px-2 py-1 text-xs font-bold bg-green-600 text-white border-2 border-black">
                    <UilPlay className="w-3 h-3 mr-1" />
                    START
                  </Button>
                )}
              </div>

              {/* Created Date */}
              <p className="text-xs text-gray-500 mt-3">
                Started: {new Date(workflow.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* Create New Workflow Card - fills remaining slots */}
        {Array.from({ length: Math.max(0, 9 - workflows.length) }).map((_, index) => (
          <Card 
            key={`empty-${index}`}
            onClick={() => setShowCreateModal(true)}
            className="border-4 border-dashed border-gray-400 shadow-[4px_4px_0_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0_rgba(0,0,0,0.5)] hover:border-black transition-all duration-200 bg-gray-50 cursor-pointer group min-h-[380px]"
          >
            <CardContent className="h-full flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 bg-gray-200 border-4 border-gray-400 group-hover:border-black group-hover:bg-gray-300 rounded-full flex items-center justify-center mb-4 transition-all">
                <UilPlus className="w-8 h-8 text-gray-600 group-hover:text-black" />
              </div>
              <p className="text-lg font-black text-gray-600 group-hover:text-black uppercase">New Workflow</p>
              <p className="text-xs text-gray-500 mt-2 text-center">Transform content into embeddings</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Workflow Modal */}
      <CreateRAGWorkflowModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateWorkflow}
      />

      {/* View RAG Workflow Modal */}
      <ViewRAGWorkflowModal
        isOpen={showViewModal}
        onClose={closeAllModals}
        workflow={selectedWorkflow}
        onExport={handleExportWorkflow}
        onUse={handleUseWorkflow}
      />

      {/* Settings RAG Workflow Modal */}
      <SettingsRAGWorkflowModal
        isOpen={showSettingsModal}
        onClose={closeAllModals}
        workflow={selectedWorkflow}
        onSave={handleSaveWorkflowSettings}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeAllModals}
        onConfirm={handleConfirmDelete}
        itemName={selectedWorkflow?.name || ''}
        itemType="RAG workflow"
        warningMessage="This will permanently delete the workflow and all its embeddings"
        consequences={[
          'All generated embeddings will be lost',
          'Vector index data cannot be recovered',
          'This action cannot be undone',
          selectedWorkflow?.status !== 'completed' && selectedWorkflow?.status !== 'failed' 
            ? 'Active processing will be immediately stopped' 
            : 'Trained knowledge base will be permanently deleted'
        ].filter(Boolean) as string[]}
        requiresNameConfirmation={selectedWorkflow?.stats.embeddings > 1000}
        isLoading={isDeleting}
      />
    </div>
  );
}