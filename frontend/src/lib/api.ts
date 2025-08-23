import { StartCallRequest, StartCallResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'your-secret-key-here';

export interface VoiceCloneRequest {
  audio_file: File;
  user_id?: string;
  voice_name?: string;
  sample_text?: string;
}

export interface VoiceCloneResponse {
  success: boolean;
  jobId: string;
  message?: string;
  voice_id?: string;
  sample_audio?: string;
  httpStatus?: number;
  status?: string;
  statusUrl?: string;
}

export interface VoiceCloneJobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  voice_id?: string;
  result_url?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface VoiceTestRequest {
  text: string;
  voice_settings?: {
    exaggeration?: number;
    cfg_weight?: number;
    chunk_size?: number;
  };
}

export interface VoiceTestResponse {
  success: boolean;
  audio_url: string;
}

class APIClient {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    console.log('[API] Initializing API client', { baseURL, apiKeyLength: apiKey.length });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    console.log('[API] Making request', { 
      method: options.method || 'GET', 
      url, 
      hasBody: !!options.body 
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('[API] Response received', {
        status: response.status,
        statusText: response.statusText,
        url,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[API] Request failed', {
          status: response.status,
          errorData,
        });
        const error = new Error(errorData.detail || `Request failed with status ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      console.log('[API] Response data', data);
      return data;
    } catch (error) {
      console.error('[API] Request error', { url, error });
      throw error;
    }
  }

  async startCall(data: StartCallRequest): Promise<StartCallResponse> {
    console.log('[API] Starting call with data', data);
    return this.request<StartCallResponse>('/call/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createVoiceClone(data: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    console.log('[API] Creating voice clone', { 
      fileName: data.audio_file.name,
      fileSize: data.audio_file.size,
      voiceName: data.voice_name 
    });

    const formData = new FormData();
    formData.append('audio_file', data.audio_file);
    if (data.user_id) formData.append('user_id', data.user_id);
    if (data.voice_name) formData.append('voice_name', data.voice_name);
    if (data.sample_text) formData.append('sample_text', data.sample_text);

    const response = await fetch(`${this.baseURL}/api/public/voice/onboarding/clone`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
      },
      body: formData,
    });

    console.log('[API] Voice clone response status', {
      status: response.status,
      statusText: response.statusText,
    });

    // Handle both 200 (immediate) and 202 (queued) as success
    if (!response.ok && response.status !== 202) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] Voice clone request failed', {
        status: response.status,
        errorData,
      });
      const error = new Error(errorData.detail || `Voice clone failed with status ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    const responseData = await response.json();
    console.log('[API] Voice clone response', {
      status: response.status,
      data: responseData,
    });
    
    // Add status to response data for frontend handling
    return {
      ...responseData,
      httpStatus: response.status,
    };
  }

  async checkVoiceCloneJobStatus(jobId: string): Promise<VoiceCloneJobStatus> {
    console.log('[API] Checking voice clone job status', { jobId });
    return this.request<VoiceCloneJobStatus>(`/api/public/voice/onboarding/jobs/${jobId}/status`, {
      method: 'GET',
    });
  }

  async testVoiceClone(voiceId: string, data: VoiceTestRequest): Promise<VoiceTestResponse> {
    console.log('[API] Testing voice clone', { voiceId, text: data.text });
    return this.request<VoiceTestResponse>(`/api/public/voice/onboarding/test/${voiceId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteVoiceClone(voiceId: string): Promise<{ success: boolean; message: string }> {
    console.log('[API] Deleting voice clone', { voiceId });
    return this.request<{ success: boolean; message: string }>(`/api/public/voice/onboarding/${voiceId}`, {
      method: 'DELETE',
    });
  }
}

const apiClient = new APIClient(API_BASE_URL, API_KEY);

export const startCall = (data: StartCallRequest) => apiClient.startCall(data);
export const createVoiceClone = (data: VoiceCloneRequest) => apiClient.createVoiceClone(data);
export const checkVoiceCloneJobStatus = (jobId: string) => apiClient.checkVoiceCloneJobStatus(jobId);
export const testVoiceClone = (voiceId: string, data: VoiceTestRequest) => apiClient.testVoiceClone(voiceId);
export const deleteVoiceClone = (voiceId: string) => apiClient.deleteVoiceClone(voiceId);