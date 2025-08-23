// RAG input validation utilities

export const RAG_LIMITS = {
  free: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    maxUrls: 10,
    maxYoutubeVideos: 5,
    allowedFormats: ['json'],
    dataRetention: 7, // days
  },
  premium: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 20,
    maxUrls: 50,
    maxYoutubeVideos: 20,
    allowedFormats: ['json', 'jsonl', 'csv'],
    dataRetention: 30, // days
  },
  enterprise: {
    maxFileSize: -1, // unlimited
    maxFiles: -1,
    maxUrls: -1,
    maxYoutubeVideos: -1,
    allowedFormats: ['json', 'jsonl', 'csv', 'parquet', 'pinecone', 'weaviate'],
    dataRetention: -1, // permanent
  },
} as const;

export const ALLOWED_FILE_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.html',
  '.xml',
];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'text/html',
  'application/xml',
  'text/xml',
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateFiles(
  files: File[],
  userTier: keyof typeof RAG_LIMITS = 'free'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const limits = RAG_LIMITS[userTier];
  
  // Check file count
  if (limits.maxFiles !== -1 && files.length > limits.maxFiles) {
    errors.push(`Maximum ${limits.maxFiles} files allowed for ${userTier} tier`);
  }
  
  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (limits.maxFileSize !== -1 && totalSize > limits.maxFileSize) {
    errors.push(
      `Total file size ${formatBytes(totalSize)} exceeds ${formatBytes(limits.maxFileSize)} limit for ${userTier} tier`
    );
  }
  
  // Check individual files
  files.forEach((file, index) => {
    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(extension)) {
      errors.push(`File "${file.name}" has unsupported type ${extension}`);
    }
    
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== '') {
      warnings.push(`File "${file.name}" has unrecognized MIME type: ${file.type}`);
    }
    
    // Check individual file size
    if (file.size > 50 * 1024 * 1024) { // Warn for files over 50MB
      warnings.push(`File "${file.name}" is large (${formatBytes(file.size)}) and may take longer to process`);
    }
    
    // Check file name
    if (file.name.length > 255) {
      errors.push(`File name too long: "${file.name.substring(0, 50)}..."`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateYouTubeUrls(urls: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const validPatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/channel\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/@[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/c\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=[\w-]+/,
  ];
  
  urls.forEach((url, index) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      warnings.push(`Empty URL at line ${index + 1}`);
      return;
    }
    
    const isValid = validPatterns.some(pattern => pattern.test(trimmedUrl));
    if (!isValid) {
      errors.push(`Invalid YouTube URL: "${trimmedUrl}"`);
    }
    
    // Check for playlist URLs
    if (trimmedUrl.includes('/playlist?')) {
      warnings.push('Playlist URLs may take longer to process');
    }
    
    // Check for channel URLs
    if (trimmedUrl.includes('/channel/') || trimmedUrl.includes('/@')) {
      warnings.push('Channel URLs will process recent videos only');
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateWebUrls(urls: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  urls.forEach((url, index) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      warnings.push(`Empty URL at line ${index + 1}`);
      return;
    }
    
    try {
      const parsed = new URL(trimmedUrl);
      
      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.push(`Invalid protocol in URL: "${trimmedUrl}"`);
      }
      
      // Warn about certain domains
      const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
      if (blockedDomains.includes(parsed.hostname)) {
        errors.push(`Cannot access local URLs: "${trimmedUrl}"`);
      }
      
      // Warn about authentication
      if (parsed.username || parsed.password) {
        warnings.push(`URL contains credentials which will be ignored: "${trimmedUrl}"`);
      }
      
    } catch (e) {
      errors.push(`Invalid URL format: "${trimmedUrl}"`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateChunkSettings(
  chunkSize: number,
  overlap: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate chunk size
  if (chunkSize < 100) {
    errors.push('Chunk size must be at least 100 tokens');
  } else if (chunkSize > 2000) {
    warnings.push('Large chunk sizes may reduce embedding quality');
  }
  
  // Validate overlap
  if (overlap < 0) {
    errors.push('Overlap cannot be negative');
  } else if (overlap >= chunkSize) {
    errors.push('Overlap must be less than chunk size');
  } else if (overlap > chunkSize / 2) {
    warnings.push('High overlap will create many redundant embeddings');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function estimateProcessingTime(
  sources: Array<{ type: string; size?: number }>,
  chunkSize: number
): string {
  // Rough estimates based on source type and size
  let totalSeconds = 0;
  
  sources.forEach(source => {
    switch (source.type) {
      case 'youtube':
        totalSeconds += 30; // 30 seconds per video
        break;
      case 'document':
        if (source.size) {
          // Estimate 1 second per 100KB
          totalSeconds += Math.ceil(source.size / (100 * 1024));
        } else {
          totalSeconds += 10;
        }
        break;
      case 'url':
        totalSeconds += 15; // 15 seconds per URL
        break;
    }
  });
  
  // Add embedding time (rough estimate)
  totalSeconds += sources.length * 5;
  
  if (totalSeconds < 60) {
    return `~${totalSeconds} seconds`;
  } else if (totalSeconds < 3600) {
    const minutes = Math.ceil(totalSeconds / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    const hours = Math.ceil(totalSeconds / 3600);
    return `~${hours} hour${hours > 1 ? 's' : ''}`;
  }
}

export function validateExportFormat(
  format: string,
  userTier: keyof typeof RAG_LIMITS = 'free'
): boolean {
  const allowedFormats = RAG_LIMITS[userTier].allowedFormats;
  return allowedFormats.includes(format as any);
}