'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CopyTranscriptModal from '@/components/onboarding/modals/CopyTranscriptModal';
import BulkDownloadModal from '@/components/onboarding/modals/BulkDownloadModal';
import ChatWithDialaModal from '@/components/onboarding/modals/ChatWithDialaModal';
import TranscriptSkeleton from '@/components/custom/transcript-skeleton';
import { OnboardingFooter } from '@/components/custom/onboarding-footer';
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { UilFileAlt, UilClipboardNotes, UilDocumentInfo, UilYoutube, UilDownloadAlt, UilArrowRight, UilTwitter, UilFacebookF, UilInstagram, UilLinkedin, UilShare, UilWhatsapp, UilThumbsUp, UilBell, UilCopy, UilCloudDownload, UilCommentDots, UilQuestionCircle, UilFileDownloadAlt, UilBrain, UilDatabase, UilAnalysis } from '@tooni/iconscout-unicons-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function TranscriptsOnboarding() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [transcript, setTranscript] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showCopyModal, setShowCopyModal] = React.useState(false);
  const [showBulkModal, setShowBulkModal] = React.useState(false);
  const [showChatModal, setShowChatModal] = React.useState(false);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = React.useState<{
    title?: string;
    author?: string;
    duration?: number;
  }>({});

  const fetchYoutubeTranscript = useAction(api.youtubeTranscriptActions.fetchYoutubeTranscript);
  const getJobStatus = useAction(api.youtubeTranscriptActions.getJobStatus);

  const fetchTranscript = async (url: string) => {
    setIsLoading(true);
    setTranscript('');
    
    try {
      // Start transcript fetch job
      const result = await fetchYoutubeTranscript({
        youtubeUrl: url,
        userId: "user123", // TODO: Get from auth context
      });
      
      console.log('Initial fetch result:', result);

      if (result.cached && result.transcript && result.transcript !== 'No subtitles available for this video') {
        // Immediately show cached transcript
        setTranscript(result.transcript);
        // Set metadata if available
        if (result.videoTitle || result.videoAuthor || result.title || result.author) {
          setVideoMetadata({
            title: result.videoTitle || result.title,
            author: result.videoAuthor || result.author,
            duration: result.videoDuration || result.duration,
          });
        }
        setIsLoading(false);
        return;
      }

      // Store job ID for polling
      setJobId(result.jobId);

      // Poll for job completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await getJobStatus({ jobId: result.jobId });
          
          if (status.status === "completed" && status.transcript && status.transcript !== 'No subtitles available for this video') {
            setTranscript(status.transcript);
            // Set video metadata if available
            console.log('Job status response:', status);
            if (status.videoTitle || status.videoAuthor || status.title || status.author) {
              setVideoMetadata({
                title: status.videoTitle || status.title || 'Video Title',
                author: status.videoAuthor || status.author || 'Video Author',
                duration: status.videoDuration || status.duration,
              });
            }
            setIsLoading(false);
            clearInterval(pollInterval);
          } else if (status.status === "failed") {
            setTranscript(`Error: ${status.error || 'Failed to fetch transcript'}`);
            setIsLoading(false);
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Error polling job status:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Stop polling after 60 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isLoading) {
          setTranscript('Timeout: Taking too long to fetch transcript. Please try again.');
          setIsLoading(false);
        }
      }, 60000);

    } catch (error: any) {
      console.error('Error fetching transcript:', error);
      setTranscript(error.message || 'Error loading transcript. Please try again.');
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (youtubeUrl) {
      fetchTranscript(youtubeUrl);
      setCurrentStep(2);
    }
  };

  const handleCopyTranscript = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setShowCopyModal(true);
    }
  };

  const createTranscriptChunks = (text: string) => {
    const words = text.split(' ');
    const chunks = [];
    for (let i = 0; i < words.length; i += 3) {
      chunks.push(words.slice(i, i + 3).join(' '));
    }
    return chunks;
  };

  return (
    <>
      <div className="min-h-screen bg-red-500 relative pb-8" style={{ 
        fontFamily: 'Noyh-Bold, sans-serif',
        backgroundImage: `linear-gradient(rgba(15, 23, 41, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 41, 0.8) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }}>

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl space-y-8">
          {/* Persistent Title Card */}
          <Card className="transform rotate-1 relative overflow-hidden">
            <CardHeader className="relative">
              <div className="absolute top-2 left-4 w-8 h-8 bg-red-600 border-2 border-black flex items-center justify-center">
                <UilYoutube className="h-4 w-4 text-white" />
              </div>
              <div className="absolute top-2 right-4 w-8 h-8 bg-red-500 border-2 border-black flex items-center justify-center">
                <UilFileAlt className="h-4 w-4 text-white" />
              </div>
              <div className="absolute bottom-3 left-6 w-6 h-6 bg-yellow-400 border-2 border-black rotate-12">
                <div className="w-2 h-2 bg-black absolute top-1 left-1"></div>
              </div>
              <div className="absolute bottom-2 right-8 w-4 h-4 bg-red-500 border-2 border-black -rotate-12"></div>
              <div className="flex justify-center mb-4">
                <Button className="w-20 h-20 bg-red-600 hover:bg-red-700 border-4 border-black p-0">
                  <UilYoutube className="h-12 w-12 text-white" />
                </Button>
              </div>
              <CardTitle className="text-5xl md:text-6xl font-black uppercase text-center text-black relative z-10">
                YOUTUBE TO TRANSCRIPT
              </CardTitle>
              <p className="text-lg md:text-xl text-gray-700 mt-4 font-bold text-center">
                BULK DOWNLOAD TRANSCRIPTS
              </p>
              <div className="flex justify-center items-center mt-3 gap-2">
                <div className="w-3 h-3 bg-red-600 animate-pulse"></div>
                <div className="w-2 h-6 bg-black"></div>
                <div className="w-4 h-4 bg-red-500 animate-pulse delay-150"></div>
                <div className="w-2 h-8 bg-black"></div>
                <div className="w-3 h-3 bg-red-600 animate-pulse delay-300"></div>
              </div>
            </CardHeader>
          </Card>
          
          {currentStep === 1 ? (
            <div className="w-full max-w-2xl mx-auto space-y-8">
              {/* Feature Cards Container */}
              <Card className="transform rotate-1 relative overflow-hidden">
                <CardContent className="p-6">
                  {/* Description */}
                  <div className="mb-6 bg-white transform rotate-0.5 p-6 text-center border-4 border-black rounded-[3px] shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <h3 className="text-2xl font-black text-black mb-3" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                      Generate YouTube Transcript for <span className="text-red-500">FREE</span>
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <p className="text-base font-semibold text-black">Access all Transcript Languages</p>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <p className="text-base font-semibold text-black">Translate to 125+ Languages</p>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <p className="text-base font-semibold text-black">Easy Copy and Edit</p>
                      </div>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div className="mb-6">
                    <label className="text-xl font-black uppercase mb-3 block">
                      PASTE YOUTUBE URL
                    </label>
                    <Input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="h-16 text-lg font-semibold border-4 border-black rounded-[3px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
                    <Card className="bg-yellow-100 md:transform md:-rotate-1 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <CardContent className="p-6 md:p-4">
                        <div className="flex flex-col items-center justify-center text-center gap-3 md:gap-2">
                          <Button 
                            size="icon"
                            variant="default"
                            className="w-12 h-12 md:w-10 md:h-10 bg-yellow-400 hover:bg-yellow-500 border-4 border-black"
                          >
                            <UilCopy className="h-6 w-6 md:h-5 md:w-5 text-black" />
                          </Button>
                          <span className="font-bold text-base md:text-sm text-black">ONE-CLICK COPY</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-100 md:transform md:rotate-1 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <CardContent className="p-6 md:p-4">
                        <div className="flex flex-col items-center justify-center text-center gap-3 md:gap-2">
                          <Button 
                            size="icon"
                            variant="default"
                            className="w-12 h-12 md:w-10 md:h-10 bg-yellow-400 hover:bg-yellow-500 border-4 border-black"
                          >
                            <UilFileAlt className="h-6 w-6 md:h-5 md:w-5 text-black" />
                          </Button>
                          <span className="font-bold text-base md:text-sm text-black">SUPPORTS TRANSLATION</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-100 md:transform md:-rotate-1 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                      <CardContent className="p-6 md:p-4">
                        <div className="flex flex-col items-center justify-center text-center gap-3 md:gap-2">
                          <Button 
                            size="icon"
                            variant="default"
                            className="w-12 h-12 md:w-10 md:h-10 bg-yellow-400 hover:bg-yellow-500 border-4 border-black"
                          >
                            <UilCommentDots className="h-6 w-6 md:h-5 md:w-5 text-black" />
                          </Button>
                          <span className="font-bold text-base md:text-sm text-black">MULTIPLE LANGUAGES</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button
                    className="w-full mt-6 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                    onClick={handleContinue}
                    disabled={!youtubeUrl}
                  >
                    <span className="flex items-center justify-center">
                      CONTINUE
                      <UilArrowRight className="ml-2 h-6 w-6" />
                    </span>
                  </Button>
                </CardContent>
              </Card>

              {/* Info Section - YouTube Transcript Training */}
              <div className="mt-12 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
                <Card className="transform -rotate-1 relative overflow-hidden bg-yellow-50">
                  <CardContent className="relative pt-6">
                    <div className="flex items-start gap-4">
                      <Button
                        size="icon"
                        variant="default"
                        className="w-12 h-12 flex-shrink-0 bg-red-500 hover:bg-red-600 text-white border-black"
                      >
                        <UilYoutube className="h-6 w-6 text-white" />
                      </Button>
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                          YOUTUBE TRANSCRIPT TRAINING DATA
                        </h3>
                        <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                          We leverage bulk YouTube downloads to create powerful training datasets for your voice agents. Transcripts from thousands of real conversations help our AI understand natural speech patterns, industry-specific terminology, and authentic dialogue flow.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-black font-medium">Access to millions of real conversations</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-black font-medium">Industry-specific vocabulary training</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-black font-medium">Natural speech pattern recognition</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-black font-medium">Continuous model improvement</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk Processing Power Card */}
                <Card className="transform rotate-1 relative overflow-hidden bg-yellow-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Button
                        size="icon"
                        variant="default"
                        className="w-12 h-12 flex-shrink-0 bg-yellow-400 hover:bg-yellow-400/90 text-black"
                      >
                        <UilCloudDownload className="h-6 w-6 text-black" />
                      </Button>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-black mb-3 uppercase" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                          BULK PROCESSING POWER
                        </h3>
                        <p className="text-gray-700 text-lg leading-relaxed">
                          Our advanced infrastructure can process up to <span className="font-black text-red-500">10,000 YouTube videos per hour</span>, 
                          extracting transcripts and analyzing conversation patterns at scale. This massive processing capability ensures 
                          your voice agent is trained on the most comprehensive dataset possible, covering every scenario they might encounter.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-6">
              {/* URL Input */}
              <Card className="transform rotate-1">
                <CardContent className="p-6">
                  <label className="text-xl font-black uppercase mb-3 block">
                    PASTE YOUTUBE URL
                  </label>
                  <Input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-14 text-lg font-semibold border-4 border-black rounded-[3px]"
                  />
                  <Button
                    className="w-full mt-4 h-14 text-lg font-black uppercase bg-yellow-400 hover:bg-yellow-400/90 text-black"
                    onClick={handleContinue}
                    disabled={!youtubeUrl}
                  >
                    <span className="flex items-center justify-center">
                      CONTINUE
                      <UilArrowRight className="ml-2 h-6 w-6" />
                    </span>
                  </Button>
                </CardContent>
              </Card>

              {/* Container with side buttons and card */}
              <div className="flex items-start gap-4">
                {/* Left side buttons */}
                <div className="flex flex-col gap-[10px]">
                  <Button variant="subheader" size="icon" className="bg-[#FF0000] hover:bg-[#CC0000]">
                    <UilYoutube className="h-5 w-5 text-white" />
                  </Button>
                  <Button variant="subheader" size="icon" className="bg-[#1DA1F2] hover:bg-[#1A8CD8]">
                    <UilTwitter className="h-5 w-5 text-white" />
                  </Button>
                  <Button variant="subheader" size="icon" className="bg-[#1877F2] hover:bg-[#166FE5]">
                    <UilFacebookF className="h-5 w-5 text-white" />
                  </Button>
                  <Button variant="subheader" size="icon" className="bg-[#E4405F] hover:bg-[#D62949]">
                    <UilInstagram className="h-5 w-5 text-white" />
                  </Button>
                  <Button variant="subheader" size="icon" className="bg-[#0A66C2] hover:bg-[#004182]">
                    <UilLinkedin className="h-5 w-5 text-white" />
                  </Button>
                  <Button variant="subheader" size="icon" className="bg-[#6366F1] hover:bg-[#4F46E5]">
                    <UilShare className="h-5 w-5 text-white" />
                  </Button>
                  <Button variant="subheader" size="icon" className="bg-[#25D366] hover:bg-[#1EBE57]">
                    <UilWhatsapp className="h-5 w-5 text-white" />
                  </Button>
                </div>

                {/* Rounded Div with Action Buttons */}
                <Card className="flex-1 bg-yellow-50">
                  <CardContent className="p-8 space-y-6">
                    {/* Video Title */}
                    {youtubeUrl && (
                      <div className="space-y-3">
                        <Badge className="bg-yellow-400 text-black border-2 border-black px-3 py-1 text-sm font-bold">
                          TRANSCRIPT
                        </Badge>
                        {isLoading ? (
                          <div className="h-9 bg-gray-200 animate-pulse rounded-md"></div>
                        ) : (
                          <h1 className="text-3xl font-black uppercase text-black">
                            {videoMetadata.title ? 
                              videoMetadata.title.toUpperCase() : 
                              'VIDEO TITLE'}
                          </h1>
                        )}
                        
                        {/* Author and Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-bold text-gray-700">AUTHOR:</span>
                          {isLoading ? (
                            <div className="h-7 w-48 bg-gray-200 animate-pulse rounded-md"></div>
                          ) : (
                            <a 
                              href={videoMetadata.author ? `https://www.youtube.com/@${videoMetadata.author.replace(/\s+/g, '')}` : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-black text-black hover:underline"
                            >
                              {videoMetadata.author || 'VIDEO AUTHOR'}
                            </a>
                          )}
                          <span className="text-gray-400">·</span>
                          
                          {/* Like Button */}
                          <a
                            href={youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button 
                              variant="default" 
                              size="sm"
                              className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] flex items-center gap-1"
                            >
                              <UilThumbsUp className="h-4 w-4" />
                              <span className="font-bold">LIKE</span>
                            </Button>
                          </a>
                          
                          {/* Subscribe Button */}
                          <a
                            href={videoMetadata.author ? `https://www.youtube.com/@${videoMetadata.author.replace(/\s+/g, '')}?sub_confirmation=1` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button 
                              variant="default" 
                              size="sm"
                              className="h-8 px-3 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] flex items-center gap-1"
                            >
                              <UilBell className="h-4 w-4" />
                              <span className="font-bold">SUBSCRIBE</span>
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {/* Video div with skeleton */}
                    <div className="rounded-lg bg-black border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden">
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        {isLoading ? (
                          <div className="absolute top-0 left-0 w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                            <div className="text-gray-400">
                              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        ) : youtubeUrl ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeUrl.split('v=')[1]?.split('&')[0] || ''}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full"
                          ></iframe>
                        ) : null}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button 
                        variant="header" 
                        size="header"
                        className="w-full h-16 text-xl font-black bg-white hover:bg-gray-100 text-black border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-none flex items-center justify-center gap-2"
                        onClick={handleCopyTranscript}
                      >
                        <UilCopy className="h-6 w-6" />
                        COPY TRANSCRIPT
                      </Button>
                      <Button 
                        variant="header" 
                        size="header"
                        className="w-full h-16 text-xl font-black bg-yellow-400 hover:bg-yellow-400/90 text-black flex items-center justify-center gap-2"
                        onClick={() => setShowBulkModal(true)}
                      >
                        <UilCloudDownload className="h-6 w-6" />
                        WANT TO BULK DOWNLOAD?
                      </Button>
                      <Button 
                        variant="header" 
                        size="header"
                        className="w-full h-16 text-xl font-black bg-[rgb(0,82,255)] hover:bg-blue-600 flex items-center justify-center gap-2"
                        onClick={() => setShowChatModal(true)}
                      >
                        <UilCommentDots className="h-6 w-6" />
                        CHAT WITH IN DIALA
                      </Button>
                    </div>

                    {/* Transcript Div */}
                    {isLoading ? (
                      <TranscriptSkeleton />
                    ) : (
                      <div className="rounded-lg bg-yellow-100 p-6">
                        <div className="text-xl font-black text-black">
                          {transcript ? (
                            createTranscriptChunks(transcript).map((chunk, index) => (
                              <React.Fragment key={index}>
                                <span className="hover:bg-yellow-200 cursor-pointer transition-colors px-1 py-0.5 rounded">
                                  {chunk}
                                </span>
                                {index < createTranscriptChunks(transcript).length - 1 && ' '}
                              </React.Fragment>
                            ))
                          ) : (
                            <p className="text-center text-gray-500">Transcript will appear here</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <OnboardingFooter />
        </div>
      </div>
    </div>
    </>
  );
}