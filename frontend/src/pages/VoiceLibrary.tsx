import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Play, Pause, Search, Sparkles, User, Check, ArrowRight, Mic } from 'lucide-react';
import { api } from '../lib/api';
import { Voice } from '../types';

export const VoiceLibrary: React.FC = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getVoices().then((res) => setVoices(res.voices)).catch(() => {});
  }, []);

  const handlePreviewVoice = (voice: Voice) => {
    if (previewingVoiceId === voice.id) {
      window.speechSynthesis?.cancel();
      setPreviewingVoiceId(null);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Chào bạn, tôi là ${voice.name}. Rất vui được đồng hành cùng bạn trên Vivibe.`);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.onend = () => setPreviewingVoiceId(null);
      utterance.onerror = () => setPreviewingVoiceId(null);
      setPreviewingVoiceId(voice.id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredVoices = voices.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(search.toLowerCase()));

    const matchRegion = selectedRegion === 'ALL' || v.region === selectedRegion;
    const matchGender = selectedGender === 'ALL' || v.gender === selectedGender;

    return matchSearch && matchRegion && matchGender;
  });

  const getRegionBadge = (region?: string) => {
    switch (region) {
      case 'Bắc':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Trung':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Nam':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#141b30] via-[#101626] to-[#0f1424] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Thư Viện Giọng Đọc AI <Volume2 className="w-6 h-6 text-indigo-400" />
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {voices.length} Giọng AI 48kHz
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Khám phá kho giọng đọc độc quyền VieNeu-TTS v3 với đầy đủ sắc thái ba miền Bắc - Trung - Nam
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f1424] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, phong cách, vùng miền..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0e1a] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end text-xs">
          {/* Region */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'Bắc', 'Trung', 'Nam'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRegion(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedRegion === r ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'ALL' ? 'Tất cả' : `Miền ${r}`}
              </button>
            ))}
          </div>

          {/* Gender */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'Nam', 'Nữ'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGender(g)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedGender === g ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {g === 'ALL' ? 'Cả hai' : g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Grid Cards (LucyLab Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVoices.map((voice) => {
          const isPlaying = previewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              className="p-5 rounded-3xl bg-[#0f1424] border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 shadow-lg flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold group-hover:scale-105 transition-transform">
                      <Mic className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition">
                        {voice.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${getRegionBadge(voice.region)}`}>
                          Miền {voice.region}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.2 rounded-md bg-slate-800 text-slate-300">
                          {voice.gender}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Play Audio Preview Button */}
                  <button
                    type="button"
                    onClick={() => handlePreviewVoice(voice)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all shadow-md ${
                      isPlaying
                        ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                    title="Nghe thử giọng đọc"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-3 leading-relaxed line-clamp-3">
                  {voice.description || 'Giọng đọc AI VieNeu thế hệ mới với ngữ điệu tự nhiên và chuẩn âm tiếng Việt.'}
                </p>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => navigate(`/?voice=${voice.id}`)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <span>Dùng giọng này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
