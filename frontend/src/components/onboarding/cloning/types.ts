export interface ContentItem {
  id: string;
  title: string;
  duration: string;
  views: string;
  likes: string;
  published: string;
  thumbnail?: string;
}

export interface VoiceSettings {
  exaggeration: number;    // Controls expressiveness (0.25-2.0)
  cfgWeight: number;       // CFG/Pace control (0.5-3.0)
  chunkSize: number;       // Audio generation chunk size (512-4096)
}

export interface ModelVoice {
  id: string;
  name: string;
}

export interface ModelData {
  id: string;
  label: string;
  Icon: any;
  color: string;
  tooltip: string;
  imageSrc: string | null;
  voices: ModelVoice[];
}

export type Platform = 'youtube' | 'twitch' | 'tiktok' | 'upload' | '';

export interface StepProps {
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;
  channelName: string;
  setChannelName: (name: string) => void;
  selectedContent: string[];
  setSelectedContent: (content: string[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadProgress: number;
  setLoadProgress: (progress: number) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  processProgress: number;
  setProcessProgress: (progress: number) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  audioUrl: string;
  setAudioUrl: (url: string) => void;
  processingProgress: number;
  setProcessingProgress: (progress: number) => void;
  voiceCloneReady: boolean;
  setVoiceCloneReady: (ready: boolean) => void;
  selectedAction: string | null;
  setSelectedAction: (action: string | null) => void;
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
  showVerificationModal: boolean;
  setShowVerificationModal: (show: boolean) => void;
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => void;
  selectedModel: ModelData | null;
  setSelectedModel: (model: ModelData | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  // Hook data
  tiktokUser: any;
  tiktokUserLoading: boolean;
  tiktokUserError: any;
  fetchTikTokUser: (username: string) => Promise<void>;
  tiktokVideos: any[];
  tiktokVideosLoading: boolean;
  tiktokVideosError: any;
  fetchTikTokVideos: (username: string) => Promise<void>;
  downloadTikTokVideos: (username: string, videoIds: string[]) => Promise<void>;
  tiktokDownloadProgress: number;
  tiktokDownloadStatus: string;
  youtubeChannel: any;
  youtubeChannelLoading: boolean;
  youtubeChannelError: any;
  fetchYouTubeChannel: (channelId: string) => Promise<void>;
  youtubeVideos: any[];
  youtubeVideosLoading: boolean;
  youtubeVideosError: any;
  fetchYouTubeVideos: (channelId: string) => Promise<void>;
  downloadYouTubeVideos: (channelId: string, videoIds: string[]) => Promise<void>;
  youtubeDownloadProgress: number;
  youtubeDownloadStatus: string;
  twitchChannel: any;
  twitchChannelLoading: boolean;
  twitchChannelError: any;
  twitchChannelDataComplete: boolean;
  fetchTwitchChannel: (username: string) => Promise<void>;
  twitchVideos: any[];
  twitchVideosLoading: boolean;
  twitchVideosError: any;
  fetchTwitchVideos: (username: string) => Promise<void>;
  downloadTwitchVideos: (username: string, videoIds: string[]) => Promise<void>;
  twitchDownloadProgress: number;
  twitchDownloadStatus: string;
}