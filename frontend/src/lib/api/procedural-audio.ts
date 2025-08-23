import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface AudioConfig {
  prompt: string;
  duration: number;
  intensity: number; // 0-1 for ambiance intensity
  name: string;
}

export interface AudioJob {
  _id: Id<"proceduralAudioJobs">;
  jobId: string;
  userId: string;
  config: AudioConfig;
  status: "pending" | "processing" | "completed" | "failed";
  audioUrl?: string;
  audioId?: string;
  fileName?: string;
  fileSize?: number;
  metadata?: {
    size: string;
    duration: string;
    quality: string;
    format: string;
  };
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  processingTime?: number;
}

export interface GeneratedAudio {
  id: string;
  url: string;
  config: AudioConfig;
  metadata: {
    size: string;
    duration: string;
    quality: string;
  };
}

export class ProceduralAudioService {
  constructor(private userId: string) {}

  // Create a new audio generation job
  async createJob(config: AudioConfig): Promise<string> {
    const jobId = await useMutation(api.proceduralAudio.createJob)({
      config,
      userId: this.userId
    });
    return jobId;
  }

  // Get job status
  async getJob(jobId: string) {
    return useQuery(api.proceduralAudio.getJob, { jobId });
  }

  // Get user's jobs
  async getUserJobs(limit?: number) {
    return useQuery(api.proceduralAudio.getUserJobs, { 
      userId: this.userId, 
      limit 
    });
  }

  // Get active jobs
  async getActiveJobs() {
    return useQuery(api.proceduralAudio.getActiveJobs, { userId: this.userId });
  }

  // Delete job
  async deleteJob(jobId: string) {
    return useMutation(api.proceduralAudio.deleteJob)({ jobId, userId: this.userId });
  }

  // Convert job to GeneratedAudio format
  static toGeneratedAudio(job: AudioJob): GeneratedAudio {
    return {
      id: job.jobId,
      url: job.audioUrl || '',
      config: job.config,
      metadata: {
        size: job.metadata?.size || 'Unknown',
        duration: job.metadata?.duration || `${job.config.duration}s`,
        quality: job.metadata?.quality || '44.1kHz/16-bit'
      }
    };
  }
}

// Hook for real-time job monitoring
export function useAudioJob(jobId: string) {
  return useQuery(api.proceduralAudio.getJob, { jobId });
}

// Hook for user's jobs
export function useUserAudioJobs(limit?: number) {
  // This would need to be implemented with actual user ID
  const userId = "current-user"; // Replace with actual user ID from auth
  return useQuery(api.proceduralAudio.getUserJobs, { userId, limit });
}

// Hook for active jobs
export function useActiveAudioJobs() {
  const userId = "current-user"; // Replace with actual user ID from auth
  return useQuery(api.proceduralAudio.getActiveJobs, { userId });
}