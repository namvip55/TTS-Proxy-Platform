import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, Check, Sparkles, Volume2, User, Play, Pause } from 'lucide-react';
import { Voice } from '../types';

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const selectedVoice = useMemo(() => {
    return voices.find((v) => v.id === selectedVoiceId) || voices[0];
  }, [voices, selectedVoiceId]);

  const filteredVoices = useMemo(() => {
    return voices.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.id.toLowerCase().includes(search.toLowerCase()) ||
        (v.description && v.description.toLowerCase().includes(search.toLowerCase()));

      const matchRegion = selectedRegion === 'ALL' || v.region === selectedRegion;
      const matchGender = selectedGender === 'ALL' || v.gender === selectedGender;

      return matchSearch && matchRegion && matchGender;
    });
  }, [voices, search, selectedRegion, selectedGender]);

  // Giả lập đọc mẫu hoặc phát speech synthesis của trình duyệt khi bấm nghe thử
  const handlePreviewVoice = (e: React.MouseEvent, voice: Voice) => {
    e.stopPropagation();
    if (previewingVoiceId === voice.id) {
      window.speechSynthesis?.cancel();
      setPreviewingVoiceId(null);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Xin chào, tôi là ${voice.name}, giọng đọc AI chất lượng cao.`);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.onend = () => setPreviewingVoiceId(null);
      utterance.onerror = () => setPreviewingVoiceId(null);
      setPreviewingVoiceId(voice.id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const getRegionColor = (region?: string) => {
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
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Giọng đọc AI VieNeu v3
        </label>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
          {voices.length} giọng sẵn sàng
        </span>
      </div>

      {/* Selected Voice Display Button (LucyLab Style) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 bg-[#0f1423] border border-slate-800 hover:border-indigo-500/50 rounded-2xl text-left transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-inner"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 group-hover:scale-105 transition-transform">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0f1423]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-100 group-hover:text-white transition truncate">
                {selectedVoice?.name || 'Chọn giọng đọc'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRegionColor(selectedVoice?.region)}`}>
                Miền {selectedVoice?.region || 'Bắc'}
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                {selectedVoice?.gender || 'Nam'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-1">
              {selectedVoice?.description || selectedVoice?.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[11px] text-indigo-400 font-semibold hidden sm:inline-block">Đổi giọng</span>
          <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* Voice Selection Modal / Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="fixed sm:absolute inset-x-4 sm:inset-x-0 bottom-4 sm:bottom-auto top-auto sm:top-full sm:mt-2 z-50 bg-[#101626] border border-slate-700/80 rounded-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[480px] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header: Search & Filters */}
            <div className="p-3.5 border-b border-slate-800 bg-[#0d121f] space-y-3 shrink-0">
              <div className="flex items-center justify-between sm:hidden pb-1">
                <span className="font-bold text-sm text-white">Chọn giọng đọc AI</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Đóng
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, giọng vùng miền, phong cách..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#161d30] border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  autoFocus
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 mr-1">Vùng miền:</span>
                  {(['ALL', 'Bắc', 'Trung', 'Nam'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRegion(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        selectedRegion === r
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r === 'ALL' ? 'Tất cả' : r}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 mr-1">Giới tính:</span>
                  {(['ALL', 'Nam', 'Nữ'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGender(g)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        selectedGender === g
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {g === 'ALL' ? 'Cả hai' : g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Voice List */}
            <div className="overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {filteredVoices.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Không tìm thấy giọng đọc phù hợp. Vui lòng thử từ khóa khác.
                </div>
              ) : (
                filteredVoices.map((voice) => {
                  const isSelected = voice.id === selectedVoiceId;
                  const isPreviewing = previewingVoiceId === voice.id;

                  return (
                    <div
                      key={voice.id}
                      onClick={() => {
                        onSelectVoice(voice.id);
                        setIsOpen(false);
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-between group ${
                        isSelected
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                          : 'hover:bg-slate-800/50 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Audio Preview Trigger Button */}
                        <button
                          type="button"
                          onClick={(e) => handlePreviewVoice(e, voice)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                            isPreviewing
                              ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse'
                              : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
                          }`}
                          title="Bấm để nghe thử mẫu giọng"
                        >
                          {isPreviewing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold group-hover:text-white transition">
                              {voice.name}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRegionColor(voice.region)}`}>
                              {voice.region}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              ({voice.gender})
                            </span>
                          </div>
                          {voice.description && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                              {voice.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
