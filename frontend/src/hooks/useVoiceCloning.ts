import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { v4 as uuidv4 } from 'uuid';
import { 
  createVoiceClone, 
  checkVoiceCloneJobStatus, 
  testVoiceClone,
  VoiceCloneResponse,
  VoiceCloneJobStatus,
  VoiceTestRequest
} from '@/lib/api';

export interface VoiceCloneSettings {
  exaggeration: number;
  cfgWeight: number;
  chunkSize: number;
}

export interface UseVoiceCloningReturn {
  createClone: (
    audioFile: File, 
    voiceName: string, 
    sampleText: string,
    settings: VoiceCloneSettings
  ) => Promise<void>;
  jobId: string | null;
  jobStatus: VoiceCloneJobStatus | null;
  voiceId: string | null;
  sampleAudioUrl: string | null;
  isProcessing: boolean;
  error: string | null;
  testVoice: (text: string) => Promise<string | null>;
  reset: () => void;
}

export function useVoiceCloning(): UseVoiceCloningReturn {
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<VoiceCloneJobStatus | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceCloneSettings | null>(null);

  // Convex query for real-time job status updates
  const convexJob = useQuery(
    api.voiceCloneJobs.getJob,
    jobId ? { jobId } : 'skip'
  );

  // Convex mutation to create job record
  const createJobMutation = useMutation(api.voiceCloneJobs.create);
  const updateJobMutation = useMutation(api.voiceCloneJobs.updateStatus);

  // Update local state when Convex job updates
  useEffect(() => {
    if (convexJob) {
      setJobStatus({
        job_id: convexJob.jobId,
        status: convexJob.status as 'pending' | 'processing' | 'completed' | 'failed',
        voice_id: convexJob.voiceId,
        result_url: convexJob.resultUrl,
        error: convexJob.error,
        created_at: new Date(convexJob._creationTime).toISOString(),
        updated_at: new Date(convexJob._creationTime).toISOString(),
      });

      // Update processing state
      setIsProcessing(convexJob.status === 'pending' || convexJob.status === 'processing');

      // Update voice ID and sample URL when job completes
      if (convexJob.status === 'completed') {
        if (convexJob.voiceId) setVoiceId(convexJob.voiceId);
        if (convexJob.resultUrl) setSampleAudioUrl(convexJob.resultUrl);
      }

      // Set error if job failed
      if (convexJob.status === 'failed' && convexJob.error) {
        setError(convexJob.error);
      }
    }
  }, [convexJob]);

  const createClone = useCallback(async (
    audioFile: File,
    voiceName: string,
    sampleText: string,
    settings: VoiceCloneSettings
  ) => {
    setError(null);
    setIsProcessing(true);
    setVoiceSettings(settings);

    try {
      // Generate unique job ID
      const jobId = uuidv4();
      
      // Create job record in Convex first
      const convexJobId = await createJobMutation({
        jobId,
        userId: 'anonymous', // TODO: Get from user context
        voiceName,
        audioFileUrl: URL.createObjectURL(audioFile),
        sampleText,
      });

      // Call the API to create voice clone
      const response: VoiceCloneResponse = await createVoiceClone({
        audio_file: audioFile,
        voice_name: voiceName,
        sample_text: sampleText,
      });

      if (response.success) {
        // Use the generated jobId instead of response.jobId
        setJobId(jobId);
        
        // Check if this is a 202 response (queued) or 200 (immediate)
        if (response.httpStatus === 202) {
          // Job is queued, update status to pending
          console.log('[useVoiceCloning] Job queued for processing (202 response)');
          
          await updateJobMutation({
            jobId: jobId,
            status: 'pending',
            apiJobId: response.jobId,
            settings: {
              exaggeration: settings.exaggeration,
              cfgWeight: settings.cfgWeight,
              chunkSize: settings.chunkSize,
            },
            sampleText,
          });
          
          // The polling mechanism in useEffect will handle status updates
        } else {
          // 200 response - immediate results (dev mode)
          console.log('[useVoiceCloning] Immediate processing (200 response)');
          
          // Update Convex job with processing status
          await updateJobMutation({
            jobId: jobId,
            status: 'processing',
            apiJobId: response.jobId,
            settings: {
              exaggeration: settings.exaggeration,
              cfgWeight: settings.cfgWeight,
              chunkSize: settings.chunkSize,
            },
            sampleText,
          });

          // If response includes immediate results
          if (response.voice_id) {
            setVoiceId(response.voice_id);
            
            // Update Convex job as completed
            await updateJobMutation({
              jobId: jobId,
              status: 'completed',
              voiceId: response.voice_id,
              resultUrl: response.sample_audio,
            });
          }
          
          if (response.sample_audio) {
            setSampleAudioUrl(response.sample_audio);
          }
        }
      } else {
        throw new Error(response.message || 'Voice cloning failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create voice clone';
      setError(errorMessage);
      setIsProcessing(false);
      console.error('[useVoiceCloning] Error creating clone:', err);
    }
  }, [createJobMutation, updateJobMutation]);

  const testVoice = useCallback(async (text: string): Promise<string | null> => {
    if (!voiceId || !voiceSettings) {
      console.error('[useVoiceCloning] No voice ID or settings available for testing');
      return null;
    }

    try {
      const request: VoiceTestRequest = {
        text,
        voice_settings: {
          exaggeration: voiceSettings.exaggeration,
          cfg_weight: voiceSettings.cfgWeight,
          chunk_size: voiceSettings.chunkSize,
        },
      };

      const response = await testVoiceClone(voiceId, request);
      
      if (response.success && response.audio_url) {
        return response.audio_url;
      }
      
      return null;
    } catch (err) {
      console.error('[useVoiceCloning] Error testing voice:', err);
      return null;
    }
  }, [voiceId, voiceSettings]);

  const reset = useCallback(() => {
    setJobId(null);
    setJobStatus(null);
    setVoiceId(null);
    setSampleAudioUrl(null);
    setIsProcessing(false);
    setError(null);
    setVoiceSettings(null);
  }, []);

  // Poll for job status (both as fallback for Convex and primary method)
  useEffect(() => {
    if (!jobId || !isProcessing) return;

    // If Convex is working and has completed status, skip polling
    if (convexJob && (convexJob.status === 'completed' || convexJob.status === 'failed')) {
      return;
    }

    console.log('[useVoiceCloning] Starting status polling for job:', jobId);
    
    const pollInterval = setInterval(async () => {
      try {
        const status = await checkVoiceCloneJobStatus(jobId);
        console.log('[useVoiceCloning] Poll status:', status);
        
        setJobStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          setIsProcessing(false);
          clearInterval(pollInterval);

          if (status.status === 'completed') {
            if (status.voice_id) {
              setVoiceId(status.voice_id);
              console.log('[useVoiceCloning] Voice cloning completed, voice_id:', status.voice_id);
            }
            if (status.result_url) {
              setSampleAudioUrl(status.result_url);
              console.log('[useVoiceCloning] Sample audio URL:', status.result_url);
            }
            
            // Update Convex job if not already updated
            if (!convexJob || convexJob.status !== 'completed') {
              await updateJobMutation({
                jobId: jobId,
                status: 'completed',
                voiceId: status.voice_id,
                resultUrl: status.result_url,
              });
            }
          } else if (status.error) {
            setError(status.error);
            console.error('[useVoiceCloning] Job failed:', status.error);
            
            // Update Convex job if not already updated
            if (!convexJob || convexJob.status !== 'failed') {
              await updateJobMutation({
                jobId: jobId,
                status: 'failed',
                error: status.error,
              });
            }
          }
        }
      } catch (err) {
        console.error('[useVoiceCloning] Error polling job status:', err);
        // Don't stop polling on error - the backend might be temporarily unavailable
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, isProcessing, convexJob, updateJobMutation]);

  return {
    createClone,
    jobId,
    jobStatus,
    voiceId,
    sampleAudioUrl,
    isProcessing,
    error,
    testVoice,
    reset,
  };
}