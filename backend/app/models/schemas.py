from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


# ====================================================================
# TTS SCHEMAS
# ====================================================================

class TTSRequest(BaseModel):
    model: str = Field(default="vieneu-v3-turbo", description="ID mô hình TTS, mặc định vieneu-v3-turbo")
    input: str = Field(..., min_length=1, max_length=5000, description="Văn bản tiếng Việt cần chuyển sang giọng nói")
    voice: str = Field(default="vi-VN-Northern-Male-1", description="ID giọng đọc VieNeu-TTS v3")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Tốc độ đọc từ 0.5 đến 2.0 (mặc định 1.0)")
    response_format: str = Field(default="mp3", description="Định dạng âm thanh: mp3 hoặc wav")


class TTSResponse(BaseModel):
    job_id: str
    status: str
    audio_url: str
    execution_time_ms: int
    created_at: str


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


# ====================================================================
# VOICE SCHEMAS
# ====================================================================

class VoiceItem(BaseModel):
    id: str
    name: str
    region: str  # Bắc, Trung, Nam
    gender: str  # Nam, Nữ
    description: Optional[str] = None
    sample_url: Optional[str] = None


class VoiceListResponse(BaseModel):
    total: int
    voices: List[VoiceItem]


# ====================================================================
# API KEY SCHEMAS
# ====================================================================

class ApiKeyCreate(BaseModel):
    name: Optional[str] = Field(default="Default Key", max_length=100, description="Tên định danh cho API Key")


class ApiKeyResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    key_prefix: str
    is_active: bool
    created_at: Optional[str] = None
    last_used_at: Optional[str] = None


class ApiKeyCreatedResponse(ApiKeyResponse):
    raw_key: str  # Chỉ hiển thị duy nhất 1 lần khi tạo


# ====================================================================
# HISTORY SCHEMAS
# ====================================================================

class HistoryItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    input_text: str
    voice_id: str
    speed: float
    status: str
    audio_url: Optional[str] = None
    execution_time_ms: Optional[int] = None
    created_at: str


class HistoryListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[HistoryItem]


# ====================================================================
# WORKER & SYSTEM SCHEMAS
# ====================================================================

class WorkerStatus(BaseModel):
    connected: bool
    worker_count: int
    active_jobs: int
    last_ping: Optional[str] = None
