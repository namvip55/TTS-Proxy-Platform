import axios from 'axios';
import { supabase } from './supabase';
import {
  TTSRequestPayload,
  TTSResponsePayload,
  Voice,
  ApiKeyItem,
  HistoryItem,
  WorkerStatusInfo,
  UserCreditInfo,
  CreditPackage,
  CreateOrderResponse,
  PaymentOrder,
  CreditTransaction
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gắn JWT token của Supabase Auth vào tất cả các request gửi tới FastAPI Gateway
apiClient.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('Không thể lấy session Supabase:', err);
  }
  return config;
});

export const api = {
  // TTS API
  async generateSpeech(payload: TTSRequestPayload): Promise<TTSResponsePayload> {
    const response = await apiClient.post<TTSResponsePayload>('/v1/audio/speech', payload);
    return response.data;
  },

  // Danh sách giọng đọc
  async getVoices(): Promise<{ total: number; voices: Voice[] }> {
    const response = await apiClient.get<{ total: number; voices: Voice[] }>('/v1/voices');
    return response.data;
  },

  // Quản lý API Keys
  async getKeys(): Promise<ApiKeyItem[]> {
    const response = await apiClient.get<ApiKeyItem[]>('/v1/keys');
    return response.data;
  },

  async createKey(name: string): Promise<ApiKeyItem> {
    const response = await apiClient.post<ApiKeyItem>('/v1/keys', { name });
    return response.data;
  },

  async deleteKey(keyId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/v1/keys/${keyId}`);
    return response.data;
  },

  // Lịch sử TTS
  async getHistory(page = 1, limit = 10): Promise<{ total: number; page: number; limit: number; items: HistoryItem[] }> {
    const response = await apiClient.get('/v1/history', { params: { page, limit } });
    return response.data;
  },

  async deleteHistory(jobId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/v1/history/${jobId}`);
    return response.data;
  },

  // Trạng thái GPU Worker
  async getWorkerStatus(): Promise<{ status: string; gpu_worker: WorkerStatusInfo }> {
    const response = await apiClient.get('/v1/status');
    return response.data;
  },

  // ==========================================
  // BILLING & CREDITS API
  // ==========================================
  async getBillingBalance(): Promise<UserCreditInfo> {
    const response = await apiClient.get<UserCreditInfo>('/v1/billing/balance');
    return response.data;
  },

  async getPackages(): Promise<{ packages: CreditPackage[] }> {
    const response = await apiClient.get<{ packages: CreditPackage[] }>('/v1/billing/packages');
    return response.data;
  },

  async createOrder(packageId: string): Promise<CreateOrderResponse> {
    const response = await apiClient.post<CreateOrderResponse>('/v1/billing/create-order', {
      package_id: packageId,
    });
    return response.data;
  },

  async confirmOrder(orderCode: string): Promise<{
    success: boolean;
    order_code: string;
    credits_added: number;
    new_balance: number;
    tier: string;
  }> {
    const response = await apiClient.post('/v1/billing/confirm-order', {
      order_code: orderCode,
    });
    return response.data;
  },

  async getBillingHistory(): Promise<{
    orders: PaymentOrder[];
    transactions: CreditTransaction[];
  }> {
    const response = await apiClient.get('/v1/billing/history');
    return response.data;
  }
};
