import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';

interface UseRAGWorkflowOptions {
  userId: string;
  onComplete?: (workflowId: string) => void;
  onError?: (error: Error) => void;
}

export function useRAGWorkflow({ userId, onComplete, onError }: UseRAGWorkflowOptions) {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Convex hooks
  const createWorkflow = useMutation(api.ragMutations.createWorkflow);
  const addSource = useMutation(api.ragMutations.addSourceToWorkflow);
  const processWorkflow = useAction(api.ragActions.processRAGWorkflow);
  const exportEmbeddings = useAction(api.ragActions.exportEmbeddings);
  
  // Query workflow status
  const workflowData = useQuery(
    api.ragQueries.getWorkflow,
    workflowId ? { workflowId, userId } : "skip"
  );
  
  const userWorkflows = useQuery(api.ragQueries.getUserWorkflows, { userId });
  const workflowStats = useQuery(api.ragQueries.getWorkflowProcessingStats, { userId });

  // Update progress when workflow data changes
  useEffect(() => {
    if (workflowData) {
      setProgress(workflowData.progress);
      setStatus(workflowData.currentStage || workflowData.status);
      
      if (workflowData.status === 'completed' && onComplete) {
        onComplete(workflowData.workflowId);
      } else if (workflowData.status === 'failed') {
        const error = new Error(workflowData.error || 'Workflow processing failed');
        setError(error.message);
        if (onError) onError(error);
      }
    }
  }, [workflowData, onComplete, onError]);

  const startWorkflow = useCallback(async (
    name: string,
    sourceType: 'youtube' | 'documents' | 'urls' | 'mixed',
    sources: Array<{ type: 'youtube' | 'document' | 'url'; value: string; metadata?: any }>,
    config: { chunkSize: number; overlap: number; embeddingModel?: string }
  ) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Create workflow
      const workflow = await createWorkflow({
        name,
        description: `Processing ${sources.length} sources`,
        sourceType,
        chunkSize: config.chunkSize,
        overlap: config.overlap,
        userId,
      });
      
      setWorkflowId(workflow.workflowId);
      
      // Add sources to workflow
      for (const source of sources) {
        await addSource({
          workflowId: workflow.workflowId,
          source,
          userId,
        });
      }
      
      // Start processing
      await processWorkflow({
        workflowId: workflow.workflowId,
        userId,
        sources,
        config: {
          ...config,
          embeddingModel: config.embeddingModel || 'jina-clip-v2',
        },
      });
      
      return workflow.workflowId;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setIsProcessing(false);
      if (onError) onError(error);
      throw error;
    }
  }, [createWorkflow, addSource, processWorkflow, userId, onError]);

  const exportWorkflow = useCallback(async (
    format: 'json' | 'jsonl' | 'csv' | 'parquet' | 'pinecone' | 'weaviate',
    options: { includeMetadata?: boolean; includeChunks?: boolean } = {}
  ) => {
    if (!workflowId) {
      throw new Error('No workflow to export');
    }
    
    try {
      const result = await exportEmbeddings({
        workflowId,
        userId,
        format,
        includeMetadata: options.includeMetadata ?? true,
        includeChunks: options.includeChunks ?? true,
      });
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      if (onError) onError(error);
      throw error;
    }
  }, [workflowId, userId, exportEmbeddings, onError]);

  const reset = useCallback(() => {
    setWorkflowId(null);
    setIsProcessing(false);
    setProgress(0);
    setStatus('');
    setError(null);
  }, []);

  return {
    // State
    workflowId,
    isProcessing,
    progress,
    status,
    error,
    
    // Data
    workflowData,
    userWorkflows,
    workflowStats,
    
    // Actions
    startWorkflow,
    exportWorkflow,
    reset,
  };
}

// Helper hook for file size validation
export function useRAGFileSizeLimit(userId: string, fileSize: number = 0) {
  const sizeLimit = useQuery(api.ragQueries.checkWorkflowSizeLimit, {
    userId,
    additionalSize: fileSize,
  });
  
  return {
    allowed: sizeLimit?.allowed ?? true,
    error: sizeLimit?.error,
    currentSize: sizeLimit?.currentSize ?? 0,
    maxSize: sizeLimit?.maxSize ?? 0,
    remainingSize: sizeLimit?.remainingSize ?? 0,
    userTier: sizeLimit?.userTier ?? 'free',
  };
}