'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UilSpinner, UilCheckSquare, UilTrash, UilClock, UilEye, UilThumbsUp, UilMusic, UilPlay, UilCheckCircle, UilInfoCircle, UilExclamationTriangle } from '@tooni/iconscout-unicons-react';


interface VideoSelectionGridProps {
  videos: any[];
  channel: any;
  platform: 'youtube' | 'tiktok' | 'twitch';
  loading: boolean;
  error: string | null;
  selectedVideos: string[];
  onVideoSelectionChange: (videoIds: string[], videos: any[]) => void;
}

export function VideoSelectionGrid({
  videos,
  channel,
  platform,
  loading,
  error,
  selectedVideos,
  onVideoSelectionChange
}: VideoSelectionGridProps) {

  const [hoveredVideoId, setHoveredVideoId] = React.useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = React.useState<Set<string>>(new Set());

  const [videoLoadingStates, setVideoLoadingStates] = React.useState<Map<string, 'idle' | 'preparing' | 'loading' | 'canplay' | 'loaded'>>(new Map());
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const videoLoadTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const hoverStartTime = React.useRef<number | null>(null);

  // Preload videos using download endpoint
  React.useEffect(() => {
    if (platform === 'tiktok' && videos.length > 0) {
      const videosToPreload = videos.slice(0, 5);
      
      console.log('[VideoSelectionGrid] Starting prefetch for first', videosToPreload.length, 'videos');
      
      // Use a small delay to not interfere with initial page load
      const prefetchTimeout = setTimeout(() => {
        videosToPreload.forEach((video, index) => {
          const videoId = video.id || video.video_id || video.videoId;
          
          // Preload video using hidden video element
          const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/tiktok/download/${videoId}?user_id=preview-user`;
          
          // Create hidden video element for preloading
          const preloadVideo = document.createElement('video');
          preloadVideo.src = downloadUrl;
          preloadVideo.preload = 'auto';
          preloadVideo.style.display = 'none';
          document.body.appendChild(preloadVideo);
          
          // Remove after loading
          preloadVideo.addEventListener('loadeddata', () => {
            document.body.removeChild(preloadVideo);
            console.log('[VideoSelectionGrid] Prefetched video', index + 1, ':', videoId);
          });
          
          preloadVideo.load();
        });
      }, 500); // Reduced delay for faster loading
      
      return () => clearTimeout(prefetchTimeout);
    }
  }, [platform, videos]);

  const updateVideoLoadingState = React.useCallback((videoId: string, state: 'idle' | 'preparing' | 'loading' | 'canplay' | 'loaded') => {
    setVideoLoadingStates(prev => new Map(prev).set(videoId, state));
  }, []);

  const getVideoLoadingState = React.useCallback((videoId: string) => {
    return videoLoadingStates.get(videoId) || 'idle';
  }, [videoLoadingStates]);

  const handleVideoHover = React.useCallback((videoId: string, videoUrl?: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (videoLoadTimeoutRef.current) {
      clearTimeout(videoLoadTimeoutRef.current);
    }

    setHoveredVideoId(videoId);
    hoverStartTime.current = Date.now();
    updateVideoLoadingState(videoId, 'preparing');

    if (platform === 'tiktok') {
      // Use direct download endpoint instead of preview system
      hoverTimeoutRef.current = setTimeout(() => {
        updateVideoLoadingState(videoId, 'loading');
        
        // The video will load from the download endpoint
        setTimeout(() => {
          updateVideoLoadingState(videoId, 'loaded');
        }, 300);
      }, 150); // Reduced delay for faster response
    }
  }, [platform, updateVideoLoadingState]);

  const handleVideoLeave = React.useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (videoLoadTimeoutRef.current) {
      clearTimeout(videoLoadTimeoutRef.current);
      videoLoadTimeoutRef.current = null;
    }

    setHoveredVideoId(null);
    hoverStartTime.current = null;

    if (hoveredVideoId) {
      updateVideoLoadingState(hoveredVideoId, 'idle');
    }
  }, [hoveredVideoId, platform, updateVideoLoadingState]);

  const handleAudioToggle = React.useCallback((videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  }, []);

  const toggleVideoSelection = (videoId: string, video: any) => {
    const newSelected = selectedVideos.includes(videoId)
      ? selectedVideos.filter(id => id !== videoId)
      : [...selectedVideos, videoId];

    const selectedVideoObjects = videos.filter(v => newSelected.includes(v.id || v.video_id || v.videoId));
    onVideoSelectionChange(newSelected, selectedVideoObjects);
  };

  const selectAllVideos = () => {
    const allVideoIds = videos.map(v => v.id || v.video_id || v.videoId);
    onVideoSelectionChange(allVideoIds, videos);
  };

  const clearAllVideos = () => {
    onVideoSelectionChange([], []);
  };

  const formatViews = (views: string | number) => {
    if (!views || views === 'Unknown') return 'Unknown';
    if (typeof views === 'number') {
      if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
      if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
      return views.toString();
    }
    return views;
  };

  const formatDuration = (duration: string | number) => {
    if (!duration || duration === 'Unknown' || duration === 'N/A') return 'N/A';
    
    if (typeof duration === 'string' && duration.startsWith('PT')) {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        const hours = match[1] ? parseInt(match[1]) : 0;
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const seconds = match[3] ? parseInt(match[3]) : 0;
        
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    
    return duration.toString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase">Loading Videos...</h3>
          <Badge variant="secondary" className="bg-cyan-100 border-2 border-black">Fetching content</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <CardContent className="p-4">
                <div className="bg-gray-200 animate-pulse w-full h-32 mb-3 rounded border border-gray-200" />
                <div className="bg-gray-300 animate-pulse h-4 w-3/4 mb-2" />
                <div className="bg-gray-300 animate-pulse h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-400 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <UilExclamationTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Error Loading Videos</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (videos.length === 0) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-8 text-center">
          <div className="flex items-center gap-3 justify-center mb-4">
            <UilInfoCircle className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">NO VIDEOS FOUND</h3>
          <p className="text-gray-600">
            No videos were found for this channel. Please check the channel name and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Channel Info */}
      {channel && (
        <Card className="bg-orange-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {channel.avatar && (
                <Image
                  src={channel.avatar || channel.profileImage}
                  alt={channel.username || channel.title}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full border-2 border-black"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-black uppercase">
                  {channel.username || channel.channelName || channel.displayName || channel.title || channel.display_name}
                </h3>
                {channel.follower_count !== undefined && (
                  <p className="text-sm text-gray-700">{formatViews(channel.follower_count)} followers</p>
                )}
                {channel.followerCount !== undefined && (
                  <p className="text-sm text-gray-700">{formatViews(channel.followerCount)} followers</p>
                )}
                {channel.subscriberCount !== undefined && (
                  <p className="text-sm text-gray-700">{formatViews(parseInt(channel.subscriberCount))} subscribers</p>
                )}
                {platform === 'tiktok' && channel.heartCount && (
                  <p className="text-sm text-gray-700">{formatViews(channel.heartCount)} hearts</p>
                )}
                {platform === 'tiktok' && channel.videoCount && (
                  <p className="text-sm text-gray-700">{formatViews(channel.videoCount)} videos</p>
                )}
                {channel.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{channel.description}</p>
                )}
                {platform === 'tiktok' && channel.signature && (
                  <p className="text-sm text-gray-600 mt-2 italic">&quot;{channel.signature}&quot;</p>
                )}
              </div>
              <Badge variant="default" className="bg-orange-500 text-white">
                {videos.length} videos found
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TikTok Preview Tip */}
      {platform === 'tiktok' && (
        <Card className="bg-blue-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UilInfoCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-bold text-sm">Video Preview Tip</p>
                <p className="text-xs text-gray-700">Hover and hold on a video for 0.5 seconds to see a preview</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="neutral"
            size="sm"
            onClick={selectAllVideos}
            className="h-10"
          >
            <UilCheckSquare className="h-4 w-4 mr-2" />
            SELECT ALL
          </Button>
          <Button
            variant="neutral"
            size="sm"
            onClick={clearAllVideos}
            className="h-10"
          >
            <UilTrash className="h-4 w-4 mr-2" />
            CLEAR ALL
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          {selectedVideos.length} / {videos.length} selected
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {videos.map((video, index) => {
  const videoId = video.id || video.video_id || video.videoId;
  const isSelected = selectedVideos.includes(videoId);
  const isHovered = hoveredVideoId === videoId;
          return (
            <div
              key={videoId || `video-${index}`}
              className="relative cursor-pointer transform transition-all hover:scale-105"
              onClick={() => toggleVideoSelection(videoId, video)}
            >
              <Card className={`border-4 border-border overflow-hidden shadow-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${
                isSelected ? 'ring-4 ring-orange-500 bg-orange-50' : 'bg-background'
              }`}>
                <div
                  className="relative"
                  onMouseEnter={() => handleVideoHover(videoId, video.url || video.videoUrl)}
                  onMouseLeave={handleVideoLeave}
                >
                  {/* Base thumbnail */}
                <Image
                  src={video.thumbnail || video.dynamicCover || video.thumbnails?.[0]?.url || '/placeholder.jpg'}
                  alt={video.title || video.description}
                  width={180}
                  height={320}
                  className={`w-full object-cover aspect-[9/16]`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.jpg';
                  }}
                />
                   {/* Video overlay - shown when video is available */}
                   {isHovered && video.playAddr && (
                     <div className="absolute inset-0 z-10">
                <video
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/tiktok/download/${videoId}`}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${getVideoLoadingState(videoId) === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                  loop
                  playsInline
                  preload="metadata"
                  onCanPlay={() => {
                    // Mark as ready; fade-in will occur via className
                    updateVideoLoadingState(videoId, 'loaded');
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
                   {/* Loading overlay - hidden when loaded */}
                   {isHovered && getVideoLoadingState(videoId) !== 'loaded' && (
                     <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center transition-opacity duration-300">
                       <div className="flex flex-col items-center">
                         <UilSpinner className="h-8 w-8 text-white animate-spin mb-2" />
                         <p className="text-white text-xs font-semibold">Loading...</p>
                       </div>
                     </div>
                   )}
                  {/* Error overlay */}
                  {isHovered && preview?.error && (
                    <div className="absolute inset-0 bg-red-900 bg-opacity-50 flex flex-col items-center justify-center p-2">
                      <p className="text-white text-xs font-bold text-center">Preview unavailable</p>
                      <p className="text-white text-xs mt-1">Try hovering again</p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity" />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 border-2 border-black flex items-center justify-center">
                      <UilCheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                <CardContent className="p-3">
                  <p className="font-bold text-sm line-clamp-2">
                    {video.title || video.description || 'Untitled'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <UilClock className="h-3 w-3" />
                      <span>{formatDuration(video.duration || 0)}</span>
                    </div>
                    {video.viewCount !== undefined && (
                      <>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <UilEye className="h-3 w-3" />
                          <span>{formatViews(video.viewCount)}</span>
                        </div>
                      </>
                    )}
                    {video.play_count !== undefined && (
                      <>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <UilEye className="h-3 w-3" />
                          <span>{formatViews(video.play_count)}</span>
                        </div>
                      </>
                    )}
                    {video.likes !== undefined && (
                      <>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <UilThumbsUp className="h-3 w-3" />
                          <span>{formatViews(video.likes)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {platform === 'tiktok' && (video.musicTitle || video.musicAuthor) && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <UilMusic className="h-3 w-3" />
                      {video.musicTitle && video.musicAuthor ? `${video.musicTitle} - ${video.musicAuthor}` : 
                       video.musicTitle || video.musicAuthor}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}