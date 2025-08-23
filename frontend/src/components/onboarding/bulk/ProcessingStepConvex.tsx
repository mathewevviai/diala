'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { UilSpinner, UilArrowRight, UilArrowLeft, UilArrowUp, UilInfoCircle, UilPlay, UilCheckCircle, UilCog, UilFileAlt, UilBrain, UilDatabase, UilYoutube, UilUpload, UilLink, UilUser, UilClock, UilProcessor, UilLayers, UilExport, UilDownloadAlt, UilDocumentLayoutLeft, UilTrash } from '@tooni/iconscout-unicons-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star15 } from '@/components/ui/star';
import { BulkOnboardingState, ExportFormat, DocumentItem } from './types';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VerificationModal from '@/components/custom/modals/verification-modal';

interface ProcessingStepConvexProps {
  state: BulkOnboardingState;
  setState: (updates: Partial<BulkOnboardingState>) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
  tiktokVideos?: any[];
  youtubeVideos?: any[];
  twitchVideos?: any[];
  userContact?: { email: string; phone: string };
  onStartProcessing: () => void;
}

  const renderDocumentPreview = (doc: DocumentItem) => {
    if (!doc.content || doc.type === 'application/pdf') {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <UilInfoCircle className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-semibold text-gray-600 break-words">
                  {doc.type === 'application/pdf'
                      ? 'PDF previews are not available.'
                      : 'No preview available for this file type.'}
              </p>
              <p className="text-xs text-gray-500 mt-1 break-words">The content will still be processed.</p>
          </div>
      );
    }

    const fileName = doc.name.toLowerCase();

    if (fileName.endsWith('.md')) {
      return <div className="prose prose-sm max-w-full"><div dangerouslySetInnerHTML={{ __html: doc.content.replace(/\n/g, '<br/>') }} /></div>;
    }

    if (fileName.endsWith('.json')) {
      try {
        const jsonContent = JSON.parse(doc.content);
        return <pre className="whitespace-pre-wrap break-words text-xs"><code>{JSON.stringify(jsonContent, null, 2)}</code></pre>;
      } catch (e) {
        return <pre className="text-red-500 whitespace-pre-wrap break-words text-xs">Invalid JSON format.</pre>;
      }
    }

    return <pre className="whitespace-pre-wrap break-words text-xs">{doc.content}</pre>;
  };
