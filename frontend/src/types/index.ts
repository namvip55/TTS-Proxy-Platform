export interface UserProfile {
  id: string;
  email: string;
  role?: string;
}

export type Region = 'Bắc' | 'Trung' | 'Nam';
export type Gender = 'Nam' | 'Nữ';

export interface Voice {
  id: string;
  name: string;
  region: Region;
  gender: Gender;
  description?: string;
  sample_url?: string;
}

export interface TTSRequestPayload {
  model: string;
  input: string;
  voice: string;
  speed: number;
  response_format: 'mp3' | 'wav';
}

export interface TTSResponsePayload {
  job_id: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'TIMEOUT';
  audio_url: string;
  execution_time_ms: number;
  created_at: string;
}

export interface ApiKeyItem {
  id: string;
  user_id?: string;
  name: string;
  key_prefix: string;
  raw_key?: string; // Chỉ xuất hiện ngay khi tạo
  is_active: boolean;
  created_at?: string;
  last_used_at?: string | null;
}

export interface HistoryItem {
  id: string;
  user_id?: string;
  input_text: string;
  voice_id: string;
  speed: number;
  status: string;
  audio_url: string;
  execution_time_ms?: number;
  created_at: string;
}

export interface WorkerStatusInfo {
  connected: boolean;
  last_seen?: string | null;
  active_jobs: number;
}
