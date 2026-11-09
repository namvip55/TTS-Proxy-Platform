import React, { useState } from 'react';
import { Mic2, Upload, Sparkles, CheckCircle2, AlertCircle, Volume2, ShieldCheck, Play, Radio } from 'lucide-react';
import { useCredit } from '../contexts/CreditContext';

export const VoiceClone: React.FC = () => {
  const { creditInfo, openTopupModal } = useCredit();
  const [cloneName, setCloneName] = useState<string>('Giọng của tôi');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [clonedSuccess, setClonedSuccess] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartClone = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setClonedSuccess(true);
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#181a30] via-[#121626] to-[#0f1424] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Nhân Bản Giọng Nói AI <Mic2 className="w-6 h-6 text-pink-400" />
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
              Zero-Shot Cloning
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chỉ cần 3 đến 8 giây âm thanh mẫu để tạo bản sao giọng nói độc quyền của bạn
          </p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-[#0f1424] border border-slate-800 shadow-xl space-y-6">
        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Tên mẫu giọng nhân bản:
          </label>
          <input
            type="text"
            value={cloneName}
            onChange={(e) => setCloneName(e.target.value)}
            className="w-full bg-[#0a0e1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Audio Sample Input Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Upload File */}
          <div className="p-5 rounded-2xl bg-[#0a0e1a] border-2 border-dashed border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer relative group">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                {selectedFile ? selectedFile.name : 'Tải lên tệp âm thanh mẫu'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Định dạng WAV, MP3, M4A (Thời lượng 3 - 10 giây)
              </p>
            </div>
          </div>

          {/* Record Directly */}
          <div className="p-5 rounded-2xl bg-[#0a0e1a] border-2 border-dashed border-slate-800 hover:border-pink-500/50 transition-all flex flex-col items-center justify-center text-center gap-3">
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40'
                  : 'bg-pink-500/10 text-pink-400 hover:scale-110'
              }`}
            >
              <Mic2 className="w-6 h-6" />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-200">
                {isRecording ? 'Đang ghi âm... (Nói 5 giây)' : 'Thu âm trực tiếp qua Micro'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Bấm vào biểu tượng mic để bắt đầu thu âm
              </p>
            </div>
          </div>
        </div>

        {/* Requirements Advice */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
          <div className="font-bold text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Mẹo để có bản nhân bản chất lượng cao:</span>
          </div>
          <ul className="list-disc pl-5 text-[11px] text-slate-400 space-y-1">
            <li>Nói với tốc độ tự nhiên, rõ chữ trong phòng yên tĩnh, không lẫn tạp âm môi trường.</li>
            <li>Độ dài file mẫu lý tưởng từ 5 đến 8 giây.</li>
            <li>VieNeu v3 Turbo tự động khử ồn và trích xuất đặc trưng giọng (voice embeddings).</li>
          </ul>
        </div>

        {/* Action Button */}
        {clonedSuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold">Đã nhân bản thành công giọng: "{cloneName}"!</span>
            </div>
            <a
              href="/"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
            >
              Dùng ngay trong Studio
            </a>
          </div>
        ) : (
          <button
            type="button"
            disabled={isProcessing || (!selectedFile && !recordedAudioUrl)}
            onClick={handleStartClone}
            className={`w-full py-4 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-xl ${
              isProcessing || (!selectedFile && !recordedAudioUrl)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-600/30'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>AI đang trích xuất đặc trưng giọng nói...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Bắt đầu nhân bản giọng nói</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
