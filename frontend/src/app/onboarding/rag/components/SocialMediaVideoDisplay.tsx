'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Fallback skeleton component since @/components/ui/skeleton doesn't exist
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
);
import { Checkbox } from '@/components/ui/checkbox';
import { UilClock, UilEye, UilExclamationTriangle } from '@tooni/iconscout-unicons-react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { toast } from 'sonner';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  viewCount?: string;
  url: string;
  channel?: string;
  publishedAt?: string;
  selected?: boolean;
}

interface SocialMediaVideoDisplayProps {
  sourceType: 'youtube' | 'tiktok' | 'twitch';
  channelUrl: string;
  onVideosLoaded?: (videos: Video[]) => void;
  onVideoSelectionChange?: (selectedVideos: Video[]) => void;
}

export function SocialMediaVideoDisplay({ 
  sourceType, 
  channelUrl, 
  onVideosLoaded, 
  onVideoSelectionChange 
}: SocialMediaVideoDisplayProps) {
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = React.useState<Set<string>>(new Set());
  
  const fetchChannelVideos = useAction(api.ragActions.fetchChannelVideos);

  const isValidUrl = React.useCallback((url: string) => {
    if (!url.trim()) return false;
    
    const patterns = {
      youtube: /(?:youtube\.com|youtu\.be)/,
      tiktok: /(?:tiktok\.com|tiktok)/,
      twitch: /(?:twitch\.tv|twitch)/
    };
    
    return patterns[sourceType].test(url);
  }, [sourceType]);

  const loadVideos = React.useCallback(async () => {
    if (!channelUrl || !isValidUrl(channelUrl)) {
      setVideos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchChannelVideos({
        url: channelUrl,
        platform: sourceType,
        maxVideos: 50
      });

      if (result.videos && result.videos.length > 0) {
        const formattedVideos = result.videos.map((video: any) => ({
          id: video.id,
          title: video.title || 'Untitled Video',
          thumbnail: video.thumbnail || '/placeholder-thumbnail.jpg',
          duration: video.duration || 'N/A',
          viewCount: video.viewCount ? formatViewCount(video.viewCount) : undefined,
          url: video.url,
          channel: video.channel,
          publishedAt: video.publishedAt,
          selected: true
        }));

        setVideos(formattedVideos);
        setSelectedVideos(new Set(formattedVideos.map(v => v.id)));
        onVideosLoaded?.(formattedVideos);
        
        // Auto-select all videos by default
        const allSelected = formattedVideos.filter(v => v.selected);
        onVideoSelectionChange?.(allSelected);
      } else {
        setVideos([]);
        setError('No videos found. Please check the URL and try again.');
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setError('Failed to load videos. Please check the URL and try again.');
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [channelUrl, sourceType, fetchChannelVideos, onVideosLoaded, isValidUrl, onVideoSelectionChange]);

  React.useEffect(() => {
    if (channelUrl && isValidUrl(channelUrl)) {
      const debounceTimer = setTimeout(() => {
        loadVideos();
      }, 1000);

      return () => clearTimeout(debounceTimer);
    }
  }, [channelUrl, loadVideos, isValidUrl]);

  const handleVideoToggle = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
    
    const selectedVideoObjects = videos.filter(v => newSelected.has(v.id));
    onVideoSelectionChange?.(selectedVideoObjects);
  };

  const handleSelectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
      onVideoSelectionChange?.([]);
    } else {
      setSelectedVideos(new Set(videos.map(v => v.id)));
      onVideoSelectionChange?.(videos);
    }
  };

  const formatViewCount = (count: number | string) => {
    const num = typeof count === 'string' ? parseInt(count) : count;
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDuration = (duration: string) => {
    if (duration === 'N/A') return duration;
    
    // Handle YouTube duration format (PT1H23M45S)
    if (duration.startsWith('PT')) {
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
    
    return duration;
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
                <Skeleton className="w-full h-32 mb-3 rounded border border-gray-200" />
                <Skeleton className="h-4 w-3/4 mb-2 bg-gray-300" />
                <Skeleton className="h-3 w-1/2 bg-gray-300" />
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
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold uppercase">Found Videos</h3>
          <p className="text-sm text-gray-600">
            {videos.length} videos found • {selectedVideos.size} selected
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="border-2 border-black"
        >
          {selectedVideos.size === videos.length ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {videos.map((video) => (
          <Card key={video.id} className="border-2 border-black hover:border-cyan-500 transition-colors">
            <CardContent className="p-4">
              <div className="relative mb-3">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded border border-gray-300"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <UilClock className="h-3 w-3" />
                  {formatDuration(video.duration)}
                </div>
                {video.viewCount && (
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <UilEye className="h-3 w-3" />
                    {video.viewCount}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  checked={selectedVideos.has(video.id)}
                  onCheckedChange={() => handleVideoToggle(video.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                    {video.title}
                  </h4>
                  {video.publishedAt && (
                    <p className="text-xs text-gray-600">
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}