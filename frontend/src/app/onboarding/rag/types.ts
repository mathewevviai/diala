export interface AdvancedSettings {
  chunkSize: number;
  overlap: number;
  embeddingModel: string;
  vectorStore: string;
}

export interface WorkflowStats {
  totalContent: string;
  charactersIndexed: string;
  embeddingsGenerated: string;
  indexSize: string;
  processingTime: string;
}

export interface SourceData {
  type: string;
  value: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    content?: string;
  };
}

export type SourceType = 'youtube' | 'tiktok' | 'twitch' | 'documents' | 'urls' | 'csv';