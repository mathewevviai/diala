'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CopyTranscriptModal from '@/components/onboarding/modals/CopyTranscriptModal';
import BulkDownloadModal from '@/components/onboarding/modals/BulkDownloadModal';
import ChatWithDialaModal from '@/components/onboarding/modals/ChatWithDialaModal';
import VoiceCloneModal from '@/components/onboarding/modals/VoiceCloneModal';
import VerificationModal from '@/components/custom/modals/verification-modal';
import TranscriptSkeleton from '@/components/custom/transcript-skeleton';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { UilFileAlt, UilUpload, UilArrowRight, UilCopy, UilCloudDownload, UilCommentDots, UilMicrophone, UilMusicNote, UilVolumeUp, UilPlay, UilPause, UilUser } from '@tooni/iconscout-unicons-react';
import { DragDropUpload } from './DragDropUpload';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { v4 as uuidv4 } from 'uuid';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { Star15 } from '@/components/ui/star';
import { SpeakerTimeline } from '@/components/transcripts/SpeakerTimeline';

export default function TranscriptsOnboarding() {
  const { handleError } = useApiErrorHandler();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string>('');
  const [transcript, setTranscript] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showCopyModal, setShowCopyModal] = React.useState(false);
  const [showBulkModal, setShowBulkModal] = React.useState(false);
  const [showChatModal, setShowChatModal] = React.useState(false);
  const [showVoiceCloneModal, setShowVoiceCloneModal] = React.useState(false);
  const [showVerificationModal, setShowVerificationModal] = React.useState(false);
  const [verificationComplete, setVerificationComplete] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [audioMetadata, setAudioMetadata] = React.useState<{
    fileName?: string;
    fileSize?: string;
  }>({});
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'transcript' | 'speakers'>('transcript');
  const [jobId, setJobId] = React.useState<string>('');
  const [devMode, setDevMode] = React.useState(false);

  // Convex mutations
  const createTranscriptionJob = useMutation(api.mutations.audioTranscripts.createJob);

  // Convex queries
  const transcriptionJob = useQuery(api.queries.audioTranscripts.getJob, jobId ? { jobId } : "skip");
  const rateLimit = useQuery(api.queries.audioTranscripts.canCreateTranscription, { userId: 'user123' });



  React.useEffect(() => {
    if (!transcriptionJob || !jobId) return;

    if (transcriptionJob.status === 'completed') {
      setTranscript(transcriptionJob.transcript || 'Transcription finished successfully.');
      setIsLoading(false);
      setUploadProgress(100);
      toast.success("Transcription complete!");
    } else if (transcriptionJob.status === 'failed') {
      toast.error('Transcription failed.');
      setTranscript('Error: ' + (transcriptionJob.error || 'Unknown error'));
      setIsLoading(false);
    } else if (transcriptionJob.status === 'processing') {
      if (!isLoading) setIsLoading(true);
      const startTime = transcriptionJob.processingStartedAt;
      if (startTime) {
        const elapsed = Date.now() - startTime;
        const estimatedProgress = Math.min(95, 10 + (elapsed / 30000) * 85); // 30-second estimate
        setUploadProgress(estimatedProgress);
      }
    }
  }, [transcriptionJob, jobId]);

  // Dev mode auto-fill effect
  React.useEffect(() => {
    if (devMode && process.env.NODE_ENV === 'development') {
      // Load actual GlenCoco test file from public directory
      const loadTestFile = async () => {
        try {
          const response = await fetch('/REd4768f876e8bc5b34d83e04f484b0d31.wav');
          const blob = await response.blob();
          const file = new File([blob], 'REd4768f876e8bc5b34d83e04f484b0d31.wav', { type: 'audio/wav' });
          
          setSelectedFile(file);
          setAudioUrl(URL.createObjectURL(file));
          setAudioMetadata({
            fileName: 'REd4768f876e8bc5b34d83e04f484b0d31.wav',
            fileSize: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
          });
          
          toast.success('Dev mode: GlenCoco test file loaded');
        } catch (error) {
          console.error('Dev mode: Failed to load GlenCoco file:', error);
          toast.error('Dev mode: Could not load GlenCoco file');
        }
      };
      
      loadTestFile();
    }
  }, [devMode]);

  const testBackendConnection = async (backendUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(`${backendUrl}/health`, { method: 'GET' });
      console.log('Backend health check:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  };

  const processTranscription = async () => {
    if (!selectedFile) return;

    if (rateLimit && !rateLimit.canCreate) {
      toast.error(`Rate limit exceeded. Try again after ${new Date(rateLimit.resetAt).toLocaleTimeString()}`);
      return;
    }

    setIsLoading(true);
    setTranscript('');
    setUploadProgress(5);
    const newJobId = uuidv4();
    
    try {
      // Step 1: Create the job placeholder in Convex.
      await createTranscriptionJob({
        jobId: newJobId,
        userId: 'user123',
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileFormat: selectedFile.name.split('.').pop() || 'unknown',
      });
      
      // Now that the job exists, set the ID to start polling.
      setJobId(newJobId);
      setUploadProgress(10);

      // Step 2: Construct FormData to EXACTLY match the backend signature.
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('job_id', newJobId);
      formData.append('user_id', 'user123');
      formData.append('separate_voices', 'true');
      formData.append('identify_speakers', 'true');
      
      // Step 3: Upload the file to the backend.
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_AUDIO_SERVICE_URL || 'http://localhost:8001';
      const uploadUrl = `${backendUrl}/api/public/audio/transcribe`;
      console.log('Backend URL from env:', process.env.NEXT_PUBLIC_API_URL);
      console.log('Attempting to upload to:', uploadUrl);

      // Test backend connection first
      const isBackendReachable = await testBackendConnection(backendUrl);
      if (!isBackendReachable) {
        throw new Error(`Backend server at ${backendUrl} is not reachable. Please ensure the backend is running.`);
      }
      console.log('FormData contents:', {
        file: selectedFile.name,
        job_id: newJobId,
        user_id: 'user123',
        separate_voices: 'true',
        identify_speakers: 'true'
      });

      console.log('Starting fetch request with timeout...');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Request timeout - aborting fetch');
        controller.abort();
      }, 30000); // 30 second timeout

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Add headers for debugging
        headers: {
          // Don't set Content-Type - let browser set it with boundary for FormData
        }
      });

      clearTimeout(timeoutId);
      console.log('Fetch request completed successfully');

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || response.statusText };
        }
        throw new Error(`Upload failed (${response.status}): ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      console.log('Backend accepted job:', result);
      // The backend is now processing. The useQuery hook will handle all future UI updates.
      
    } catch (error) {
      console.error('Error starting transcription:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      
      // More detailed error logging
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - likely CORS or connection issue');
        toast.error('Network error: Cannot connect to backend. Check if backend is running.');
        setTranscript('Network error: Cannot connect to backend. Please check if the backend server is running.');
      } else if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        toast.error(`Error: ${error.message}`);
        setTranscript(`Error: ${error.message}`);
      } else {
        console.error('Unknown error:', error);
        toast.error('Unknown error occurred');
        setTranscript('Unknown error occurred. Please try again.');
      }
      
      handleError(error);
      setIsLoading(false);
      setUploadProgress(0);
    }
  };
  
  const handleFileSelect = (file: File) => {
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
      toast.error('Please upload a valid audio file.');
      return;
    }
    setSelectedFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setAudioMetadata({
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    });
  };

  const handleContinue = () => {
    if (selectedFile) {
      setShowVerificationModal(true);
    }
  };
  
  const handleCopyTranscript = () => { if (transcript) { navigator.clipboard.writeText(transcript); setShowCopyModal(true); } };
  const createTranscriptChunks = (text: string) => { const words = text.split(' '); const chunks = []; for (let i = 0; i < words.length; i += 3) { chunks.push(words.slice(i, i + 3).join(' ')); } return chunks; };

  const handleVerificationComplete = (email: string, phone: string) => {
    setVerificationComplete(true);
    setShowVerificationModal(false);
    setCurrentStep(2);
    processTranscription();
  };

  return (
    <>
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => setDevMode(!devMode)}
            className={`h-10 px-4 text-sm font-black uppercase ${
              devMode
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-black'
            } border-2 border-black`}
          >
            DEV MODE {devMode ? 'ON' : 'OFF'}
          </Button>
        </div>
      )}
      <div className="min-h-screen bg-blue-500 relative pb-8" style={{ fontFamily: 'Noyh-Bold, sans-serif', backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`, backgroundSize: '60px 60px' }}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-4xl space-y-8">
            <Card className="transform rotate-1 relative overflow-hidden">
              <CardHeader className="relative">
                <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">AUDIO TRANSCRIBER</CardTitle>
                <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">TRANSCRIBE ANY AUDIO FILE</p>
              </CardHeader>
            </Card>
            
            {currentStep === 1 ? (
              <div className="w-full max-w-2xl mx-auto space-y-8">
                <Card className="transform rotate-1 relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="mb-6 bg-white transform rotate-0.5 p-6 text-center border-4 border-black rounded-[3px] shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <h3 className="text-2xl font-black text-black mb-3">Transcribe Audio Files for <span className="text-blue-500">FREE</span></h3>
                    </div>
                    <Card className="bg-blue-50 border-4 border-black mb-6">
                      <CardContent className="p-8">
                        <DragDropUpload onFileSelect={handleFileSelect} disabled={isLoading} />
                        {selectedFile && (
                          <div className="mt-4 p-4 bg-green-50 border-2 border-black rounded">
                            <p className="font-bold">✓ {selectedFile.name} uploaded</p>
                            <p className="text-sm text-gray-600">Size: {audioMetadata.fileSize}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Button className="w-full mt-6 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black" onClick={handleContinue} disabled={!selectedFile}>
                      <span className="flex items-center justify-center">CONTINUE <UilArrowRight className="ml-2 h-6 w-6" /></span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <Card className="transform rotate-1">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase">TRANSCRIPTION PROGRESS</h3>
                        <Badge className="bg-blue-500 text-white border-2 border-black">{isLoading ? 'PROCESSING' : 'COMPLETED'}</Badge>
                      </div>
                      {(isLoading || uploadProgress > 0) && (
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-black">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="text-sm font-semibold text-center">{Math.round(uploadProgress)}%</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <div className="flex items-start gap-4">
                  <Card className="flex-1 bg-yellow-50">
                    <CardContent className="p-8 space-y-6">
                      {selectedFile && (
                        <div className="space-y-3">
                          <Badge className="bg-blue-500 text-white border-2 border-black px-3 py-1 text-sm font-bold">AUDIO FILE</Badge>
                          <h1 className="text-3xl font-black uppercase text-black">{audioMetadata.fileName?.toUpperCase() || 'AUDIO FILE'}</h1>
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2"><span className="text-lg font-bold text-gray-700">SIZE:</span><span className="text-lg font-black text-black">{audioMetadata.fileSize || 'N/A'}</span></div>
                            <span className="text-gray-400">·</span>
                            <div className="flex items-center gap-2"><span className="text-lg font-bold text-gray-700">FORMAT:</span><span className="text-lg font-black text-black">{selectedFile?.name.split('.').pop()?.toUpperCase() || 'N/A'}</span></div>
                          </div>
                        </div>
                      )}
                      <div className="rounded-lg bg-gray-100 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden p-6">
                        {audioUrl ? (<audio controls className="w-full" src={audioUrl}>Your browser does not support the audio element.</audio>) : (<div className="h-12 bg-gray-200 animate-pulse rounded-md"></div>)}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="transform -rotate-1 hover:rotate-0 transition-transform cursor-pointer" onClick={() => { setSelectedAction('copy'); handleCopyTranscript(); }}>
                           <Button variant="ghost" className="w-full h-full p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-50"><div className="w-16 h-16 bg-white border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center"><UilCopy className="h-8 w-8 text-black" /></div><span className="text-lg font-black text-black uppercase">COPY TRANSCRIPT</span></Button>
                        </Card>
                         <Card className="transform rotate-1 hover:rotate-0 transition-transform bg-purple-50 cursor-pointer" onClick={() => { setSelectedAction('voice-clone'); setShowVoiceCloneModal(true); }}>
                           <Button variant="ghost" className="w-full h-full p-6 flex flex-col items-center justify-center gap-3 hover:bg-purple-100"><div className="w-16 h-16 bg-purple-500 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center"><UilUser className="h-8 w-8 text-white" /></div><span className="text-lg font-black text-black uppercase">VOICE CLONE</span></Button>
                         </Card>
                         <Card className="transform rotate-1 hover:rotate-0 transition-transform bg-yellow-50 cursor-pointer" onClick={() => { setSelectedAction('bulk-process'); setShowBulkModal(true); }}>
                           <Button variant="ghost" className="w-full h-full p-6 flex flex-col items-center justify-center gap-3 hover:bg-yellow-100"><div className="w-16 h-16 bg-yellow-400 border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center"><UilCloudDownload className="h-8 w-8 text-black" /></div><span className="text-lg font-black text-black uppercase">BULK PROCESS</span></Button>
                         </Card>
                         <Card className="transform -rotate-1 hover:rotate-0 transition-transform bg-blue-50 cursor-pointer" onClick={() => { setSelectedAction('chat'); setShowChatModal(true); }}>
                           <Button variant="ghost" className="w-full h-full p-6 flex flex-col items-center justify-center gap-3 hover:bg-blue-100"><div className="w-16 h-16 bg-[rgb(0,82,255)] border-4 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center"><UilCommentDots className="h-8 w-8 text-white" /></div><span className="text-lg font-black text-black uppercase">CHAT WITH DIALA</span></Button>
                         </Card>
                      </div>
                      <div className="flex gap-2 mb-4">
                        <button onClick={() => setActiveTab('transcript')} className={`px-4 py-2 font-bold border-2 border-black rounded ${activeTab === 'transcript' ? 'bg-blue-500 text-white' : 'bg-white text-black hover:bg-gray-100'}`}>FULL TRANSCRIPT</button>
                        <button onClick={() => setActiveTab('speakers')} className={`px-4 py-2 font-bold border-2 border-black rounded ${activeTab === 'speakers' ? 'bg-blue-500 text-white' : 'bg-white text-black hover:bg-gray-100'}`}>SPEAKERS</button>
                      </div>
                      {isLoading && !transcript ? (<TranscriptSkeleton />) : (
                        <div className="rounded-lg bg-yellow-100 p-6">
                          {activeTab === 'transcript' ? (
                            <div className="text-xl font-black text-black">
                              {transcript ? (createTranscriptChunks(transcript).map((chunk, index) => (<React.Fragment key={index}><span className="hover:bg-yellow-200 cursor-pointer transition-colors px-1 py-0.5 rounded">{chunk}</span>{index < createTranscriptChunks(transcript).length - 1 && ' '}</React.Fragment>))) : (<p className="text-center text-gray-500">Transcript will appear here</p>)}
                            </div>
                          ) : (
                            <SpeakerTimeline 
                              transcript={transcript} 
                              speakers={transcriptionJob?.segments || transcriptionJob?.speakers || []}
                              langextract={transcriptionJob?.langextract}
                              sentimentAnalysis={transcriptionJob?.langextract ? {
                                sentiment: (transcriptionJob.langextract?.sentiments?.[0]?.text || 'neutral').toLowerCase(),
                                confidence: (() => {
                                  const conf = transcriptionJob.langextract?.sentiments?.[0]?.attributes?.confidence;
                                  const num = typeof conf === 'string' ? (conf.toLowerCase()==='high'?0.9:conf.toLowerCase()==='medium'?0.6:0.3) : (typeof conf === 'number'? conf : 0.5);
                                  return num;
                                })(),
                                emotions: (() => {
                                  const emos = transcriptionJob.langextract?.emotions || [];
                                  const counts: Record<string, number> = {};
                                  emos.forEach((e: any) => { const t=(e?.text||'').toLowerCase(); counts[t]=(counts[t]||0)+1; });
                                  const total = Object.values(counts).reduce((a:number,b:number)=>a+b,0) || 1;
                                  const norm: Record<string, number> = {};
                                  Object.entries(counts).forEach(([k,v]: any) => { norm[k]= (v as number)/total; });
                                  return norm;
                                })()
                              } : undefined}
                            />
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
        <CopyTranscriptModal isOpen={showCopyModal} onClose={() => setShowCopyModal(false)} />
        <BulkDownloadModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} />
        <ChatWithDialaModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
        <VoiceCloneModal isOpen={showVoiceCloneModal} onClose={() => setShowVoiceCloneModal(false)} />
        <VerificationModal 
          isOpen={showVerificationModal} 
          onClose={() => setShowVerificationModal(false)} 
          onComplete={handleVerificationComplete}
          devMode={devMode}
        />
        <div className="mt-8"><OnboardingFooter /></div>
      </div>
    </>
  );
}
