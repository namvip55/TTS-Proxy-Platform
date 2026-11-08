import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, Check, Sparkles, Volume2, User } from 'lucide-react';
import { Voice, Region, Gender } from '../types';
import { Badge } from './ui/Badge';

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

  return (
    <div className="relative w-full">
      <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Giọng đọc VieNeu-TTS v3 (25+ Giọng)
        </span>
        <span className="text-[11px] text-slate-500">{voices.length} giọng sẵn sàng</span>
      </label>

      {/* Selected Voice Display Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100">{selectedVoice?.name || 'Chọn giọng đọc'}</span>
              <Badge variant={selectedVoice?.region === 'Bắc' ? 'blue' : selectedVoice?.region === 'Trung' ? 'yellow' : 'green'} size="sm">
                Miền {selectedVoice?.region}
              </Badge>
              <Badge variant="purple" size="sm">
                {selectedVoice?.gender}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[280px] sm:max-w-md mt-0.5">
              {selectedVoice?.description || selectedVoice?.id}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl max-h-[460px] flex flex-col">
            {/* Search & Filters */}
            <div className="p-3 border-b border-slate-800 bg-slate-950/50 space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, miền hoặc phong cách..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Region & Gender Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 mr-1">Vùng:</span>
                  {(['ALL', 'Bắc', 'Trung', 'Nam'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRegion(r)}
                      className={`px-2 py-1 rounded-lg transition text-[11px] font-medium ${
                        selectedRegion === r
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 'ALL' ? 'Tất cả' : r}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 mr-1">Phái:</span>
                  {(['ALL', 'Nam', 'Nữ'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGender(g)}
                      className={`px-2 py-1 rounded-lg transition text-[11px] font-medium ${
                        selectedGender === g
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {g === 'ALL' ? 'Cả hai' : g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Voice List */}
            <div className="overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
              {filteredVoices.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Không tìm thấy giọng đọc phù hợp với tiêu chí lọc.
                </div>
              ) : (
                filteredVoices.map((voice) => {
                  const isSelected = voice.id === selectedVoiceId;
                  return (
                    <div
                      key={voice.id}
                      onClick={() => {
                        onSelectVoice(voice.id);
                        setIsOpen(false);
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between group ${
                        isSelected
                          ? 'bg-indigo-600/15 border border-indigo-500/30'
                          : 'hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          voice.gender === 'Nữ' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                              {voice.name}
                            </span>
                            <Badge
                              variant={voice.region === 'Bắc' ? 'blue' : voice.region === 'Trung' ? 'yellow' : 'green'}
                              size="sm"
                            >
                              {voice.region}
                            </Badge>
                            <span className="text-[10px] text-slate-500 font-mono">({voice.gender})</span>
                          </div>
                          {voice.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{voice.description}</p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4" />
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
