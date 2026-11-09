import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Sliders, Play, Download, Layers, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Voice } from '../types';
import { useCredit } from '../contexts/CreditContext';
import { VoiceSelector } from '../components/VoiceSelector';

export const StoryStudio: React.FC = () => {
  const { creditInfo, openTopupModal } = useCredit();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('vi-VN-Northern-Male-2'); // Tuấn Kiệt (giọng đọc sách nói)
  const [storyTitle, setStoryTitle] = useState<string>('Chương 1: Mùa Thu Đi Qua Ngõ');
  const [storyContent, setStoryContent] = useState<string>(
    `Gió đầu mùa se lạnh thổi qua từng con phố nhỏ. Những hàng cây cơm nguội vàng rực bên góc đường, khẽ rung rinh trong nắng sớm.\n\n` +
    `Cậu bé kéo chiếc áo khoác mỏng, bước chân chầm chậm trên con đường quen thuộc. Có tiếng rao bánh mì giòn tan vọng lại từ xa, nghe sao mà thân thương đến lạ kỳ.\n\n` +
    `Cuộc sống nơi thành thị đôi khi vội vã, nhưng chỉ cần dừng lại một nhịp, người ta lại thấy lòng mình bình yên đến kỳ lạ.`
  );
  const [speed, setSpeed] = useState<number>(1.0);

  useEffect(() => {
    api.getVoices().then((res) => setVoices(res.voices)).catch(() => {});
  }, []);

  // Tách truyện theo từng đoạn văn (paragraph)
  const paragraphs = storyContent
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const totalWords = storyContent.trim() ? storyContent.trim().split(/\s+/).length : 0;
  const estimatedCredits = Math.max(1, Math.ceil(totalWords / 5));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#141a2e] to-[#0e1424] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Đọc Truyện Dài & Sách Nói AI <BookOpen className="w-5 h-5 text-indigo-400" />
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Audiobook Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hỗ trợ chuyển đổi truyện dài, tiểu thuyết, sách nói nhiều chương với giọng đọc truyền cảm
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400">Tổng độ dài: </span>
            <span className="text-xs font-mono font-bold text-white">{paragraphs.length} đoạn • {totalWords} từ</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Story Editor & Chunks */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0f1424] border border-slate-800 shadow-xl space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Tiêu đề chương / Tác phẩm:
              </label>
              <input
                type="text"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Nội dung truyện (Mỗi đoạn cách nhau 1 dòng trống):
                </label>
                <span className="text-xs font-mono text-slate-400">{totalWords} chữ</span>
              </div>
              <textarea
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                rows={12}
                className="w-full bg-[#0a0e1a] border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition leading-relaxed font-sans"
              />
            </div>

            {/* Paragraph Breakdown Preview */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Danh sách các đoạn văn sẽ được tạo ({paragraphs.length} đoạn):
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {paragraphs.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-md bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="line-clamp-2 leading-relaxed flex-1">{p}</p>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      ~{p.split(/\s+/).length} chữ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0f1424] border border-slate-800 shadow-xl space-y-5">
            <VoiceSelector
              voices={voices}
              selectedVoiceId={selectedVoiceId}
              onSelectVoice={setSelectedVoiceId}
            />

            {/* Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Tốc độ kể chuyện
                </label>
                <span className="text-xs font-mono font-bold text-indigo-400">{speed.toFixed(1)}x</span>
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

            {/* Action CTA */}
            <button
              type="button"
              onClick={() => {
                window.location.href = `/?text=${encodeURIComponent(storyContent)}&voice=${selectedVoiceId}`;
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Đưa sang Studio tạo toàn bộ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
