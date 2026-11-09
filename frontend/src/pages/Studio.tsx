import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  AlertTriangle,
  FileAudio,
  Clock,
  CheckCircle2,
  Coins,
  Plus,
  Play,
  RotateCcw,
  Download,
  Trash2,
  Wand2,
  Smile,
  Volume2,
  Layers,
  ArrowRight,
  Zap,
  ExternalLink
} from 'lucide-react';
import { api } from '../lib/api';
import { Voice, TTSResponsePayload, HistoryItem } from '../types';
import { useCredit } from '../contexts/CreditContext';
import { VoiceSelector } from '../components/VoiceSelector';
import { AudioPlayer } from '../components/AudioPlayer';

export const Studio: React.FC = () => {
  const { creditInfo, refreshCredits, openTopupModal } = useCredit();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('vi-VN-Northern-Male-1');
  const [inputText, setInputText] = useState<string>(
    'Chào mừng bạn đến với Vivibe Studio! Nền tảng chuyển đổi văn bản thành giọng nói AI tiếng Việt thế hệ mới với công nghệ VieNeu-TTS v3 Turbo đạt độ chân thực và cảm xúc vượt trội.'
  );
  const [speed, setSpeed] = useState<number>(1.0);
  const [format, setFormat] = useState<'mp3' | 'wav'>('mp3');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TTSResponsePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gpuConnected, setGpuConnected] = useState<boolean>(true);
  const [recentJobs, setRecentJobs] = useState<HistoryItem[]>([]);

  // Tính số từ và lượng credit tiêu hao (1 credit = 5 chữ)
  const trimmedText = inputText.trim();
  const wordsCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
  const charactersCount = inputText.length;
  const requiredCredits = wordsCount > 0 ? Math.max(1, Math.ceil(wordsCount / 5)) : 0;
  const currentBalance = creditInfo?.credit_balance ?? 0;
  const hasEnoughCredits = currentBalance >= requiredCredits;

  // Tải danh sách giọng đọc và trạng thái GPU
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await api.getVoices();
        setVoices(data.voices);
        if (data.voices.length > 0 && !selectedVoiceId) {
          setSelectedVoiceId(data.voices[0].id);
        }
      } catch (err) {
        console.error('Không thể tải danh sách giọng đọc:', err);
      }

      try {
        const res = await api.getWorkerStatus();
        setGpuConnected(res.gpu_worker.connected);
      } catch (err) {
        setGpuConnected(false);
      }

      // Tải lịch sử gần đây (5 mục)
      try {
        const historyData = await api.getHistory(1, 5);
        setRecentJobs(historyData.items || []);
      } catch (err) {
        // bỏ qua nếu chưa có dữ liệu
      }
    };

    fetchInitialData();
  }, []);

  const handleGenerate = async () => {
    if (!trimmedText) {
      setErrorMessage('Vui lòng nhập nội dung văn bản cần chuyển thành giọng nói.');
      return;
    }

    if (!hasEnoughCredits) {
      setErrorMessage(
        `Số dư credit không đủ! Đoạn văn này cần ${requiredCredits} credit (${wordsCount} từ), tài khoản của bạn còn ${currentBalance} credit. Vui lòng nạp thêm để tiếp tục.`
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
      await refreshCredits();

      // Cập nhật ngay vào danh sách lịch sử gần đây
      try {
        const historyData = await api.getHistory(1, 5);
        setRecentJobs(historyData.items || []);
      } catch (err) {
        // bỏ qua
      }
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

  // Mẫu văn bản nhanh
  const samplePresets = [
    {
      label: '🎬 Review Phim',
      text: 'Đây là bộ phim bom tấn khiến cả thế giới chấn động! Không ai có thể ngờ rằng kẻ phản diện thực sự lại chính là người bạn thân nhất của nhân vật chính [thở dài]. Hãy cùng theo dõi tiếp câu chuyện này nhé.'
    },
    {
      label: '📰 Tin tức thời sự',
      text: 'Kính chào quý vị và các bạn! Bản tin thời sự hôm nay xin được gửi tới những thông tin kinh tế và công nghệ nổi bật nhất trong 24 giờ qua trên toàn cầu.'
    },
    {
      label: '📖 Sách nói tản văn',
      text: 'Mùa thu Hà Nội luôn mang theo một nỗi niềm man mác khó tả, từng chiếc lá vàng rụng bên hồ Gươm gợi nhớ về những kỷ niệm êm đềm xưa cũ.'
    },
    {
      label: '📢 Quảng cáo TVC',
      text: 'Trải nghiệm đỉnh cao công nghệ giọng nói AI với VieNeu-TTS v3 Turbo! Tốc độ siêu tốc, âm thanh 48kHz chuẩn phòng thu, nâng tầm video của bạn ngay hôm nay.'
    },
    {
      label: '🎙️ Podcast đêm khuya',
      text: 'Đêm đã khuya rồi, hy vọng bạn đã có một ngày thật trọn vẹn [thở dài]. Hãy buông bỏ những mệt mỏi và cho phép bản thân được nghỉ ngơi thật ngon nhé.'
    }
  ];

  // Chèn thẻ cảm xúc / khoảng nghỉ vào văn bản
  const insertTag = (tag: string) => {
    setInputText((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + tag + ' ');
  };

  const selectedVoiceObj = voices.find((v) => v.id === selectedVoiceId);

  return (
    <div className="space-y-6">
      {/* Studio Header Banner (LucyLab Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#121829] via-[#101626] to-[#0f1424] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Studio Đọc Văn Bản <Sparkles className="w-5 h-5 text-indigo-400" />
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
              v3 Turbo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chuyển văn bản thành giọng đọc Tiếng Việt AI tự nhiên với biểu cảm và hỗ trợ đa vùng miền
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              gpuConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${gpuConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>GPU T4: {gpuConnected ? 'Đã kết nối' : 'Chưa kết nối'}</span>
          </div>

          <button
            type="button"
            onClick={() => openTopupModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Nạp Credit</span>
          </button>
        </div>
      </div>

      {/* Warning if GPU Worker is offline */}
      {!gpuConnected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm">GPU Worker (Google Colab T4) chưa kết nối!</p>
            <p className="text-amber-300/80 leading-relaxed">
              Vui lòng mở notebook Google Colab của bạn và bấm <strong>Run All</strong> (Bước 1 đến Bước 5).
              Hệ thống sẽ tự động bắt đầu xử lý ngay khi worker online.
            </p>
          </div>
        </div>
      )}

      {/* Main 2-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Editor Canvas (7 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0f1424] border border-slate-800 shadow-xl space-y-4">
            
            {/* Tag bar: Quick Emotions & Non-verbal Tags (VieNeu Exclusive) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-pink-400" />
                  Chèn biểu cảm & khoảng nghỉ:
                </span>
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition"
                  title="Xóa trắng văn bản"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa hết</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => insertTag('[cười]')}
                  className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 text-xs font-semibold transition"
                >
                  😊 [cười]
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('[thở dài]')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold transition"
                >
                  😮‍💨 [thở dài]
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('[hắng giọng]')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-semibold transition"
                >
                  🗣️ [hắng giọng]
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('[nghỉ 0.5s]')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-medium transition"
                >
                  ⏱️ +0.5s nghỉ
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('[nghỉ 1.0s]')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-medium transition"
                >
                  ⏱️ +1.0s nghỉ
                </button>
              </div>
            </div>

            {/* Expansive Textarea */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập nội dung văn bản tiếng Việt có dấu tại đây. Hỗ trợ chèn cảm xúc [cười], [thở dài]..."
                rows={9}
                maxLength={5000}
                className="w-full bg-[#0a0e1a] border border-slate-800 rounded-2xl p-4 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition leading-relaxed"
              />

              {/* Character & Word counter */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[11px] font-mono bg-[#0f1424]/90 px-2.5 py-1 rounded-lg border border-slate-800/80">
                <span className="text-slate-300 font-semibold">{wordsCount} từ</span>
                <span className="text-slate-600">•</span>
                <span className={charactersCount > 4500 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {charactersCount} / 5,000 ký tự
                </span>
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Mẫu thử kịch bản nhanh:
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {samplePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(preset.text)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-xs font-medium text-slate-300 hover:text-white border border-slate-700/50 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Realtime Credit Bar */}
            <div className="p-3.5 rounded-2xl bg-[#090d17] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Tiêu thụ:</span>
                    <span className="font-bold font-mono text-white text-sm">{requiredCredits} Credit</span>
                    <span className="text-[10px] text-slate-500 font-mono">(1 Credit = 5 từ)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Số dư hiện tại: <span className={`font-mono font-bold ${hasEnoughCredits ? 'text-emerald-400' : 'text-rose-400'}`}>{currentBalance.toLocaleString()} Cr</span>
                  </p>
                </div>
              </div>

              {!hasEnoughCredits && (
                <button
                  type="button"
                  onClick={() => openTopupModal()}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-lg shadow-rose-600/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Nạp thêm ngay
                </button>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGenerate}
              className={`w-full py-4 px-6 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 shadow-2xl transition-all duration-300 ${
                isLoading
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>GPU T4 đang tính toán âm thanh...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 text-amber-300" />
                  <span>Tạo âm thanh ngay ({requiredCredits} Credit)</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Player */}
          {result && (
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <AudioPlayer
                src={result.audio_url}
                title={`Âm thanh đã tạo: ${selectedVoiceObj?.name || selectedVoiceId}`}
                autoPlay={true}
              />
            </div>
          )}

          {/* Recent Generation History inside Studio (Vivibe 2.0 Style) */}
          {recentJobs.length > 0 && (
            <div className="p-5 rounded-3xl bg-[#0f1424] border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Lịch sử tạo âm thanh gần đây
                </h3>
                <span className="text-[11px] text-slate-500">Cập nhật tự động</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {recentJobs.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-200 truncate font-medium">{item.input_text}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                        <span className="text-indigo-400 font-semibold">{item.voice_id}</span>
                        <span>•</span>
                        <span>{item.execution_time_ms ? `${item.execution_time_ms} ms` : 'MP3'}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    </div>

                    {item.audio_url && (
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={item.audio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Tải về"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Voice & Audio Settings Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0f1424] border border-slate-800 shadow-xl space-y-5">
            
            {/* Voice Selector */}
            <VoiceSelector
              voices={voices}
              selectedVoiceId={selectedVoiceId}
              onSelectVoice={setSelectedVoiceId}
            />

            {/* Speed Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Tốc độ đọc (Speed)
                </label>
                <span className="text-xs font-mono font-bold text-indigo-400">{speed.toFixed(1)}x</span>
              </div>

              {/* Quick speed buttons */}
              <div className="grid grid-cols-5 gap-1.5">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                      speed === s
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Audio Output Format */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <FileAudio className="w-3.5 h-3.5 text-indigo-400" />
                Định dạng âm thanh
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('mp3')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    format === 'mp3'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-inner'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs uppercase">MP3</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Dung lượng nhẹ, chuẩn web</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('wav')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    format === 'wav'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-inner'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs uppercase">WAV</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">48kHz Lossless HD</div>
                </button>
              </div>
            </div>

            {/* Model Architecture Feature Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12192e] to-[#0d1222] border border-indigo-500/20 text-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>VieNeu-TTS v3 Turbo Architecture</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mô hình ~0.1B tham số huấn luyện từ đầu trên 10,000 giờ dữ liệu song ngữ.
                Hỗ trợ đọc chuẩn tiếng Anh xen lẫn tiếng Việt không bị ngọng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
