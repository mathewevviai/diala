export type CallStatus = 'IDLE' | 'DIALING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export interface StartCallRequest {
  phone_number: string;
  initial_message: string;
  background_scene?: string;
}

export interface StartCallResponse {
  message: string;
  call_id: string;
}

export interface APIError {
  detail: string;
  status?: number;
}