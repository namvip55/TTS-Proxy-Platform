import React, { useState, useEffect } from 'react';
import { Sparkles, Sliders, AlertTriangle, FileAudio, Clock, CheckCircle2, Coins, Plus, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Voice, TTSResponsePayload } from '../types';
import { useCredit } from '../contexts/CreditContext';
import { VoiceSelector } from '../components/VoiceSelector';
import { AudioPlayer } from '../components/AudioPlayer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const Studio: React.FC = () => {
  const { creditInfo, refreshCredits, openTopupModal } = useCredit();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('vi-VN-Northern-Male-1');
  const [inputText, setInputText] = useState<string>(
    'Chào mừng bạn đến với VieNeu-TTS Studio. Đây là nền tảng chuyển đổi văn bản thành giọng nói AI tiếng Việt thế hệ mới với độ chân thực vượt trội.'
  );
  const [speed, setSpeed] = useState<number>(1.0);
  const [format, setFormat] = useState<'mp3' | 'wav'>('mp3');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TTSResponsePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gpuConnected, setGpuConnected] = useState<boolean>(true);

  // Tính số từ và lượng credit tiêu hao (1 credit = 5 chữ)
  const trimmedText = inputText.trim();
  const wordsCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
  const charactersCount = inputText.length;
  const requiredCredits = wordsCount > 0 ? Math.max(1, Math.ceil(wordsCount / 5)) : 0;
  const currentBalance = creditInfo?.credit_balance ?? 0;
  const hasEnoughCredits = currentBalance >= requiredCredits;

  // Tải danh sách giọng đọc từ Gateway
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const data = await api.getVoices();
        setVoices(data.voices);
        if (data.voices.length > 0 && !selectedVoiceId) {
          setSelectedVoiceId(data.voices[0].id);
        }
      } catch (err) {
        console.error('Không thể tải giọng đọc:', err);
      }
    };

    const checkGpu = async () => {
      try {
        const res = await api.getWorkerStatus();
        setGpuConnected(res.gpu_worker.connected);
      } catch (err) {
        setGpuConnected(false);
      }
    };

    fetchVoices();
    checkGpu();
  }, []);

  const handleGenerate = async () => {
    if (!trimmedText) {
      setErrorMessage('Vui lòng nhập văn bản cần đọc.');
      return;
    }

    if (!hasEnoughCredits) {
      setErrorMessage(
        `Số dư không đủ! Đoạn văn cần ${requiredCredits} credit (${wordsCount} từ), bạn hiện có ${currentBalance} credit. Vui lòng nạp thêm để tiếp tục.`
      );
      openTopupModal();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.generateSpeech({
        model: 'vieneu-v3-turbo',
        input: trimmedText,
        voice: selectedVoiceId,
        speed: speed,
        response_format: format,
      });

      setResult(response);
      // Cập nhật lại số dư credit sau khi đã trừ thành công
      await refreshCredits();
    } catch (err: any) {
      console.error('TTS Error:', err);
      if (err.response?.status === 402) {
        setErrorMessage(
          err.response?.data?.error?.message || 'Tài khoản không đủ credit. Vui lòng nạp thêm gói cước.'
        );
        openTopupModal();
      } else if (err.response?.status === 503 || err.response?.data?.error?.code === 'GPU_WORKER_OFFLINE') {
        setGpuConnected(false);
        setErrorMessage('Colab GPU Worker hiện đang Offline! Vui lòng khởi chạy script worker trên Google Colab để xử lý.');
      } else {
        const msg = err.response?.data?.error?.message || err.response?.data?.detail?.message || 'Có lỗi xảy ra khi tạo âm thanh.';
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sampleTexts = [
    { label: 'Tin tức thời sự', text: 'Hôm nay, trung tâm dự báo khí tượng thủy văn cho biết thời tiết cả nước tiếp tục duy trì trạng thái nắng ráo, thuận lợi cho các hoạt động ngoài trời.' },
    { label: 'Sách nói tản văn', text: 'Mùa thu Hà Nội luôn mang theo một nỗi niềm man mác khó tả, từng chiếc lá vàng rụng bên hồ Gươm gợi nhớ về những kỷ niệm êm đềm xưa cũ.' },
    { label: 'Quảng cáo TVC', text: 'Trải nghiệm đỉnh cao công nghệ với VieNeu-TTS Turbo! Tốc độ siêu tốc, âm thanh chân thực, nâng tầm nội dung số của bạn ngay hôm nay.' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            VieNeu-TTS Studio <Sparkles className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Soạn thảo văn bản và sinh âm thanh giọng đọc Tiếng Việt AI với độ trễ thấp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={gpuConnected ? 'green' : 'red'} pulse={gpuConnected}>
            GPU T4: {gpuConnected ? 'Đã kết nối' : 'Chưa kết nối'}
          </Badge>
        </div>
      </div>

      {/* GPU Offline Warning Banner */}
      {!gpuConnected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm">GPU Worker (Google Colab T4) chưa kết nối!</p>
            <p className="text-amber-300/80">
              Hệ thống Gateway đang hoạt động bình thường nhưng không thể tạo âm thanh vì Worker xử lý GPU chưa online.
              Vui lòng mở notebook <code className="bg-amber-950/60 px-1 py-0.5 rounded font-mono">colab-worker/VieNeu_TTS_Colab_Worker.ipynb</code> trên Google Colab T4 và bấm <strong>Run All</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Main Studio Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Text Input & Presets (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Văn bản Tiếng Việt
              </label>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">{wordsCount} từ</span>
                <span className="text-slate-600">|</span>
                <span className={`${charactersCount > 4500 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {charactersCount} / 5,000 ký tự
                </span>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập nội dung tiếng Việt có dấu tại đây..."
              rows={8}
              maxLength={5000}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition leading-relaxed font-sans"
            />

            {/* Credit Cost Indicator Bar */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400">Ước tính tiêu thụ: </span>
                  <span className="font-bold text-white font-mono">{requiredCredits} Credit</span>
                  <span className="text-[11px] text-slate-500 ml-1.5">(1 Credit = 5 chữ)</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <span className="text-slate-400">Số dư: </span>
                  <span className={`font-bold font-mono ${hasEnoughCredits ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentBalance.toLocaleString()} Cr
                  </span>
                </div>
                {!hasEnoughCredits && (
                  <button
                    onClick={() => openTopupModal()}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-1 transition text-xs shadow-md shadow-rose-600/30"
                  >
                    <Plus className="w-3 h-3" /> Nạp thêm
                  </button>
                )}
              </div>
            </div>

            {/* Quick Samples */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Mẫu thử nhanh:</span>
              {sampleTexts.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(sample.text)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Action Button & Error feedback */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Gói tài khoản:{' '}
              <span className="font-bold uppercase text-indigo-400">{creditInfo?.tier || 'normal'}</span>
            </div>

            <Button
              onClick={handleGenerate}
              isLoading={isLoading}
              size="lg"
              className="w-full sm:w-auto px-8 py-3 text-base shadow-xl"
              icon={<Sparkles className="w-5 h-5 text-amber-300" />}
            >
              {isLoading ? 'Đang nạp GPU & Tạo âm thanh...' : `Tạo âm thanh (${requiredCredits} Cr)`}
            </Button>
          </div>
        </div>

        {/* Right Column: Audio & Voice Parameters (1 col) */}
        <div className="space-y-4">
          <Card title="Cấu hình giọng đọc" subtitle="Tùy chỉnh phong cách VieNeu-TTS v3" className="p-5">
            {/* Voice Dropdown */}
            <div className="mb-5">
              <VoiceSelector
                voices={voices}
                selectedVoiceId={selectedVoiceId}
                onSelectVoice={setSelectedVoiceId}
              />
            </div>

            {/* Speed slider */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Tốc độ phát (Speed):
                </label>
                <span className="text-xs font-mono font-semibold text-indigo-400">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>0.5x (Chậm)</span>
                <span>1.0x (Chuẩn)</span>
                <span>2.0x (Nhanh)</span>
              </div>
            </div>

            {/* Response format */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileAudio className="w-3.5 h-3.5 text-indigo-400" />
                Định dạng đầu ra:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['mp3', 'wav'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition ${
                      format === fmt
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fmt} {fmt === 'mp3' ? '(Chuẩn Web)' : '(Chất lượng cao)'}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Quick Info Card */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-200 text-xs space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              VieNeu-TTS v3 Turbo Architecture
            </p>
            <p className="text-indigo-300/70 leading-relaxed text-[11px]">
              Tối ưu hóa thời gian sinh âm thanh dưới 1 giây trên GPU T4, hỗ trợ nối tiếp qua WebSocket hai chiều và lưu trữ trực tiếp trên Supabase Bucket.
            </p>
          </div>
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <div className="pt-2">
          <Card
            title="Kết quả âm thanh hoàn tất"
            subtitle={`Job ID: ${result.job_id}`}
            action={
              <div className="flex items-center gap-2">
                <Badge variant="green" size="sm">
                  <Clock className="w-3 h-3" /> {result.execution_time_ms} ms
                </Badge>
              </div>
            }
          >
            <AudioPlayer src={result.audio_url} title={`Âm thanh tạo bởi VieNeu (${selectedVoiceId})`} autoPlay />
          </Card>
        </div>
      )}
    </div>
  );
};
