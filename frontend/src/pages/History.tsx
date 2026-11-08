import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, Trash2, Download, Play, Pause, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { HistoryItem } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const History: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.getHistory(p, limit);
      setHistoryItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
    const audio = new Audio();
    audio.onended = () => {
      setPlayingId(null);
    };
    setAudioElement(audio);

    return () => {
      audio.pause();
    };
  }, []);

  const handlePlayAudio = (item: HistoryItem) => {
    if (!audioElement || !item.audio_url) return;

    if (playingId === item.id) {
      audioElement.pause();
      setPlayingId(null);
    } else {
      audioElement.src = item.audio_url;
      audioElement.play().catch(console.error);
      setPlayingId(item.id);
      setActiveAudioUrl(item.audio_url);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này cùng file âm thanh trên Cloud Storage?')) {
      return;
    }

    try {
      if (playingId === jobId && audioElement) {
        audioElement.pause();
        setPlayingId(null);
      }
      await api.deleteHistory(jobId);
      // Cập nhật lại danh sách
      setHistoryItems((prev) => prev.filter((i) => i.id !== jobId));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert('Không thể xóa bản ghi. Vui lòng thử lại sau.');
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Lịch sử Âm thanh <HistoryIcon className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Quản lý, nghe lại và tải xuống các tập tin âm thanh đã được tạo bởi VieNeu-TTS
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchHistory(page)}
          icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Làm mới
        </Button>
      </div>

      {/* History List Table / Cards */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Đang tải lịch sử...</span>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">Chưa có bản ghi âm nào</p>
            <p className="text-xs text-slate-500">Các tác vụ sinh audio từ Studio hoặc qua REST API sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {historyItems.map((item) => {
              const isPlaying = playingId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition group"
                >
                  {/* Left: Play button & Text info */}
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handlePlayAudio(item)}
                      disabled={!item.audio_url}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition shadow-lg ${
                        isPlaying
                          ? 'bg-indigo-600 text-white shadow-indigo-500/40'
                          : 'bg-slate-800 group-hover:bg-indigo-600/20 text-slate-300 group-hover:text-indigo-400'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div>
                      <p className="text-sm text-slate-200 font-medium line-clamp-2 max-w-2xl leading-snug">
                        {item.input_text}
                      </p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-slate-400 font-mono">
                        <Badge variant="purple" size="sm">
                          {item.voice_id}
                        </Badge>
                        <Badge variant="slate" size="sm">
                          {item.speed}x
                        </Badge>
                        {item.execution_time_ms && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {item.execution_time_ms} ms
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                          {new Date(item.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {item.audio_url && (
                      <a
                        href={item.audio_url}
                        target="_blank"
                        rel="noreferrer"
                        download={`audio_${item.id}.mp3`}
                        className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                        title="Tải xuống tập tin"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                      title="Xóa bản ghi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {total > limit && (
          <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              Tổng cộng <strong>{total}</strong> bản ghi (Trang {page} / {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => fetchHistory(page - 1)}
              >
                Trước
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => fetchHistory(page + 1)}
              >
                Tiếp
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
