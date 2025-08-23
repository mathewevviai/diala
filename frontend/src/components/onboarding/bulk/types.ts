export interface ContentItem {
  id: string;
  title: string;
  duration: string;
  views: string;
  likes: string;
  published: string;
  thumbnail?: string;
  url?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  uploadDate: string;
  content?: string; // <-- Added to store text content for previews
  pageCount?: number;
}

export interface BulkSettings {
  chunkSize: number;        // Text chunk size for embedding (512-4096)
  chunkOverlap: number;     // Overlap between chunks (0-200)
  maxTokens: number;        // Maximum tokens per chunk (100-8192)
  // JINA V4 specific settings
  transcriptProcessing?: {
    task: 'retrieval.passage' | 'retrieval.query' | 'text-matching';
    lateChunking: boolean;    // Enable V4 late chunking for long transcripts
    multiVector: boolean;     // Output multi-vector embeddings
    optimizeForRag: boolean;  // Optimize settings for RAG systems
    dimensions: number;       // Embedding dimensions (128-2048)
  };
}

export interface EmbeddingModel {
  id: string;
  label: string;
  Icon: any;
  color: string;
  tooltip: string;
  dimensions: number;
  maxTokens: number;
  description: string;
  githubStars?: number | null;
  parameters?: string;
  mtebScore?: number | null;
  // V4 specific capabilities
  supportsLateChunking?: boolean;
  supportsMultiVector?: boolean;
  supportedTasks?: string[];
  contextLength?: number;
  version?: string;
  isTranscriptOptimized?: boolean;
}

export interface VectorDatabase {
  id: string;
  label: string;
  Icon: any;
  color: string;
  tooltip: string;
  description: string;
  isPremium?: boolean;
  hosting?: string;
  scalability?: string;
  setup?: string;
  bestFor?: string;
  pricing?: string;
  features?: string[];
}

export interface InputMethod {
  id: string;
  label: string;
  Icon: any;
  color: string;
  tooltip: string;
  description: string;
}

export type Platform = 'youtube' | 'twitch' | 'tiktok' | 'documents' | 'web' | '';
export type InputType = 'channel' | 'urls' | 'upload' | '';

export interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  contentProcessed: number;
  totalContent: number;
  embeddings: number;
  error?: string;
  // V4 processing metadata
  transcriptStats?: {
    totalTranscripts: number;
    processedTranscripts: number;
    avgTokensPerTranscript: number;
    chunkingMethod: 'late_chunking' | 'traditional' | 'direct';
    embeddingDimensions: number;
  };
}

export interface BulkOnboardingState {
  currentStep: number;
  selectedPlatform: Platform;
  selectedInputMethod: InputType;
  channelUrl: string;
  pastedUrls: string[];
  selectedContent: string[];
  uploadedDocuments: DocumentItem[];
  selectedDocuments: string[];
  uploadProgress: number;
  selectedEmbeddingModel: EmbeddingModel | null;
  selectedVectorDb: VectorDatabase | null;
  bulkSettings: BulkSettings;
  processingJob: ProcessingJob | null;
  exportFormat: string;
  isLoading: boolean;
  loadProgress: number;
  isProcessing: boolean;
  processProgress: number;
  // V4 specific state
  jinaV4Settings?: JinaV4Settings;
  transcriptProcessingResults?: TranscriptProcessingResult[];
  isTranscriptMode: boolean;
}

export interface StepProps {
  state: BulkOnboardingState;
  setState: (state: Partial<BulkOnboardingState>) => void;
  setCurrentStep: (step: number) => void;
  handleStepChange: (step: number) => void;
  // Content hooks
  tiktokUser?: any;
  tiktokUserLoading?: boolean;
  tiktokUserError?: any;
  fetchTikTokUser?: (username: string) => Promise<void>;
  tiktokVideos?: any[];
  tiktokVideosLoading?: boolean;
  tiktokVideosError?: any;
  fetchTikTokVideos?: (username: string) => Promise<void>;
  youtubeChannel?: any;
  youtubeChannelLoading?: boolean;
  youtubeChannelError?: any;
  fetchYouTubeChannel?: (channelId: string) => Promise<void>;
  youtubeVideos?: any[];
  youtubeVideosLoading?: boolean;
  youtubeVideosError?: any;
  fetchYouTubeVideos?: (channelId: string) => Promise<void>;
  twitchChannel?: any;
  twitchChannelLoading?: boolean;
  twitchChannelError?: any;
  twitchChannelDataComplete?: boolean;
  fetchTwitchChannel?: (username: string) => Promise<void>;
  twitchVideos?: any[];
  twitchVideosLoading?: boolean;
  twitchVideosError?: any;
  fetchTwitchVideos?: (username: string) => Promise<void>;
}

export interface ExportOption {
  id: string;
  label: string;
  Icon: any;
  color: string;
  description: string;
  format: string;
}

export interface VerificationResult {
  totalEmbeddings: number;
  searchAccuracy: number;
  contentQuality: number;
  processingTime: number;
  vectorDbSize: string;
}

export interface ExportFormat {
  id: 'json' | 'csv' | 'parquet' | 'vector';
  label: string;
  Icon: any;
  color: string;
  description: string;
  fileExtension: string;
  mimeType: string;
  features: string[];
}

export interface DownloadInfo {
  jobId: string;
  exportId: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  filename?: string;
  fileSize?: number;
  error?: string;
}

export interface ExportHistoryItem {
  id: string;
  jobId: string;
  format: string;
  filename: string;
  fileSize: number;
  downloadUrl: string;
  createdAt: string;
  status: 'completed' | 'failed';
  expiresAt?: string;
}

export interface BulkProcessingProgress {
  stage: string;
  progress: number;
  contentProcessed: number;
  totalContent: number;
  embeddings: number;
  estimatedTimeRemaining?: number;
  currentOperation?: string;
  // V4 transcript processing progress
  transcriptProgress?: {
    transcriptsProcessed: number;
    totalTranscripts: number;
    currentTranscriptTokens: number;
    avgProcessingTimePerTranscript: number;
    chunkingStrategy: string;
    embeddingModel: string;
    ragOptimization: boolean;
  };
}

// New V4 specific types
export interface TranscriptEmbeddingConfig {
  task: 'retrieval.passage' | 'retrieval.query' | 'text-matching' | 'code.query' | 'code.passage';
  dimensions: number;
  lateChunking: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
  multiVector: boolean;
  optimizeForRag: boolean;
}

export interface JinaV4Settings {
  model: 'jina-embeddings-v4';
  transcriptConfig: TranscriptEmbeddingConfig;
  batchSize: number;
  contextLength: number;
  outputDataType: 'float' | 'binary' | 'base64';
  truncateAtMaxLength: boolean;
}

export interface TranscriptProcessingResult {
  transcriptIndex: number;
  tokenCount: number;
  chunks: number;
  embeddings: number[][];
  chunkMetadata?: any[];
  processingMethod: 'late_chunking' | 'traditional_chunking' | 'direct';
  dimensions: number;
  processingTime: number;
}
