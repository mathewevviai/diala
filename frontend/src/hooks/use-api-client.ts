import { useState, useCallback } from 'react';
import { startCall as apiStartCall } from '@/lib/api';
import { StartCallRequest, StartCallResponse } from '@/types';
import { useApiErrorHandler } from './useApiErrorHandler';

export function useApiClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useApiErrorHandler();

  const startCall = useCallback(async (data: StartCallRequest): Promise<StartCallResponse | null> => {
    console.log('[Hook] useApiClient.startCall called with', data);
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiStartCall(data);
      console.log('[Hook] Call started successfully', response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('[Hook] Failed to start call', { error: err, message: errorMessage });
      setError(errorMessage);
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    startCall,
    loading,
    error,
  };
}