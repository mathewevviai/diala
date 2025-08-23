import { useCallback } from 'react';
import { useApiErrorHandler } from './useApiErrorHandler';

export function useConvexErrorHandler() {
  const { handleError } = useApiErrorHandler();

  const handleConvexError = useCallback((error: any) => {
    // Convex errors might have different structure
    // Check if it's an authentication error
    if (error.message?.includes('Unauthorized') || 
        error.message?.includes('401') ||
        error.message?.includes('authentication') ||
        error.message?.includes('unauthenticated')) {
      // Create a proper error object with status
      const authError = new Error(error.message);
      (authError as any).status = 401;
      handleError(authError);
      return;
    }

    // Handle rate limit errors
    if (error.message?.includes('rate limit') || 
        error.message?.includes('too many requests')) {
      const rateLimitError = new Error(error.message);
      (rateLimitError as any).status = 429;
      handleError(rateLimitError);
      return;
    }

    // Pass through other errors
    handleError(error);
  }, [handleError]);

  return { handleConvexError };
}