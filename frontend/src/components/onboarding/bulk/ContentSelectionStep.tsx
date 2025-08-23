'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { UilSpinner, UilArrowRight, UilArrowLeft, UilCheckCircle, UilInfoCircle, UilPlay, UilVideo, UilClock, UilEye, UilThumbsUp, UilCheckSquare, UilTrash, UilFileAlt, UilShare, UilMusic, UilVolume, UilVolumeMute, UilYoutube, UilLink } from '@tooni/iconscout-unicons-react';
import { Star15 } from '@/components/ui/star';
import { BulkOnboardingState, DocumentItem } from './types';


interface ContentSelectionStepProps {
  state: BulkOnboardingState;
  setState: (updates: Partial<BulkOnboardingState>) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
  // Platform specific data
  tiktokUser?: any;
  tiktokVideos?: any[];
  youtubeChannel?: any;
  youtubeVideos?: any[];
  twitchChannel?: any;
  twitchVideos?: any[];
  twitchChannelDataComplete?: boolean;
}

export function ContentSelectionStep({
  state,
  setState,
  setCurrentStep,
  handleStepChange,
  tiktokUser,
  tiktokVideos,
  youtubeChannel,
  youtubeVideos,
  twitchChannel,
  twitchVideos,
}: ContentSelectionStepProps) {

  const [hoveredVideoId, setHoveredVideoId] = React.useState<string | null>(null);
  const [isHoveredVideoLoading, setIsHoveredVideoLoading] = React.useState(false);
  const [thumbnailLoadStatus, setThumbnailLoadStatus] = React.useState<Map<string, boolean>>(new Map());
  
  const videos = React.useMemo(() => {
    return state.selectedPlatform === 'tiktok' ? (tiktokVideos || []) : 
           state.selectedPlatform === 'youtube' ? (youtubeVideos || []) : 
           state.selectedPlatform === 'twitch' ? (twitchVideos || []) : [];
  }, [state.selectedPlatform, tiktokVideos, youtubeVideos, twitchVideos]);

  const [urlMetadata, setUrlMetadata] = React.useState<Map<string, any>>(new Map());
  const [loadingUrlMetadata, setLoadingUrlMetadata] = React.useState<Set<string>>(new Set());

  const isUrlMode = state.selectedInputMethod === 'urls';
  const isDocumentMode = state.selectedPlatform === 'documents';
  const totalContent = isDocumentMode ? state.uploadedDocuments.length : isUrlMode ? state.pastedUrls.length : videos.length;

  React.useEffect(() => {
    if(isUrlMode && !isDocumentMode) {
      fetchUrlMetadata();
    }
  }, [isUrlMode, state.pastedUrls, isDocumentMode]);

  const fetchUrlMetadata = async () => {
    const newUrls = state.pastedUrls.filter(url => !urlMetadata.has(url) && !loadingUrlMetadata.has(url));
    if (newUrls.length === 0) return;

    const newLoading = new Set(loadingUrlMetadata);
    newUrls.forEach(url => newLoading.add(url));
    setLoadingUrlMetadata(newLoading);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
    
    for (const url of newUrls) {
      try {
        if (!url.includes('tiktok.com')) {
          const basicMetadata = { title: `Video from URL`, thumbnail: '/placeholder.jpg', duration: 0, stats: { views: 0, likes: 0 } };
          setUrlMetadata(prev => new Map(prev).set(url, basicMetadata));
          continue;
        }

        const match = url.match(/\/video\/(\d+)/);
        const videoId = match ? match[1] : '';

        if (!videoId) {
          const basicMetadata = { title: 'Invalid TikTok URL', thumbnail: '/placeholder.jpg', duration: 0, stats: { views: 0, likes: 0 } };
          setUrlMetadata(prev => new Map(prev).set(url, basicMetadata));
          continue;
        }

        const response = await fetch(`${baseUrl}/api/public/tiktok/preview/${videoId}?user_id=bulk-processing`);
        const metadata = { title: 'TikTok Video', thumbnail: '/placeholder.jpg', duration: 0, stats: { views: 0, likes: 0 }, videoId: videoId };

        if (response.ok) {
          const data = await response.json();
          metadata.title = data.title || 'TikTok Video';
          metadata.thumbnail = data.thumbnail || '/placeholder.jpg';
          metadata.duration = data.duration || 0;
          metadata.stats = { views: data.stats?.views || 0, likes: data.stats?.likes || 0 };
        }
        setUrlMetadata(prev => new Map(prev).set(url, metadata));

      } catch (error) {
        console.error('Error fetching TikTok URL metadata:', error);
        const basicMetadata = { title: 'TikTok Video (Error)', thumbnail: '/placeholder.jpg', duration: 0, stats: { views: 0, likes: 0 } };
        setUrlMetadata(prev => new Map(prev).set(url, basicMetadata));
      } finally {
        setLoadingUrlMetadata(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
      }
    }
  };

  const canProceedFromStep3 = () => state.selectedContent.length > 0;

  const toggleContentSelection = (contentIdentifier: string) => {
    const newSelectedContent = state.selectedContent.includes(contentIdentifier) 
      ? state.selectedContent.filter(id => id !== contentIdentifier)
      : [...state.selectedContent, contentIdentifier];
    
    setState({ selectedContent: newSelectedContent });
  };

  const handleVideoHover = React.useCallback((videoId: string) => {
    if (state.selectedPlatform !== 'tiktok' && !isUrlMode) return;
    setHoveredVideoId(videoId);
    setIsHoveredVideoLoading(true);
  }, [state.selectedPlatform, isUrlMode]);

  const handleVideoLeave = React.useCallback(() => {
    setHoveredVideoId(null);
    setIsHoveredVideoLoading(false);
  }, []);

  const selectAllContent = () => {
    const allIdentifiers = isDocumentMode
      ? state.uploadedDocuments.map(doc => doc.id)
      : isUrlMode
      ? state.pastedUrls
      : videos.map(video => video.id || video.video_id || video.videoId);
    setState({ selectedContent: allIdentifiers });
  };

  const clearAllContent = () => {
    setState({ selectedContent: [] });
  };

  const formatDuration = (duration: any) => {
    if (!duration || duration === 'Unknown') return 'N/A';
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return duration;
  };

  const formatViews = (views: any) => {
    if (views === undefined || views === null || views === 'Unknown') return 'N/A';
    if (typeof views === 'number') {
      if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
      if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
      return views.toString();
    }
    return views;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <UilFileAlt className="h-4 w-4 text-red-600" />;
    return <UilFileAlt className="h-4 w-4 text-blue-600" />;
  };

  const getPlatformIcon = () => {
    switch (state.selectedPlatform) {
      case 'youtube': return <UilYoutube className="h-4 w-4 text-red-600" />;
      case 'tiktok': return <Image src="/tiktok.svg" alt="TikTok" width={16} height={16} />;
      case 'twitch': return <Image src="/twitch.svg" alt="Twitch" width={16} height={16} />;
      default: return <UilVideo className="h-4 w-4" />;
    }
  };
  
  const getPlatformName = () => {
    switch (state.selectedPlatform) {
      case 'youtube': return 'YouTube';
      case 'tiktok': return 'TikTok';
      case 'twitch': return 'Twitch';
      case 'documents': return 'Documents';
      default: return 'Platform';
    }
  };

  if (state.isLoading) {
    return (
      <div className="space-y-8">
        <Card className="transform -rotate-1">
          <CardContent className="p-8">
            <div className="text-center">
              <UilSpinner className="h-12 w-12 mx-auto mb-4 animate-spin text-orange-600" />
              <h2 className="text-2xl font-black uppercase mb-4">LOADING CONTENT</h2>
              <p className="text-gray-600 mb-6">Fetching {getPlatformName()} content...</p>
              <Progress value={state.loadProgress} className="w-full mb-4" />
              <p className="text-sm text-gray-500">{state.loadProgress}% complete</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="transform -rotate-1">
        <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-black">
            SELECT CONTENT
          </h1>
          <p className="text-lg text-gray-700 mt-3 max-w-2xl mx-auto">
            Choose the content to process for RAG creation. Selected items will be transcribed and embedded.
          </p>
        </div>

          {isDocumentMode ? (
             <Card className="bg-blue-50 mb-6"><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><UilFileAlt className="h-5 w-5 text-blue-700"/><h3 className="text-xl font-black uppercase">DOCUMENT-BASED INPUT</h3></div><Badge variant="default" className="bg-blue-500 text-white">{state.uploadedDocuments.length} Documents to process</Badge></div></CardContent></Card>
          ) : isUrlMode && (
            <Card className="bg-orange-50 mb-6"><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3">{getPlatformIcon()}<h3 className="text-xl font-black uppercase">URL-BASED INPUT</h3></div><Badge variant="default" className="bg-orange-500 text-white">{state.pastedUrls.length} URLs to process</Badge></div></CardContent></Card>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><Button variant="neutral" size="sm" onClick={selectAllContent} className="h-10"><UilCheckSquare className="h-4 w-4 mr-2" />SELECT ALL</Button><Button variant="neutral" size="sm" onClick={clearAllContent} className="h-10"><UilTrash className="h-4 w-4 mr-2" />CLEAR ALL</Button></div>
            <div className="text-sm text-gray-600">{state.selectedContent.length} / {totalContent} selected</div>
          </div>

          {totalContent > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {isDocumentMode ? (
                state.uploadedDocuments.map((doc: DocumentItem) => {
                    const isSelected = state.selectedContent.includes(doc.id);
                    return (
                      <div key={doc.id} className="relative">
                        {isSelected && (
                          <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" 
                               style={{animation: 'overshoot 0.3s ease-out'}}>
                            <div className="relative">
                              <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                                <Star15 color="#FFD700" size={80} 
                                        className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" 
                                        stroke="black" strokeWidth={8} />
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" 
                                      style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                                  SELECTED
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        <Card className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${isSelected ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'}`} onClick={() => toggleContentSelection(doc.id)}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox checked={isSelected} readOnly className="mt-1 flex-shrink-0" />
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center gap-2 mb-2">
                                  {getFileIcon(doc.type)}
                                  <h4 className="font-bold text-sm leading-tight truncate">{doc.name}</h4>
                                </div>
                                <p className="text-xs text-gray-700">{formatFileSize(doc.size)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                })
              ) : isUrlMode ? (
                state.pastedUrls.map((url, index) => {
                  const metadata = urlMetadata.get(url);
                  const isLoading = loadingUrlMetadata.has(url);
                  const isSelected = state.selectedContent.includes(url);
                  const videoId = metadata?.videoId;
                  const isHovering = hoveredVideoId === videoId;
                  const canPlay = isHovering && videoId;
                  
                  if (isLoading) {
                    return (<Card key={index} className="animate-pulse"><CardContent className="p-4"><div className="flex items-center justify-center h-56"><UilSpinner className="h-6 w-6 animate-spin text-orange-600" /></div></CardContent></Card>);
                  }
                   
                  if (metadata && videoId) {
                                        return (
                     <div key={index} className="relative cursor-pointer transform transition-all hover:scale-105" onClick={() => toggleContentSelection(url)}>
                       {isSelected && (
                         <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" 
                              style={{animation: 'overshoot 0.3s ease-out'}}>
                           <div className="relative">
                             <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                               <Star15 color="#FFD700" size={80} 
                                       className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" 
                                       stroke="black" strokeWidth={8} />
                             </div>
                             <div className="absolute inset-0 flex items-center justify-center">
                               <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" 
                                     style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                                 SELECTED
                               </span>
                             </div>
                           </div>
                         </div>
                       )}
                       <Card className={`border-4 border-border shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col ${isSelected ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-background'}`}>
                           <div className="relative" onMouseEnter={() => handleVideoHover(videoId)} onMouseLeave={handleVideoLeave}>
                              <Image 
                                src={metadata.thumbnail} 
                                alt={metadata.title} 
                                width={180} 
                                height={320} 
                                className="w-full object-cover aspect-[9/16]"
                                onLoad={() => setThumbnailLoadStatus(prev => new Map(prev).set(videoId, true))}
                              />
                              {canPlay && (
                                <div className="absolute inset-0 z-10">
                                  <video
                                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/tiktok/download/${videoId}`}
                                    className={`w-full h-full object-cover transition-opacity duration-300 ${isHoveredVideoLoading ? 'opacity-0' : 'opacity-100'}`}
                                    loop
                                    playsInline
                                    preload="metadata"
                                    onCanPlay={() => {
                                      setIsHoveredVideoLoading(false);
                                    }}
                                    onLoadedData={(e) => {
                                      const el = e.currentTarget as HTMLVideoElement;
                                      try {
                                        el.muted = false;
                                        el.volume = 0.6;
                                        const p = el.play();
                                        if (p && typeof p.then === 'function') {
                                          p.catch(() => {/* autoplay with sound may be blocked */});
                                        }
                                      } catch {}
                                    }}
                                  />
                                </div>
                              )}
                              {canPlay && isHoveredVideoLoading && thumbnailLoadStatus.get(videoId) && (
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-20">
                                  <div className="flex flex-col items-center">
                                    <UilSpinner className="h-8 w-8 text-white animate-spin mb-2" />
                                    <p className="text-white text-xs font-semibold">Loading Preview...</p>
                                  </div>
                                </div>
                              )}

                           </div>
                           <CardContent className="p-3 flex-grow flex flex-col"><p className="font-bold text-sm line-clamp-2 mb-2 flex-shrink-0 h-10">{metadata.title}</p><div className="flex items-center gap-2 mt-auto text-xs text-gray-600"><div className="flex items-center gap-1"><UilClock className="h-3 w-3" /><span>{formatDuration(metadata.duration)}</span></div>{metadata.stats?.views !== undefined && <><span>·</span><div className="flex items-center gap-1"><UilEye className="h-3 w-3" /><span>{formatViews(metadata.stats.views)}</span></div></>}</div></CardContent>
                       </Card>
                     </div>
                   );
                  }
                  return (
                    <div key={index} className="relative">
                      {isSelected && (
                        <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" 
                             style={{animation: 'overshoot 0.3s ease-out'}}>
                          <div className="relative">
                            <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                              <Star15 color="#FFD700" size={80} 
                                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" 
                                      stroke="black" strokeWidth={8} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" 
                                    style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                                SELECTED
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <Card className={`cursor-pointer border-4 border-black hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${isSelected ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-white'}`} onClick={() => toggleContentSelection(url)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox checked={isSelected} readOnly className="mt-1 flex-shrink-0" />
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-center gap-2 mb-2">
                                <UilLink className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <h4 className="font-bold text-sm leading-tight truncate">{metadata?.title || "URL (Invalid)"}</h4>
                              </div>
                              <p className="text-xs text-gray-700 break-all">{url}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })
              ) : (
                videos.map((video) => {
                  const videoId = video.id || video.video_id || video.videoId;
                  const isSelected = state.selectedContent.includes(videoId);
                  const isHovering = hoveredVideoId === videoId;
                  const canPlay = isHovering && (video.playAddr || video.downloadAddr);

                  return (
                    <div key={videoId} className="relative cursor-pointer transform transition-all hover:scale-105" onClick={() => toggleContentSelection(videoId)}>
                      {isSelected && (
                        <div className="absolute -top-8 -right-8 sm:-top-12 sm:-right-12 md:-top-16 md:-right-16 z-20" 
                             style={{animation: 'overshoot 0.3s ease-out'}}>
                          <div className="relative">
                            <div className="animate-spin" style={{animationDuration: '15s', animationDelay: '0.3s'}}>
                              <Star15 color="#FFD700" size={80} 
                                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]" 
                                      stroke="black" strokeWidth={8} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-black font-black text-[10px] sm:text-xs uppercase tracking-wider transform rotate-12" 
                                    style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
                                SELECTED
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <Card className={`border-4 border-border shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col ${isSelected ? 'bg-orange-100 shadow-[6px_6px_0_rgba(0,0,0,1)]' : 'bg-background'}`}>
                        <div className="relative" onMouseEnter={() => handleVideoHover(videoId)} onMouseLeave={handleVideoLeave}>
                          <Image 
                            src={video.thumbnail || video.dynamicCover || video.thumbnails?.[0]?.url || '/placeholder.jpg'} 
                            alt={video.title || video.description} 
                            width={180} 
                            height={320} 
                            className="w-full object-cover aspect-[9/16]" 
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                            onLoad={() => setThumbnailLoadStatus(prev => new Map(prev).set(videoId, true))}
                          />
                          {canPlay && (
                            <div className="absolute inset-0 z-10">
                              <video
                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/tiktok/download/${videoId}`}
                                className={`w-full h-full object-cover transition-opacity duration-300 ${isHoveredVideoLoading ? 'opacity-0' : 'opacity-100'}`}
                                loop
                                playsInline
                                preload="metadata"
                                onCanPlay={() => {
                                  setIsHoveredVideoLoading(false);
                                }}
                                onLoadedData={(e) => {
                                  const el = e.currentTarget as HTMLVideoElement;
                                  try {
                                    el.muted = false;
                                    el.volume = 0.6;
                                    const p = el.play();
                                    if (p && typeof p.then === 'function') {
                                      p.catch(() => {/* autoplay with sound may be blocked */});
                                    }
                                  } catch {}
                                }}
                              />
                            </div>
                          )}
                          {canPlay && isHoveredVideoLoading && thumbnailLoadStatus.get(videoId) && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-20">
                              <div className="flex flex-col items-center">
                                <UilSpinner className="h-8 w-8 text-white animate-spin mb-2" />
                                <p className="text-white text-xs font-semibold">Loading Preview...</p>
                              </div>
                            </div>
                          )}

                        </div>
                        <CardContent className="p-3 flex-grow flex flex-col"><p className="font-bold text-sm line-clamp-2 mb-2 flex-shrink-0 h-10">{video.title || video.description || 'Untitled'}</p><div className="flex items-center gap-2 mt-auto text-xs text-gray-600"><div className="flex items-center gap-1"><UilClock className="h-3 w-3" /><span>{formatDuration(video.duration)}</span></div>{(video.viewCount !== undefined || video.play_count !== undefined || video.views !== 'Unknown') && <><span>·</span><div className="flex items-center gap-1"><UilEye className="h-3 w-3" /><span>{formatViews(video.viewCount ?? video.play_count ?? video.views)}</span></div></>}</div></CardContent>
                      </Card>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <Card className="bg-gray-50"><CardContent className="p-8 text-center"><UilInfoCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" /><h3 className="text-xl font-bold mb-2">NO CONTENT FOUND</h3><p className="text-gray-600">{isDocumentMode ? 'Please go back and upload some documents.' : isUrlMode ? 'Please go back and add some URLs to process.' : 'No videos were found for this channel. Please check the channel name and try again.'}</p></CardContent></Card>
          )}

          <div className="text-center flex gap-4 mt-8"><Button variant="neutral" size="lg" className="flex-1 h-14 text-lg font-black uppercase" onClick={() => handleStepChange(2)}><UilArrowLeft className="mr-2 h-6 w-6" />BACK</Button><Button variant="default" size="lg" className={`flex-1 h-14 text-lg font-black uppercase ${!canProceedFromStep3() ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => setCurrentStep(4)} disabled={!canProceedFromStep3()}><span className="flex items-center justify-center">CONTINUE<UilArrowRight className="ml-2 h-6 w-6" /></span></Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
