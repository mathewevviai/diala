// frontend/src/hooks/useBulkProcessing.ts
import { useState, useCallback } from 'react';
import { useAction, useMutation } from 'convex/react';
// CORRECTED: Revert to using the standard '@/' path alias.
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';

// This is the old, large options object that ProcessingStep.tsx sends.
// We make our hook compatible with it but will only use what's necessary.
interface LegacyBulkProcessingOptions {
  platform: string;
  inputMethod: string;
  channelUrl?: string;
  pastedUrls?: string[];
  selectedContent: string[];
  uploadedDocuments?: any[]; // This is the part we actually need
  embeddingModel: any;
  vectorDb: any;
  bulkSettings: {
    chunkSize: number;
    chunkOverlap: number;
    maxTokens: number;
    transcriptProcessing?: any;
  };
}

export interface BulkProcessingResult {
  success: boolean;
  jobId?: Id<"bulkJobs">;
  message?: string;
}

export function useBulkProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<Id<"bulkJobs"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hook into the new Convex functions
  const generateUploadUrl = useAction(api.files.generateUploadUrl);
  // We use the internal mutation directly for simplicity here
  const createJob = useMutation(api.bulkJobs.createJobMutation); 
  const addDocument = useAction(api.ragActions.addDocument);

  const startBulkProcessing = useCallback(
    async (options: LegacyBulkProcessingOptions): Promise<BulkProcessingResult> => {
      setIsProcessing(true);
      setError(null);
      setJobId(null);
      console.log('[useBulkProcessing] Starting NEW Convex RAG processing:', options);
      console.log('[useBulkProcessing] Platform:', options.platform);
      console.log('[useBulkProcessing] Documents to process:', options.uploadedDocuments?.length || 0);
      console.log('[useBulkProcessing] Embedding model:', options.embeddingModel?.label);
      console.log('[useBulkProcessing] Vector DB:', options.vectorDb?.label);
      
      // Extract only the document files we need from the legacy options object.
      const documentsToProcess = options.uploadedDocuments?.map(doc => doc.file).filter(file => file instanceof File) as File[] | undefined;

      if (!documentsToProcess || documentsToProcess.length === 0) {
        const msg = 'No valid documents found in processing options.';
        setError(msg);
        setIsProcessing(false);
        return { success: false, message: msg };
      }

      // For this workflow, we process one document at a time.
      const document = documentsToProcess[0];

      try {
        // 1. Create a job record in Convex to track the process.
        const newJobId = await createJob({
          userId: "user-placeholder", // Replace with actual authenticated user ID
          fileName: document.name,
          fileSize: document.size,
        });
        setJobId(newJobId);

        // 2. Upload the file to backend storage instead of Convex
        const backendUploadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/public/storage/upload`;
        console.log('[useBulkProcessing] Uploading to backend:', backendUploadUrl);

        const formData = new FormData();
        formData.append('file', document);

        const uploadResponse = await fetch(backendUploadUrl, {
          method: "POST",
          body: formData,
          mode: 'cors',
          credentials: 'omit'
        });

        console.log('[useBulkProcessing] Upload response status:', uploadResponse.status);
        console.log('[useBulkProcessing] Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('[useBulkProcessing] Upload failed:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            errorText: errorText.substring(0, 500)
          });
          throw new Error(`Failed to upload file to backend storage: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        
        const responseData = await uploadResponse.json();
        console.log('[useBulkProcessing] Upload successful, file path:', responseData.file_path);
        const filePath = responseData.file_path;
        
      console.log('[useBulkProcessing] Triggering RAG processing with file:', filePath);
      
      // 5. Trigger processing with the backend file path
      await addDocument({
        storageId: filePath, // Use file path as storage ID
        jobId: newJobId,
        namespace: `user_placeholder_namespace`, // Create a unique namespace per user
        fileName: document.name,
      });
      
      console.log('[useBulkProcessing] RAG processing initiated successfully');
        return { success: true, jobId: newJobId, message: 'Document processing initiated.' };
      } catch (e: any) {
        const errorMessage = e.message || 'An unknown error occurred.';
        console.error('[useBulkProcessing] Error:', e);
        setError(errorMessage);
        if (jobId) {
          // Optionally update the job status to "failed" here
        }
        return { success: false, message: errorMessage };
      } finally {
        setIsProcessing(false);
      }
    },
    [generateUploadUrl, createJob, addDocument, jobId]
  );

  // Return a simplified interface, as many old states are no longer needed.
  return {
    isProcessing,
    jobId,
    processingJob: jobId, // Keep for compatibility if needed
    processProgress: 0, // Mock progress, real progress is in the jobStatus query
    error,
    startBulkProcessing,
    // Mock old functions to prevent crashes if they are still called
    exportResults: async () => console.warn("Export logic needs to be migrated to Convex."),
    downloadFile: async () => console.warn("Download logic needs to be migrated."),
    cleanup: () => {},
  };
}
