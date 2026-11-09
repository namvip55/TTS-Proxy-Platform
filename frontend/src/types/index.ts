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
  word_count?: number;
  credit_cost?: number;
  created_at: string;
}

export interface WorkerStatusInfo {
  connected: boolean;
  last_seen?: string | null;
  active_jobs: number;
}

// =======================================================
// BILLING & CREDIT TYPES
// =======================================================
export type CreditTier = 'normal' | 'plus' | 'pro' | 'ultra';

export interface UserCreditInfo {
  user_id: string;
  tier: CreditTier;
  credit_balance: number;
  words_remaining: number;
  total_used_credits: number;
  rate_words_per_credit: number;
}

export interface CreditPackage {
  id: CreditTier;
  name: string;
  credits: number;
  price_vnd: number;
  words_equivalent: number;
  badge?: string;
  description?: string;
  is_popular?: boolean;
  features?: string[];
}

export interface BankInfo {
  bin: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  transfer_content: string;
  amount: number;
}

export interface CreateOrderResponse {
  success: boolean;
  order_code: string;
  package: CreditPackage;
  amount_vnd: number;
  credits_granted: number;
  bank_info: BankInfo;
  qr_code_url: string;
  status: string;
  instructions: string[];
}

export interface PaymentOrder {
  id: string;
  order_code: string;
  user_id: string;
  user_email?: string;
  package_id: string;
  amount_vnd: number;
  credits_granted: number;
  target_tier: CreditTier;
  bank_bin: string;
  bank_name: string;
  bank_account: string;
  transfer_content: string;
  qr_data_url?: string;
  status: 'PENDING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  created_at: string;
  completed_at?: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: 'INITIAL_FREE' | 'TOPUP' | 'USAGE_TTS' | 'REFUND';
  order_id?: string;
  job_id?: string;
  description?: string;
  created_at: string;
}
