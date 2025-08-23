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
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ProcessingStepProps {
  state: BulkOnboardingState;
  setState: (updates: Partial<BulkOnboardingState>) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
  tiktokVideos?: any[];
  youtubeVideos?: any[];
  twitchVideos?: any[];
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
    // Wrap ReactMarkdown in a div that can be styled
    return <div className="prose prose-sm max-w-full"><ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown></div>;
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

export function ProcessingStep({ 
  state, 
  setState, 
  setCurrentStep,
  handleStepChange,
  tiktokVideos = [],
  youtubeVideos = [],
  twitchVideos = [],
}: ProcessingStepProps) {
  

  const [selectedExportFormat, setSelectedExportFormat] = React.useState<string>('json');
  
  const [tooltipOpen, setTooltipOpen] = React.useState<string | null>(null);
  const [isTooltipVideoLoading, setIsTooltipVideoLoading] = React.useState(false);
  const [tooltipThumbnailLoadStatus, setTooltipThumbnailLoadStatus] = React.useState<Map<string, boolean>>(new Map());

  const currentVideoRef = React.useRef<HTMLVideoElement | null>(null);
  
  const [urlMetadata, setUrlMetadata] = React.useState<Map<string, any>>(new Map());
  const [loadingUrlMetadata, setLoadingUrlMetadata] = React.useState<Set<string>>(new Set());

  // Fetch metadata for URLs when in URL mode
  React.useEffect(() => {
    const fetchUrlMetadataForProcessing = async () => {
        if (state.selectedInputMethod !== 'urls' || state.selectedContent.length === 0) return;

        const urlsToFetch = state.selectedContent.filter(url => typeof url === 'string' && !urlMetadata.has(url) && !loadingUrlMetadata.has(url));
        if (urlsToFetch.length === 0) return;

        const newLoading = new Set(loadingUrlMetadata);
        urlsToFetch.forEach(url => newLoading.add(url as string));
        setLoadingUrlMetadata(newLoading);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        
        for (const url of urlsToFetch) {
            try {
                if (!(url as string).includes('tiktok.com')) {
                    const basicMetadata = { title: `Video from URL`, thumbnail: '/placeholder.jpg', videoId: null };
                    setUrlMetadata(prev => new Map(prev).set(url as string, basicMetadata));
                    continue;
                }

                const match = (url as string).match(/\/video\/(\d+)/);
                const videoId = match ? match[1] : '';

                if (!videoId) {
                    const basicMetadata = { title: 'Invalid TikTok URL', thumbnail: '/placeholder.jpg', videoId: null };
                    setUrlMetadata(prev => new Map(prev).set(url as string, basicMetadata));
                    continue;
                }

                const response = await fetch(`${baseUrl}/api/public/tiktok/preview/${videoId}?user_id=bulk-processing-review`);
                const metadata = { title: 'TikTok Video', thumbnail: '/placeholder.jpg', videoId: videoId, duration: 0, viewCount: 0 };

                if (response.ok) {
                    const data = await response.json();
                    metadata.title = data.title || 'TikTok Video';
                    metadata.thumbnail = data.thumbnail || '/placeholder.jpg';
                    metadata.duration = data.duration || 0;
                    metadata.viewCount = data.stats?.views || 0;
                }
                setUrlMetadata(prev => new Map(prev).set(url as string, metadata));
            } catch (error) {
                console.error('Error fetching URL metadata in processing step:', error);
                const videoIdMatch = (url as string).match(/\/video\/(\d+)/);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;
                const basicMetadata = { title: 'TikTok Video (Error)', thumbnail: '/placeholder.jpg', videoId: videoId };
                setUrlMetadata(prev => new Map(prev).set(url as string, basicMetadata));
            } finally {
                setLoadingUrlMetadata(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(url as string);
                    return newSet;
                });
            }
        }
    };
    
    fetchUrlMetadataForProcessing();
  }, [state.selectedContent, state.selectedInputMethod, urlMetadata, loadingUrlMetadata]);


  const createWorkflow = useMutation(api.ragMutations.createWorkflow);
  const addSourceToWorkflow = useMutation(api.ragMutations.addSourceToWorkflow);
  const workflow = useQuery(api.ragQueries.getWorkflow, state.processingJob?.id ? { workflowId: state.processingJob.id } : "skip");
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingJob, setProcessingJob] = React.useState<any>(null);

  React.useEffect(() => {
    return () => {
      cleanupProcessing();
    };
  }, [cleanupProcessing]);

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
    setState({
      selectedContent: state.selectedContent.includes(contentId) 
        ? state.selectedContent.filter(id => id !== contentId)
        : [...state.selectedContent, contentId]
    });
  };

  const canProceedFromStep6 = () => apiProcessProgress === 100;
  
  const exportFormats: ExportFormat[] = [
    { id: 'json', label: 'JSON', Icon: UilDocumentLayoutLeft, color: 'bg-blue-500', description: 'Standard JSON format for general use', fileExtension: '.json', mimeType: 'application/json', features: ['Human readable', 'Widely supported', 'Structured data'] },
    { id: 'csv', label: 'CSV', Icon: UilFileAlt, color: 'bg-green-500', description: 'Comma-separated values for spreadsheets', fileExtension: '.csv', mimeType: 'text/csv', features: ['Excel compatible', 'Simple format', 'Easy analysis'] },
    { id: 'parquet', label: 'Parquet', Icon: UilDatabase, color: 'bg-purple-500', description: 'Optimized columnar format for big data', fileExtension: '.parquet', mimeType: 'application/octet-stream', features: ['Compressed', 'Fast queries', 'Type safe'] },
    { id: 'vector', label: 'Vector DB', Icon: UilBrain, color: 'bg-orange-500', description: 'Ready-to-import vector database format', fileExtension: '.db', mimeType: 'application/octet-stream', features: ['Pre-indexed', 'Direct import', 'Optimized'] }
  ];

  const handleStartProcessing = async () => {
    // Use Convex RAG system instead of old backend API
    const workflowName = `Bulk RAG - ${state.selectedPlatform} - ${new Date().toLocaleDateString()}`;
    
    // This would need to be connected to Convex mutations
    await startBulkProcessing({ 
      platform: state.selectedPlatform, 
      inputMethod: state.selectedInputMethod, 
      channelUrl: state.channelUrl, 
      pastedUrls: state.pastedUrls, 
      selectedContent: state.selectedContent, 
      uploadedDocuments: state.uploadedDocuments, 
      embeddingModel: state.selectedEmbeddingModel!, 
      vectorDb: state.selectedVectorDb!, 
      bulkSettings: state.bulkSettings 
    });
  };

  const handleBulkSettingsChange = (field: keyof typeof state.bulkSettings, value: number) => { setState({ bulkSettings: { ...state.bulkSettings, [field]: value } }); };
  const handleTranscriptProcessingChange = (field: string, value: any) => { setState({ bulkSettings: { ...state.bulkSettings, transcriptProcessing: { ...state.bulkSettings.transcriptProcessing, [field]: value } } }); };
  const handleExportResults = async () => { if (!apiProcessingJob?.id) return; try { await exportResults({ format: selectedExportFormat as 'json' | 'csv' | 'parquet' | 'vector', jobId: apiProcessingJob.id }); } catch (error) { console.error('Error starting export:', error); } };
  const handleDownload = async (downloadUrl: string, filename: string) => { try { await downloadFile(downloadUrl, filename); } catch (error) { console.error('Error downloading file:', error); } };
  const getProcessingStageIcon = () => { const stage = typeof (apiProcessingJob?.stage) === 'string' ? apiProcessingJob.stage : ''; switch (stage) { case 'Downloading content...': case 'Extracting transcripts...': return <UilFileAlt className="h-6 w-6" />; case 'Chunking content...': return <UilCog className="h-6 w-6" />; case 'Generating embeddings...': return <UilBrain className="h-6 w-6" />; case 'Storing in vector database...': return <UilDatabase className="h-6 w-6" />; default: return <UilCheckCircle className="h-6 w-6" />; } };

  const handleTooltipOpen = (id: string) => {
    setTooltipOpen(id);
    setIsTooltipVideoLoading(true);
  };

  const handleTooltipClose = () => {
    setTooltipOpen(null);
    setIsTooltipVideoLoading(false);
    if (currentVideoRef.current) {
        currentVideoRef.current.pause();
        currentVideoRef.current = null;
    }
  };

  return (
    <div className="space-y-8">
      <Card className="transform -rotate-1">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-black">{apiIsProcessing ? 'PROCESSING CONTENT' : 'REVIEW & PROCESS'}</h1>
            <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">{apiIsProcessing ? 'Creating vector embeddings from your selected content...' : 'Review your configuration and start the bulk processing workflow.'}</p>
          </div>

          {!apiIsProcessing && apiProcessProgress < 100 && (
            <>
              {/* Configuration Summary */}
              <Card className="bg-orange-50 mb-6">
                <CardContent className="p-6">
                  <h3 className="text-xl font-black uppercase mb-6">PROCESSING CONFIGURATION</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                     <div className="relative"><div className="absolute inset-0 border-4 border-yellow-400 rounded-sm animate-pulse opacity-75 z-10" style={{left: '-4px',top: '-4px', right: '-6px',bottom: '-6px'}}></div><div className="relative bg-white border-4 border-black p-4 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]"><div className="absolute -top-6 -right-6 z-20" style={{animation: 'overshoot 0.3s ease-out'}}><div className="relative"><div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}><Star15 color="#FFD700" size={48} className="w-12 h-12" stroke="black" strokeWidth={8} /></div><div className="absolute inset-0 flex items-center justify-center"><span className="text-black font-black text-[6px] uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>SELECTED</span></div></div></div><div className={`w-12 h-12 mx-auto mb-2 border-4 border-black flex items-center justify-center ${state.selectedPlatform === 'tiktok' ? 'bg-black' : state.selectedPlatform === 'youtube' ? 'bg-red-600' : state.selectedPlatform === 'twitch' ? 'bg-purple-600' : 'bg-pink-600'}`}>{state.selectedPlatform === 'tiktok' ? <Image src="/tiktok.svg" alt="TikTok" width={24} height={24} className="filter brightness-0 invert" /> : state.selectedPlatform === 'youtube' ? <UilYoutube className="h-6 w-6 text-white" /> : state.selectedPlatform === 'twitch' ? <Image src="/twitch.svg" alt="Twitch" width={24} height={24} className="filter brightness-0 invert" /> : <UilFileAlt className="h-6 w-6 text-white" />}</div><h4 className="font-black uppercase text-sm text-black">PLATFORM</h4><p className="text-gray-600 font-bold text-xs capitalize">{state.selectedPlatform}</p></div></div>
                     <div className="relative"><div className="absolute inset-0 border-4 border-yellow-400 rounded-sm animate-pulse opacity-75 z-10" style={{left: '-4px',top: '-4px', right: '-6px',bottom: '-6px'}}></div><div className="relative bg-white border-4 border-black p-4 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]"><div className="absolute -top-6 -right-6 z-20" style={{animation: 'overshoot 0.3s ease-out'}}><div className="relative"><div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}><Star15 color="#FFD700" size={48} className="w-12 h-12" stroke="black" strokeWidth={8} /></div><div className="absolute inset-0 flex items-center justify-center"><span className="text-black font-black text-[6px] uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>SELECTED</span></div></div></div><div className="w-12 h-12 mx-auto mb-2 bg-cyan-500 border-4 border-black flex items-center justify-center">{state.selectedInputMethod === 'channel' ? <UilUser className="h-6 w-6 text-white" /> : state.selectedInputMethod === 'urls' ? <UilLink className="h-6 w-6 text-white" /> : <UilUpload className="h-6 w-6 text-white" />}</div><h4 className="font-black uppercase text-sm text-black">INPUT METHOD</h4><p className="text-gray-600 font-bold text-xs capitalize">{state.selectedInputMethod}</p></div></div>
                   </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="relative"><div className="absolute inset-0 border-4 border-yellow-400 rounded-sm animate-pulse opacity-75 z-10" style={{left: '-4px',top: '-4px', right: '-6px',bottom: '-6px'}}></div><div className="relative bg-white border-4 border-black p-4 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]"><div className="absolute -top-6 -right-6 z-20" style={{animation: 'overshoot 0.3s ease-out'}}><div className="relative"><div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}><Star15 color="#FFD700" size={48} className="w-12 h-12" stroke="black" strokeWidth={8} /></div><div className="absolute inset-0 flex items-center justify-center"><span className="text-black font-black text-[6px] uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>SELECTED</span></div></div></div><div className="w-12 h-12 mx-auto mb-2 bg-violet-500 border-4 border-black flex items-center justify-center"><UilBrain className="h-6 w-6 text-white" /></div><h4 className="font-black uppercase text-sm text-black">EMBEDDING MODEL</h4><p className="text-gray-600 font-bold text-xs">{state.selectedEmbeddingModel?.label}</p></div></div>
                    <div className="relative"><div className="absolute inset-0 border-4 border-yellow-400 rounded-sm animate-pulse opacity-75 z-10" style={{left: '-4px',top: '-4px', right: '-6px',bottom: '-6px'}}></div><div className="relative bg-white border-4 border-black p-4 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]"><div className="absolute -top-6 -right-6 z-20" style={{animation: 'overshoot 0.3s ease-out'}}><div className="relative"><div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}><Star15 color="#FFD700" size={48} className="w-12 h-12" stroke="black" strokeWidth={8} /></div><div className="absolute inset-0 flex items-center justify-center"><span className="text-black font-black text-[6px] uppercase tracking-wider transform rotate-12" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>SELECTED</span></div></div></div><div className="w-12 h-12 mx-auto mb-2 bg-emerald-500 border-4 border-black flex items-center justify-center"><UilDatabase className="h-6 w-6 text-white" /></div><h4 className="font-black uppercase text-sm text-black">VECTOR DATABASE</h4><p className="text-gray-600 font-bold text-xs">{state.selectedVectorDb?.label}</p></div></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><div className="bg-white border-4 border-black p-3 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]"><div className="w-8 h-8 mx-auto mb-2 bg-pink-500 border-2 border-black flex items-center justify-center"><UilFileAlt className="h-4 w-4 text-white" /></div><p className="text-2xl font-black text-black">{state.selectedContent.length}</p><p className="text-xs font-bold text-gray-600">CONTENT ITEMS</p></div><div className="bg-white border-4 border-black p-3 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]"><div className="w-8 h-8 mx-auto mb-2 bg-yellow-500 border-2 border-black flex items-center justify-center"><UilLayers className="h-4 w-4 text-white" /></div><p className="text-2xl font-black text-black">~{state.selectedContent.length * 10}</p><p className="text-xs font-bold text-gray-600">EMBEDDINGS</p></div><div className="bg-white border-4 border-black p-3 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]"><div className="w-8 h-8 mx-auto mb-2 bg-blue-500 border-2 border-black flex items-center justify-center"><UilProcessor className="h-4 w-4 text-white" /></div><p className="text-2xl font-black text-black">{state.bulkSettings.chunkSize}</p><p className="text-xs font-bold text-gray-600">CHUNK SIZE</p></div><div className="bg-white border-4 border-black p-3 text-center shadow-[4px_4px_0_rgba(0,0,0,1)]"><div className="w-8 h-8 mx-auto mb-2 bg-orange-500 border-2 border-black flex items-center justify-center"><UilClock className="h-4 w-4 text-white" /></div><p className="text-2xl font-black text-black">~{Math.ceil(state.selectedContent.length * 0.5)}</p><p className="text-xs font-bold text-gray-600">MINUTES</p></div></div>
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
                                             </Button>                                        </div>
                                    );
                                })
                                : (state.selectedInputMethod === 'urls' ? state.selectedContent : selectedVideos).map((item: any, index: number) => {
                                    const isUrl = typeof item === 'string';
                                    const videoId = isUrl ? urlMetadata.get(item)?.videoId : (item.id || item.video_id || item.videoId);
                                    const title = isUrl ? urlMetadata.get(item)?.title : (item.title || item.description || 'Untitled Video');
                                    const thumbnail = isUrl ? urlMetadata.get(item)?.thumbnail : (item.thumbnail || item.thumbnails?.[0]?.url || '/placeholder.jpg');
                                    const contentId = isUrl ? item : videoId;
                                    const isLoading = isUrl && loadingUrlMetadata.has(item);

                                    if (isLoading) return <div key={item} className="flex items-center gap-3 p-2 bg-white border-2 border-black"><UilSpinner className="h-5 w-5 animate-spin"/> <p className="text-sm font-bold truncate flex-1">{item}</p></div>;
                                    
                                    return (
                                        <div key={contentId} className="flex items-center gap-3 p-2 bg-white border-2 border-black">
                                            <div className="w-5 h-5 bg-pink-500 border-2 border-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{index + 1}</div>
                                            <Tooltip delayDuration={0} onOpenChange={(open) => open ? handleTooltipOpen(videoId) : handleTooltipClose()}>
                                                <TooltipTrigger asChild><div className="relative cursor-pointer"><Image src={thumbnail || '/placeholder.jpg'} alt={title || ''} width={27} height={48} className={`h-12 w-[27px] object-cover border-2 border-black`} unoptimized onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }} onLoad={() => setTooltipThumbnailLoadStatus(prev => new Map(prev).set(videoId, true))}/><div className="absolute inset-0 bg-black/20 flex items-center justify-center"><UilPlay className="w-6 h-6 text-white" /></div></div></TooltipTrigger>
                                                <TooltipContent side="top" className="p-0 bg-transparent border-none"><div className="bg-background border-4 border-border p-3 shadow-shadow w-[250px]"><div className="relative"><Image src={thumbnail || '/placeholder.jpg'} alt={title || ''} width={250} height={444} className={`w-full object-cover border-2 border-border mb-2 aspect-[9/16]`} unoptimized onLoad={() => setTooltipThumbnailLoadStatus(prev => new Map(prev).set(videoId, true))} />{tooltipOpen === videoId && videoId && (<><div className="absolute inset-0 z-10"><video ref={currentVideoRef} src={`${process.env.NEXT_PUBLIC_API_URL}/api/public/tiktok/download/${videoId}`} className="w-full h-full object-cover" autoPlay muted loop playsInline onCanPlay={() => setIsTooltipVideoLoading(false)} /></div>{isTooltipVideoLoading && tooltipThumbnailLoadStatus.get(videoId) && (<div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-20"><UilSpinner className="h-8 w-8 text-white animate-spin" /></div>)}</>)}</div><p className="font-black text-sm line-clamp-2">{title}</p></div></TooltipContent>
                                            </Tooltip>
                                            <p className="text-sm font-bold truncate flex-1">{title}</p>
                                             <Button
                                               variant="subheader"
                                               size="sm"
                                               onClick={() => toggleContentSelection(contentId)}
                                               className="h-8 w-8 p-0 bg-red-400 hover:bg-red-500 border-2 border-black"
                                             >
                                               <UilTrash className="h-4 w-4" />
                                             </Button>                                        </div>
                                    );
                                })
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

          {(apiIsProcessing || apiProcessProgress > 0) && (<Card className="bg-orange-50 mb-6"><CardContent className="p-6"><div className="flex items-center gap-4 mb-4">{apiIsProcessing ? <UilSpinner className="h-8 w-8 animate-spin text-orange-600" /> : <UilCheckCircle className="h-8 w-8 text-green-600" />}<div className="flex-1"><h3 className="text-lg font-black uppercase">{apiProcessingJob?.stage || 'Processing...'}</h3><p className="text-sm text-gray-600">{apiProcessingJob?.contentProcessed || 0} / {apiProcessingJob?.totalContent || 0} items processed</p></div><div className="text-2xl font-black text-orange-600">{Math.round(apiProcessProgress)}%</div></div><Progress value={apiProcessProgress} /></CardContent></Card>)}
          {apiProcessProgress === 100 && (<Card className="bg-green-50 mb-6"><CardContent className="p-6"><h3 className="text-lg font-black uppercase text-green-800 mb-4">EXPORT RESULTS</h3><div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">{exportFormats.map(f => (<Button key={f.id} variant={selectedExportFormat === f.id ? 'default' : 'outline'} onClick={() => setSelectedExportFormat(f.id)}>{f.label}</Button>))}</div><Button size="lg" className="w-full" onClick={handleExportResults} disabled={isExporting}>{isExporting ? 'EXPORTING...' : 'EXPORT'}</Button></CardContent></Card>)}
          {downloadProgress?.status === 'completed' && downloadProgress.downloadUrl && (<Card className="bg-blue-50 mb-6"><CardContent className="p-6"><h3 className="text-lg font-black uppercase">DOWNLOAD READY</h3><Button size="lg" className="w-full mt-4" onClick={() => handleDownload(downloadProgress.downloadUrl!, downloadProgress.filename!)}>DOWNLOAD {downloadProgress.filename}</Button></CardContent></Card>)}

          <div className="flex gap-4 mt-8">
            <Button variant="neutral" size="lg" className="flex-1 h-14" onClick={() => handleStepChange(5)} disabled={apiIsProcessing}><UilArrowLeft className="mr-2" />BACK</Button>
            {!apiIsProcessing && apiProcessProgress < 100 ? (<Button size="lg" className="flex-1 h-14" onClick={handleStartProcessing} disabled={!state.selectedEmbeddingModel || !state.selectedVectorDb || state.selectedContent.length === 0}><UilPlay className="mr-2" />START PROCESSING</Button>) : (<Button size="lg" className={`flex-1 h-14 ${!canProceedFromStep6() ? 'opacity-50' : ''}`} onClick={() => setCurrentStep(7)} disabled={!canProceedFromStep6()}>CONTINUE<UilArrowRight className="ml-2" /></Button>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
