import React, { useState, useEffect } from 'react';
import { Key, Plus, Copy, Check, Trash2, Code, Terminal, FileText, AlertCircle, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import { ApiKeyItem } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

export const Dashboard: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [keyName, setKeyName] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  // Key vừa tạo hiển thị duy nhất 1 lần
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Active Doc Tab
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node'>('curl');

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await api.getKeys();
      setKeys(data);
    } catch (err) {
      console.error('Không thể lấy danh sách API Keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.createKey(keyName || 'Production Key');
      setNewlyCreatedKey(res.raw_key || null);
      setKeyName('');
      fetchKeys();
    } catch (err) {
      alert('Lỗi khi tạo API Key. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi API Key này? Tất cả các ứng dụng đang dùng key này sẽ ngừng hoạt động ngay lập tức.')) {
      return;
    }
    try {
      await api.deleteKey(keyId);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err) {
      alert('Không thể thu hồi key.');
    }
  };

  const copyToClipboard = (text: string, isSnippet = false, snippetType = '') => {
    navigator.clipboard.writeText(text);
    if (isSnippet) {
      setCopiedSnippet(snippetType);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const apiGatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.yourdomain.com';

  const codeSnippets = {
    curl: `curl -X POST "${apiGatewayBaseUrl}/v1/audio/speech" \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "vieneu-v3-turbo",
    "input": "Xin chào, đây là giải pháp chuyển văn bản thành giọng nói AI VieNeu.",
    "voice": "vi-VN-Northern-Male-1",
    "speed": 1.0,
    "response_format": "mp3"
  }'`,

    python: `import requests

url = "${apiGatewayBaseUrl}/v1/audio/speech"
headers = {
    "Authorization": "Bearer sk_live_YOUR_API_KEY_HERE",
    "Content-Type": "application/json"
}
payload = {
    "model": "vieneu-v3-turbo",
    "input": "Xin chào, đây là giải pháp chuyển văn bản thành giọng nói AI VieNeu.",
    "voice": "vi-VN-Northern-Male-1",
    "speed": 1.0,
    "response_format": "mp3"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

if response.status_code == 200:
    print(f"Thành công! Audio URL: {data['audio_url']}")
    print(f"Thời gian xử lý: {data['execution_time_ms']} ms")
else:
    print(f"Lỗi: {data}")`,

    node: `import axios from 'axios';

async function generateSpeech() {
  try {
    const response = await axios.post(
      '${apiGatewayBaseUrl}/v1/audio/speech',
      {
        model: 'vieneu-v3-turbo',
        input: 'Xin chào, đây là giải pháp chuyển văn bản thành giọng nói AI VieNeu.',
        voice: 'vi-VN-Northern-Male-1',
        speed: 1.0,
        response_format: 'mp3'
      },
      {
        headers: {
          'Authorization': 'Bearer sk_live_YOUR_API_KEY_HERE',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Thành công! Audio URL:', response.data.audio_url);
    console.log('Thời gian xử lý:', response.data.execution_time_ms, 'ms');
  } catch (error) {
    console.error('Lỗi API:', error.response?.data || error.message);
  }
}

generateSpeech();`
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Developer API & Keys <Key className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Quản lý khóa truy cập API sk_live_... và tài liệu tích hợp cho ứng dụng bên thứ ba
          </p>
        </div>

        <Button
          onClick={() => {
            setNewlyCreatedKey(null);
            setCreateModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
          size="md"
        >
          Tạo API Key mới
        </Button>
      </div>

      {/* API Keys Table Card */}
      <Card
        title="Danh sách API Keys"
        subtitle="Khóa bí mật dùng để xác thực request gửi tới /v1/audio/speech"
        className="p-0 overflow-hidden"
      >
        {loading ? (
          <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Đang tải danh sách key...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-2">
            <Key className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm text-slate-300 font-medium">Bạn chưa tạo API Key nào</p>
            <p className="text-xs text-slate-500">Bấm "Tạo API Key mới" để cấp quyền cho bot, app di động hoặc backend của bạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tên Key</th>
                  <th className="py-3 px-4">Tiền tố nhận diện</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4">Lần dùng cuối</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/20 transition font-sans">
                    <td className="py-3.5 px-4 font-medium text-slate-200">{k.name}</td>
                    <td className="py-3.5 px-4 font-mono text-indigo-400 font-medium">
                      {k.key_prefix}••••••••
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={k.is_active ? 'green' : 'red'} size="sm">
                        {k.is_active ? 'Active' : 'Revoked'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {k.created_at ? new Date(k.created_at).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleString('vi-VN') : 'Chưa sử dụng'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                        title="Thu hồi key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Developer Docs & Code Samples */}
      <Card title="Tài liệu tích hợp REST API" subtitle="Chuẩn kết nối chuẩn hóa tương thích SDK OpenAI" className="p-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          {(['curl', 'python', 'node'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python' : 'Node.js'}
            </button>
          ))}

          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(codeSnippets[activeTab], true, activeTab)}
              icon={copiedSnippet === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedSnippet === activeTab ? 'Đã sao chép' : 'Sao chép Code'}
            </Button>
          </div>
        </div>

        {/* Code Block Container */}
        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-4">
          <pre className="text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
            <code>{codeSnippets[activeTab]}</code>
          </pre>
        </div>

        {/* API Specification Table */}
        <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Tham số Request Body (JSON)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-mono text-indigo-400 font-semibold">model</span> (string): <span className="text-slate-400">ID mô hình, giá trị mặc định là <code>"vieneu-v3-turbo"</code>.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-mono text-indigo-400 font-semibold">input</span> (string): <span className="text-slate-400">Đoạn văn bản tiếng Việt cần đọc (tối đa 5,000 ký tự).</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-mono text-indigo-400 font-semibold">voice</span> (string): <span className="text-slate-400">ID giọng đọc (tra cứu qua API <code>GET /v1/voices</code>).</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-mono text-indigo-400 font-semibold">speed</span> (float): <span className="text-slate-400">Tốc độ đọc từ 0.5 đến 2.0 (mặc định 1.0).</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal Tạo API Key Mới */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">
              {newlyCreatedKey ? 'Khóa API đã được tạo' : 'Tạo Secret API Key mới'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {newlyCreatedKey
                ? 'Hãy sao chép chuỗi khóa bí mật dưới đây ngay bây giờ. Bạn sẽ không bao giờ xem lại được chuỗi này!'
                : 'Đặt tên định danh cho API Key để quản lý mục đích sử dụng.'}
            </p>

            {newlyCreatedKey ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/50 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-emerald-400 select-all break-all">
                    {newlyCreatedKey}
                  </span>
                  <button
                    onClick={() => copyToClipboard(newlyCreatedKey)}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shrink-0"
                    title="Sao chép"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Vì lý do bảo mật, chúng tôi chỉ hiển thị mã khóa hoàn chỉnh một lần duy nhất. Nếu đánh mất, bạn sẽ phải tạo mã khóa mới.
                  </span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setNewlyCreatedKey(null);
                  }}
                >
                  Tôi đã lưu khóa an toàn
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <Input
                  label="Tên khóa (Key Name)"
                  placeholder="Ví dụ: Chatbot Server, Mobile App, v.v."
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  autoFocus
                  required
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    isLoading={creating}
                  >
                    Tạo Key
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