export function ProcessingStepConvex({ 
  state, 
  setState, 
  setCurrentStep,
  handleStepChange,
  tiktokVideos = [],
  youtubeVideos = [],
  twitchVideos = [],
  userContact,
  onStartProcessing,
}: ProcessingStepConvexProps) {
  
  const createWorkflow = useMutation(api.ragMutations.createWorkflow);
  const addSourceToWorkflow = useMutation(api.ragMutations.addSourceToWorkflow);
  const userWorkflows = useQuery(api.ragQueries.getUserWorkflows, { userId: "user-placeholder" });
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [workflowId, setWorkflowId] = React.useState<string | null>(null);
  const [selectedExportFormat, setSelectedExportFormat] = React.useState<string>('json');
  const [processedData, setProcessedData] = React.useState<any>(null);
  const [processingError, setProcessingError] = React.useState<string | null>(null);
  const [showVerification, setShowVerification] = React.useState(false);
  const [pendingContact, setPendingContact] = React.useState<{email: string, phone: string} | null>(null);
  const [devMode, setDevMode] = React.useState(true);

  const exportFormats: ExportFormat[] = [
    { id: 'json', label: 'JSON', Icon: UilDocumentLayoutLeft, color: 'bg-blue-500', description: 'Standard JSON format for general use', fileExtension: '.json', mimeType: 'application/json', features: ['Human readable', 'Widely supported', 'Structured data'] },
    { id: 'csv', label: 'CSV', Icon: UilFileAlt, color: 'bg-green-500', description: 'Comma-separated values for spreadsheets', fileExtension: '.csv', mimeType: 'text/csv', features: ['Excel compatible', 'Simple format', 'Easy analysis'] },
    { id: 'parquet', label: 'Parquet', Icon: UilDatabase, color: 'bg-purple-500', description: 'Optimized columnar format for big data', fileExtension: '.parquet', mimeType: 'application/octet-stream', features: ['Compressed', 'Fast queries', 'Type safe'] },
    { id: 'vector', label: 'Vector DB', Icon: UilBrain, color: 'bg-orange-500', description: 'Ready-to-import vector database format', fileExtension: '.db', mimeType: 'application/octet-stream', features: ['Pre-indexed', 'Direct import', 'Optimized'] }
  ];

  const handleStartProcessing = () => {
    console.log('[RAG] Starting visual processing flow...');
    
    // Show fake processing state to trigger verification
    setIsProcessing(true);
    setState({ processProgress: 15 }); // Show initial progress
    
    // Trigger verification modal
    setShowVerification(true);
  };

  const handleVerificationComplete = async (email: string, phone: string) => {
    setShowVerification(false);
    setPendingContact({ email, phone });
    
    console.log('[RAG] Verification complete, starting actual processing...');
    
    // Now actually start the real processing
    try {
      const workflowName = `Bulk RAG - ${state.selectedPlatform} - ${new Date().toLocaleDateString()}`;
      console.log('[RAG] Creating workflow:', workflowName);
      
      const result = await createWorkflow({
        name: workflowName,
        description: `Bulk processing workflow for ${state.selectedPlatform} content`,
        sourceType: state.selectedPlatform === 'web' ? 'urls' : state.selectedPlatform as any,
        chunkSize: state.bulkSettings.chunkSize,
        overlap: state.bulkSettings.chunkOverlap,
        embeddingModel: state.selectedEmbeddingModel?.id || 'jina-embeddings-v4',
        userId: "user-placeholder"
      });

      console.log('[RAG] Workflow created:', result.workflowId);
      console.log('[RAG] Workflow details:', {
        name: workflowName,
        sourceType: state.selectedPlatform,
        chunkSize: state.bulkSettings.chunkSize,
        overlap: state.bulkSettings.chunkOverlap,
        embeddingModel: state.selectedEmbeddingModel?.label,
        vectorDb: state.selectedVectorDb?.label
      });
      setWorkflowId(result.workflowId);
      setState({ processingJob: { id: result.workflowId, status: 'processing', progress: 0, stage: 'initializing', contentProcessed: 0, totalContent: 0, embeddings: 0 } });

      // Add sources based on platform
      console.log('[RAG] Adding sources...');
      
      if (state.selectedPlatform === 'documents') {
        console.log('[RAG] Processing documents:', state.uploadedDocuments.length);
        for (let i = 0; i < state.uploadedDocuments.length; i++) {
          const doc = state.uploadedDocuments[i];
          console.log(`[RAG] Adding document ${i + 1}/${state.uploadedDocuments.length}:`, doc.name);
          
          await addSourceToWorkflow({
            workflowId: result.workflowId,
            source: {
              type: 'document',
              value: doc.name,
              metadata: {
                fileName: doc.name,
                fileSize: doc.size,
                fileType: doc.type
              }
            },
            userId: "user-placeholder"
          });
        }
      } else {
        console.log('[RAG] Processing platform content:', state.selectedContent.length);
        for (let i = 0; i < state.selectedContent.length; i++) {
          const contentId = state.selectedContent[i];
          console.log(`[RAG] Adding content ${i + 1}/${state.selectedContent.length}:`, contentId);
          
          await addSourceToWorkflow({
            workflowId: result.workflowId,
            source: {
              type: 'url' as any,
              value: contentId
            },
            userId: "user-placeholder"
          });
        }
      }

      console.log('[RAG] All sources added successfully. Total sources:', state.selectedPlatform === 'documents' ? state.uploadedDocuments.length : state.selectedContent.length);
      console.log('[RAG] Starting actual RAG processing...');

       // START ACTUAL PROCESSING HERE
      const namespace = `onboarding-${state.selectedPlatform}`;
      
      console.log('[RAG] Using vector database:', state.selectedVectorDb?.label);
      console.log('[RAG] Using embedding model:', state.selectedEmbeddingModel?.label);
      
      if (state.selectedPlatform === 'documents') {
        console.log('[RAG] Processing documents with RAG pipeline...');
        
        // Documents are already added as sources via addSourceToWorkflow
        // No need for individual document processing via addDocument
        console.log('[RAG] Documents added as sources, workflow processing will handle embedding');
      } else {
        // For platform content (YouTube, TikTok, etc.)
        console.log('[RAG] Processing platform content...');
        
        // Platform content is already added as sources via addSourceToWorkflow
        // No need for individual content processing via addDocument
        console.log('[RAG] Platform content added as sources, workflow processing will handle embedding');
      }
      console.log('[RAG] All items submitted for processing. Monitoring progress...');
      
      // Start monitoring progress with the workflow ID
      checkProgress(result.workflowId);

    } catch (error) {
      console.error('[RAG] Error starting processing:', error);
      setIsProcessing(false);
      setProcessingError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const handleExportResults = async () => {
    console.log('[RAG] Exporting results...');
    console.log('[RAG] Selected format:', selectedExportFormat);
    console.log('[RAG] Workflow ID:', state.processingJob?.id);
    console.log('[RAG] Processed data available:', !!processedData);
    
    if (!processedData) {
      console.error('[RAG] No processed data available for export');
      return;
    }
    
    await handleExportData(selectedExportFormat);
  };

  const handleDownload = async (downloadUrl: string, filename: string) => {
    console.log('[RAG] Downloading file:', filename);
    console.log('[RAG] Download URL:', downloadUrl);
  };

  const handleExportData = async (format: string) => {
    if (!processedData) return;
    
    console.log('[RAG] Exporting data in format:', format);
    
    try {
      const exportData = {
        workflowId: processedData.workflowId,
        timestamp: processedData.timestamp,
        documents: processedData.documents,
        summary: {
          totalDocuments: processedData.documents.length,
          totalChunks: processedData.totalChunks,
          embeddingsGenerated: processedData.embeddingsGenerated,
          platform: state.selectedPlatform
        }
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          filename = `rag-export-${processedData.workflowId}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          content = generateCSV(exportData);
          filename = `rag-export-${processedData.workflowId}.csv`;
          mimeType = 'text/csv';
          break;
        case 'txt':
          content = generateTextReport(exportData);
          filename = `rag-report-${processedData.workflowId}.txt`;
          mimeType = 'text/plain';
          break;
        default:
          content = JSON.stringify(exportData, null, 2);
          filename = `rag-export-${processedData.workflowId}.json`;
          mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[RAG] Export completed:', filename);
    } catch (error) {
      console.error('[RAG] Export failed:', error);
    }
  };

    const generateCSV = (data: any): string => {
      const headers = ['Document ID', 'Title', 'Content Length', 'Platform'];
      const rows = data.documents.map((doc: any) => [
        doc.id,
        doc.title,
        doc.content.length,
        data.summary.platform
      ]);
      
      return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
    };
  const generateTextReport = (data: any): string => {
    return `
RAG Processing Report
====================
Workflow ID: ${data.workflowId}
Timestamp: ${data.timestamp}
Platform: ${data.summary.platform}

Documents Processed: ${data.summary.totalDocuments}
Total Chunks: ${data.summary.totalChunks}
Embeddings Generated: ${data.summary.embeddingsGenerated}

Document Details:
${data.documents.map((doc: any, index: number) => 
  `${index + 1}. ${doc.title} (${doc.content.length} chars)`
).join('\n')}

Processing completed successfully!
`;
  };

  const handleBulkSettingsChange = (field: keyof typeof state.bulkSettings, value: number) => {
    console.log('[RAG] Settings change:', field, value);
    setState({ bulkSettings: { ...state.bulkSettings, [field]: value } });
  };

  const handleTranscriptProcessingChange = (field: string, value: any) => {
    setState({ bulkSettings: { ...state.bulkSettings, transcriptProcessing: { ...state.bulkSettings.transcriptProcessing, [field]: value } } });
  };

  const canProceedFromStep6 = () => state.processProgress === 100 && state.processingJob?.status === 'completed';

  const videos = React.useMemo(() => {
    return state.selectedPlatform === 'tiktok' ? tiktokVideos : 
           state.selectedPlatform === 'youtube' ? youtubeVideos : 
           state.selectedPlatform === 'twitch' ? twitchVideos : [];
  }, [state.selectedPlatform, tiktokVideos, youtubeVideos, twitchVideos]);

  const selectedVideos = React.useMemo(() => {
    return videos.filter(video => {
      const videoId = video.id || video.video_id || video.videoId;
      return state.selectedContent.includes(videoId);
    });
  }, [videos, state.selectedContent]);

  const toggleContentSelection = (contentId: string) => {
    console.log('[RAG] Toggling content selection:', contentId);
    setState({
      selectedContent: state.selectedContent.includes(contentId) 
        ? state.selectedContent.filter(id => id !== contentId)
        : [...state.selectedContent, contentId]
    });
  };

  const processDocumentContent = useAction(api.ragActions.processDocumentContent);
  const createWebEmbeddings = useAction(api.ragActions.createWebEmbeddings);
  const getWebDocuments = useQuery(api.ragActions.getWebDocuments, { workflowId: state.processingJob?.id || '' });
  const webDocuments = useQuery(api.ragActions.getWebDocuments, { 
    workflowId: state.processingJob?.id || '' 
  });
  const workflow = useQuery(api.ragQueries.getWorkflow, state.processingJob?.id ? { 
    workflowId: state.processingJob.id, 
    userId: "user-placeholder" 
  } : "skip");

  // Poll workflow progress
  React.useEffect(() => {
    if (workflow && state.processingJob?.id) {
      const progress = workflow.progress || 0;
      const status = workflow.status;
      
      console.log('[RAG] Workflow progress update:', { progress, status });
      setState({ processProgress: Math.round(progress) });
      
      // Auto-complete when processing is done
      if (status === 'completed') {
        setIsProcessing(false);
        setProcessedData({
          workflowId: state.processingJob.id,
          totalSources: workflow.totalSources || 0,
          processedSources: workflow.processedSources || 0,
          totalEmbeddings: workflow.totalEmbeddings || 0,
          status: 'completed'
        });
      } else if (status === 'failed') {
        setIsProcessing(false);
        setProcessingError('Processing failed');
      }
    }
  }, [workflow, state.processingJob?.id]);

  const checkProgress = async (workflowId?: string) => {
    const actualWorkflowId = workflowId || state.processingJob?.id;
    console.log('[RAG] Starting document processing workflow...');
    console.log('[RAG] Current workflowId:', actualWorkflowId);
    
    if (!actualWorkflowId) {
      console.error('[RAG] No workflow ID provided for progress checking');
      setIsProcessing(false);
      return;
    }
    
    // Update progress to 30% to indicate workflow started
    setIsProcessing(true);
    
    try {
      if (!actualWorkflowId) {
        console.error('[RAG] No workflow ID found');
        setIsProcessing(false);
        return;
      }

      // Prepare documents for processing based on platform type
      let result;
      
      if (state.selectedPlatform === 'web') {
        // Handle web URLs with Jina Reader API
        console.log('[RAG] Processing web URLs with Jina Reader API');
        
        // Use createWebEmbeddings which properly creates embeddings in ragEmbeddings table
        result = await createWebEmbeddings({
          workflowId: actualWorkflowId,
          userId: "user-placeholder",
          urls: state.pastedUrls,
          config: {
            chunkSize: state.bulkSettings.chunkSize,
            overlap: state.bulkSettings.chunkOverlap,
            embeddingModel: state.selectedEmbeddingModel?.id || 'jina-embeddings-v4',
          },
        });
        
        console.log('[RAG] Web content processing completed:', result);
      } else {
        // Handle documents and other content
        const documents: Array<{id: string, title: string, content: string, metadata: any}> = [];
        
        if (state.selectedPlatform === 'documents') {
          state.uploadedDocuments.forEach(doc => {
            const content = doc.content || `Content from ${doc.name}`;
            documents.push({
              id: doc.id,
              title: doc.name,
              content: content,
              metadata: {
                fileName: doc.name,
                fileSize: doc.size,
                fileType: doc.type,
                uploadDate: doc.uploadDate
              }
            });
          });
        } else {
          // Platform content - create mock content for demo
          state.selectedContent.forEach(contentId => {
            documents.push({
              id: contentId,
              title: `${state.selectedPlatform}_${contentId}`,
              content: `Content from ${state.selectedPlatform} with ID: ${contentId}`,
              metadata: { 
                platform: state.selectedPlatform,
                contentId: contentId
              }
            });
          });
        }

        if (documents.length === 0) {
          console.error('[RAG] No documents to process');
          setIsProcessing(false);
          return;
        }

        console.log('[RAG] Processing', documents.length, 'documents...');
        
        result = await processDocumentContent({
          workflowId: actualWorkflowId,
          userId: "user-placeholder",
          documents,
          config: {
            chunkSize: state.bulkSettings.chunkSize,
            overlap: state.bulkSettings.chunkOverlap,
            embeddingModel: state.selectedEmbeddingModel?.id || 'jina-embeddings-v4',
          }
        });
      }

      console.log('[RAG] Processing result:', result);
      
      if (result.success) {
        console.log('[RAG] Processing completed successfully!');
        setIsProcessing(false);
        setState({ 
          processingJob: { 
            id: actualWorkflowId, 
            status: 'completed', 
            progress: 100,
            stage: 'completed',
            contentProcessed: result.documentsProcessed || state.selectedContent.length || state.uploadedDocuments.length || state.pastedUrls.length,
            totalContent: result.totalUrls || state.selectedContent.length || state.uploadedDocuments.length || state.pastedUrls.length,
            embeddings: 0
          },
          processProgress: 100
        });
      }
    } catch (error) {
      console.error('[RAG] Processing failed:', error);
      setIsProcessing(false);
      setProcessingError('Processing failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-8">
      <Card className="transform -rotate-1">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
              {isProcessing ? 'PROCESSING CONTENT' : 'REVIEW & PROCESS'}
            </h1>
            <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">
              {isProcessing ? 'Creating vector embeddings from your selected content...' : 'Review your configuration and start the bulk processing workflow.'}
            </p>
          </div>

          {!isProcessing && !state.processingJob?.id && (
            <>
              {/* Configuration Summary */}
              <Card className="transform rotate-1 bg-orange-50 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] mb-6">
                <CardContent className="p-8">
                  <h3 className="text-3xl font-black uppercase mb-8 text-center text-black">PROCESSING CONFIGURATION</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white border-4 border-black p-6 text-center shadow-[6px_6px_0_rgba(0,0,0,1)]">
                      <div className="w-16 h-16 mx-auto mb-4 bg-pink-500 border-4 border-black flex items-center justify-center">
                        {state.selectedPlatform === 'tiktok' ? <Image src="/tiktok.svg" alt="TikTok" width={32} height={32} className="filter brightness-0 invert" /> : 
                         state.selectedPlatform === 'youtube' ? <UilYoutube className="h-8 w-8 text-white" /> : 
                         state.selectedPlatform === 'twitch' ? <Image src="/twitch.svg" alt="Twitch" width={32} height={32} className="filter brightness-0 invert" /> : 
                         <UilFileAlt className="h-8 w-8 text-white" />}
                      </div>
                      <h4 className="font-black uppercase text-lg text-black mb-2">PLATFORM</h4>
                      <p className="text-gray-800 font-bold text-base capitalize">{state.selectedPlatform}</p>
                    </div>
                    <div className="bg-white border-4 border-black p-6 text-center shadow-[6px_6px_0_rgba(0,0,0,1)]">
                      <div className="w-16 h-16 mx-auto mb-4 bg-cyan-500 border-4 border-black flex items-center justify-center">
                        <UilUpload className="h-8 w-8 text-white" />
                      </div>
                      <h4 className="font-black uppercase text-lg text-black mb-2">INPUT METHOD</h4>
                      <p className="text-gray-800 font-bold text-base capitalize">{state.selectedInputMethod}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 border-4 border-yellow-400 rounded-sm animate-pulse opacity-75 z-10" style={{left: '-4px',top: '-4px', right: '-6px',bottom: '-6px'}}></div>
                      <div className="relative bg-white border-4 border-black p-4 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        <div className="absolute -top-6 -right-6 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                          <div className="relative">
                            <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                              <Star15 color="#FFD700" size={48} className="w-12 h-12" stroke="black" strokeWidth={8} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-black font-black text-[6px] uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>SELECTED</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-12 h-12 mx-auto mb-2 bg-violet-500 border-4 border-black flex items-center justify-center">
                          <UilBrain className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-black uppercase text-sm text-black">EMBEDDING MODEL</h4>
                        <p className="text-gray-600 font-bold text-xs">{state.selectedEmbeddingModel?.label}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 border-4 border-yellow-400 rounded-sm animate-pulse opacity-75 z-10" style={{left: '-4px',top: '-4px', right: '-6px',bottom: '-6px'}}></div>
                      <div className="relative bg-white border-4 border-black p-4 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        <div className="absolute -top-6 -right-6 z-20" style={{animation: 'overshoot 0.3s ease-out'}}>
                          <div className="relative">
                            <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                              <Star15 color="#FFD700" size={48} className="w-12 h-12" stroke="black" strokeWidth={8} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-black font-black text-[6px] uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>SELECTED</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-12 h-12 mx-auto mb-2 bg-emerald-500 border-4 border-black flex items-center justify-center">
                          <UilDatabase className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-black uppercase text-sm text-black">VECTOR DATABASE</h4>
                        <p className="text-gray-600 font-bold text-xs">{state.selectedVectorDb?.label}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border-4 border-black p-3 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <div className="w-8 h-8 mx-auto mb-2 bg-pink-500 border-2 border-black flex items-center justify-center">
                        <UilFileAlt className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-2xl font-black text-black">{state.selectedContent.length}</p>
                      <p className="text-xs font-bold text-gray-600">CONTENT ITEMS</p>
                    </div>
                    <div className="bg-white border-4 border-black p-3 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <div className="w-8 h-8 mx-auto mb-2 bg-yellow-500 border-2 border-black flex items-center justify-center">
                        <UilLayers className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-2xl font-black text-black">~{state.selectedContent.length * 10}</p>
                      <p className="text-xs font-bold text-gray-600">EMBEDDINGS</p>
                    </div>
                    <div className="bg-white border-4 border-black p-3 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <div className="w-8 h-8 mx-auto mb-2 bg-blue-500 border-2 border-black flex items-center justify-center">
                        <UilProcessor className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-2xl font-black text-black">{state.bulkSettings.chunkSize}</p>
                      <p className="text-xs font-bold text-gray-600">CHUNK SIZE</p>
                    </div>
                    <div className="bg-white border-4 border-black p-3 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <div className="w-8 h-8 mx-auto mb-2 bg-orange-500 border-2 border-black flex items-center justify-center">
                        <UilClock className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-2xl font-black text-black">~{Math.ceil(state.selectedContent.length * 0.5)}</p>
                      <p className="text-xs font-bold text-gray-600">MINUTES</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-pink-50 mb-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-black uppercase mb-4">SELECTED CONTENT REVIEW</h3>
                  <div className="space-y-2">
                    <TooltipProvider>
                      {state.selectedPlatform === 'documents'
                        ? state.selectedContent.map((docId, index) => {
                            const doc = state.uploadedDocuments.find(d => d.id === docId);
                            if (!doc) return null;
                            return (
                              <div key={doc.id} className="flex items-center gap-3 p-2 bg-white border-2 border-black">
                                <div className="w-5 h-5 bg-pink-500 border-2 border-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{index + 1}</div>
                                <Tooltip delayDuration={0}>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                      <UilFileAlt className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                      <p className="text-sm font-bold truncate">{doc.name}</p>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="p-0 bg-transparent border-none max-w-[450px]">
                                    <div className="bg-background border-4 border-border p-3 shadow-shadow w-[450px]">
                                      <h4 className="font-black text-sm mb-2 break-words">{doc.name}</h4>
                                      <div className="max-h-[300px] overflow-y-auto overflow-x-hidden bg-gray-50 p-2 border border-gray-200 rounded">
                                        {renderDocumentPreview(doc)}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                                <Button
                                  variant="subheader"
                                  size="sm"
                                  onClick={() => toggleContentSelection(doc.id)}
                                  className="h-8 w-8 p-0 bg-red-400 hover:bg-red-500 border-2 border-black"
                                >
                                  <UilTrash className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })
                        : state.selectedContent.map((item: any, index: number) => (
                            <div key={item} className="flex items-center gap-3 p-2 bg-white border-2 border-black">
                              <div className="w-5 h-5 bg-pink-500 border-2 border-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{index + 1}</div>
                              <p className="text-sm font-bold truncate flex-1">{item}</p>
                              <Button
                                variant="subheader"
                                size="sm"
                                onClick={() => toggleContentSelection(item)}
                                className="h-8 w-8 p-0 bg-red-400 hover:bg-red-500 border-2 border-black"
                              >
                                <UilTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                      }
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-black uppercase mb-6">ADVANCED SETTINGS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="bg-white border-2 border-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-10 h-10 bg-blue-500 border-2 border-black flex items-center justify-center">
                            <UilFileAlt className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <h4 className="text-center font-black uppercase mb-2">CHUNK SIZE</h4>
                        <Slider value={[state.bulkSettings.chunkSize]} onValueChange={(v) => handleBulkSettingsChange('chunkSize', v[0])} max={4096} min={512} step={256} />
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-2 border-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-10 h-10 bg-green-500 border-2 border-black flex items-center justify-center">
                            <UilLayers className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <h4 className="text-center font-black uppercase mb-2">CHUNK OVERLAP</h4>
                        <Slider value={[state.bulkSettings.chunkOverlap]} onValueChange={(v) => handleBulkSettingsChange('chunkOverlap', v[0])} max={500} min={0} step={50} />
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-2 border-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-10 h-10 bg-purple-500 border-2 border-black flex items-center justify-center">
                            <UilCog className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <h4 className="text-center font-black uppercase mb-2">MAX TOKENS</h4>
                        <Slider value={[state.bulkSettings.maxTokens]} onValueChange={(v) => handleBulkSettingsChange('maxTokens', v[0])} max={8192} min={512} step={512} />
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {processingError && (
            <Card className="bg-red-50 border-4 border-red-600 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <UilInfoCircle className="h-8 w-8 text-red-600" />
                  <div className="flex-1">
                    <h3 className="text-lg font-black uppercase text-red-800">Processing Error</h3>
                    <p className="text-sm text-red-700">{processingError}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setProcessingError(null);
                    setIsProcessing(false);
                  }}
                  className="mt-4 bg-red-600 text-white hover:bg-red-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {isProcessing && (
            <Card className="bg-orange-50 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <UilSpinner className="h-8 w-8 animate-spin text-orange-600" />
                  <div className="flex-1">
                    <h3 className="text-lg font-black uppercase">Processing...</h3>
                    <p className="text-sm text-gray-600">Creating vector embeddings...</p>
                  </div>
                  <div className="text-2xl font-black text-orange-600">{Math.round(state.processProgress)}%</div>
                </div>
                <Progress value={state.processProgress} />
              </CardContent>
            </Card>
          )}

          {state.processingJob?.status === 'completed' && (
            <div className="w-full text-center space-y-4">
              <div className="text-lg font-bold text-green-600 mb-4">Processing Complete!</div>
              <Button 
                onClick={() => setCurrentStep(7)} 
                className="font-black uppercase text-lg px-8 py-4"
              >
                Continue to Export
                <UilArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {!state.processingJob?.id && (
            <div className="flex gap-4 mt-8">
              <Button
                variant="neutral"
                size="lg"
                className="flex-1 h-14"
                onClick={() => handleStepChange(5)}
                disabled={isProcessing}
              >
                <UilArrowLeft className="mr-2" />
                BACK
              </Button>
              <Button
                size="lg"
                className="flex-1 h-14"
                onClick={handleStartProcessing}
                disabled={!state.selectedEmbeddingModel || !state.selectedVectorDb || state.selectedContent.length === 0 || isProcessing}
              >
                <UilPlay className="mr-2" />
                START PROCESSING
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        onComplete={handleVerificationComplete}
        devMode={devMode}
      />
    </div>
  );
}