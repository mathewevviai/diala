import { useCallback } from 'react';
import { toast } from 'sonner';

export function useApiErrorHandler() {
  const handleError = useCallback((error: any) => {
    console.error('[API Error]', error);

    // Check if it's a 401 Unauthorized error
    if (error.status === 401 || error.message?.includes('401')) {
      toast.error('Authentication Required', {
        description: 'Please sign in to continue'
      });
      return;
    }

    // Check for rate limit errors
    if (error.status === 429 || error.message?.includes('rate limit')) {
      toast.error('Too Many Requests', {
        description: 'Please wait a moment before trying again',
      });
      return;
    }

    // Check for network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
      toast.error('Connection Error', {
        description: 'Please check your internet connection and try again',
      });
      return;
    }

    // Generic error handler
    toast.error('Something went wrong', {
      description: error.message || 'An unexpected error occurred',
    });
  }, []);

  return { handleError };
}