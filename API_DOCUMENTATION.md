# 📖 TÀI LIỆU TÍCH HỢP API — VIENEU-TTS CLOUD GATEWAY

Hệ thống cung cấp giao diện lập trình ứng dụng (**RESTful API**) chuẩn hóa theo định dạng **OpenAI Audio API**, giúp nhà phát triển dễ dàng tích hợp giọng đọc AI tiếng Việt chất lượng cao (48kHz) vào các sản phẩm: Website, Ứng dụng di động, Video Automation, Bot Telegram/Discord, Tổng đài thông minh,...

---

## 📌 MỤC LỤC
1. [Địa chỉ Base URL](#1-địa-chỉ-base-url)
2. [Cơ chế xác thực (Authentication)](#2-cơ-chế-xác-thực-authentication)
3. [Quy tắc tính phí & Hạn mức (Credits)](#3-quy-tắc-tính-phí--hạn-mức-credits)
4. [Chi tiết các Endpoint API](#4-chi-tiết-các-endpoint-api)
   - [4.1. Tạo giọng đọc AI (`POST /v1/audio/speech`)](#41-tạo-giọng-đọc-ai-post-v1audiospeech)
   - [4.2. Lấy danh sách giọng đọc (`GET /v1/voices`)](#42-lấy-danh-sách-giọng-đọc-get-v1voices)
   - [4.3. Kiểm tra trạng thái Worker GPU (`GET /v1/status`)](#43-kiểm-tra-trạng-thái-worker-gpu-get-v1status)
   - [4.4. Tra cứu lịch sử tạo âm thanh (`GET /v1/history`)](#44-tra-cứu-lịch-sử-tạo-âm-thanh-get-v1history)
5. [Bảng mã giọng đọc (28 Giọng AI chuẩn)](#5-bảng-mã-giọng-đọc-28-giọng-ai-chuẩn)
6. [Thẻ biểu cảm & điều khiển ngữ điệu](#6-thẻ-biểu-cảm--điều-khiển-ngữ-điệu-độc-quyền)
7. [Bảng mã lỗi (Error Codes)](#7-bảng-mã-lỗi-error-codes)
8. [Code mẫu tích hợp đa ngôn ngữ (Code Snippets)](#8-code-mẫu-tích-hợp-đa-ngôn-ngữ)
   - [cURL](#81-curl)
   - [Python (Requests)](#82-python-requests)
   - [Python (OpenAI SDK Client)](#83-python-dung-openai-sdk-chính-thức)
   - [Node.js / TypeScript (Fetch API)](#84-nodejs--typescript-fetch-api)
   - [PHP](#85-php-curl)
   - [Golang](#86-golang)

---

## 1. Địa chỉ Base URL

Tùy theo môi trường triển khai của bạn, hãy sử dụng đường dẫn Base URL tương ứng:

| Môi trường | Base URL | Ghi chú |
|---|---|---|
| **Cloudflare Public** | `https://<ten-mien-tunnel>.trycloudflare.com` | Hoặc tên miền riêng của bạn |
| **Local Development** | `http://localhost:8000` | Khi test trực tiếp trên máy chủ backend |

> **Lưu ý:** Tất cả các endpoint đều có tiền tố `/v1/...`.

---

## 2. Cơ chế xác thực (Authentication)

Tất cả các API yêu cầu gắn mã khóa xác thực **API Key** trong tiêu đề HTTP Header theo định dạng chuẩn:

```http
Authorization: Bearer <YOUR_API_KEY>
```

### Cách lấy API Key:
1. Đăng nhập vào trang Web Studio.
2. Vào mục **API Keys** (`/dashboard`).
3. Bấm nút **"Tạo API Key mới"** $\rightarrow$ Đặt tên $\rightarrow$ Sao chép khóa (ví dụ: `vntts_live_...`).
4. *Lưu ý: API Key chỉ hiển thị đầy đủ một lần duy nhất lúc tạo vì lý do bảo mật.*

---

## 3. Quy tắc tính phí & Hạn mức (Credits)

Hệ thống tính cước dựa trên **số từ (Words)** của đoạn văn bản đầu vào:

$$\text{Số Credit tiêu hao} = \max\left(1, \left\lceil \frac{\text{Số từ}}{5} \right\rceil\right)$$

* **1 Credit = 5 từ tiếng Việt**.
* Đoạn văn dưới 5 từ vẫn tính tối thiểu **1 Credit**.
* Khi tạo tài khoản mới: Tặng sẵn **1.000 Credits** miễn phí để kiểm thử.
* Nếu số dư không đủ, API sẽ trả về mã lỗi `402 Payment Required`.

---

## 4. Chi tiết các Endpoint API

### 4.1. Tạo giọng đọc AI (`POST /v1/audio/speech`)

Endpoint cốt lõi để chuyển đổi văn bản thành tệp âm thanh (MP3/WAV). Tương thích hoàn toàn với cấu trúc OpenAI Audio API.

* **URL:** `/v1/audio/speech`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Headers:**
  ```http
  Authorization: Bearer <YOUR_API_KEY>
  Content-Type: application/json
  ```

#### Danh sách tham số Body (JSON):

| Tham số | Kiểu dữ liệu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `model` | string | Không | `"vieneu-v3-turbo"` | Tên mô hình AI TTS (`vieneu-v3-turbo`) |
| `input` | string | **Có** | — | Văn bản tiếng Việt cần đọc (1 – 5.000 ký tự) |
| `voice` | string | Không | `"vi-VN-Northern-Male-1"` | ID giọng đọc (Xem mục 5 để lấy danh sách) |
| `speed` | float | Không | `1.0` | Tốc độ đọc từ `0.5` (chậm) đến `2.0` (nhanh) |
| `response_format` | string | Không | `"mp3"` | Định dạng xuất file: `"mp3"` hoặc `"wav"` |

#### Ví dụ Request Body:
```json
{
  "model": "vieneu-v3-turbo",
  "input": "Chào bạn, đây là giọng đọc AI tiếng Việt được tạo bởi VieNeu-TTS v3 Turbo [cười]. Âm thanh rất tự nhiên đúng không?",
  "voice": "vi-VN-Northern-Female-1",
  "speed": 1.0,
  "response_format": "mp3"
}
```

#### Phản hồi thành công (HTTP 200 OK):
```json
{
  "job_id": "job_a1b2c3d4-e5f6-7890-abcd-1234567890ef",
  "status": "COMPLETED",
  "audio_url": "https://pkxvjllzkbblfnkswjth.supabase.co/storage/v1/object/public/tts-audios/tts_job_a1b2c3d4.mp3",
  "execution_time_ms": 680,
  "created_at": "2026-11-09T10:00:00Z"
}
```

* `audio_url`: Đường dẫn công khai (Public CDN Link) của file âm thanh, có thể phát trực tiếp trên trình duyệt hoặc tải về lưu trữ.
* `execution_time_ms`: Thời gian GPU xử lý tính bằng mili-giây (thường dưới 1.000 ms).

---

### 4.2. Lấy danh sách giọng đọc (`GET /v1/voices`)

Trả về danh sách 28 giọng đọc AI sẵn có của hệ thống kèm vùng miền, giới tính và mô tả.

* **URL:** `/v1/voices`
* **Method:** `GET`
* **Headers:** Không bắt buộc xác thực (Public Endpoint).

#### Phản hồi mẫu (HTTP 200 OK):
```json
{
  "total": 28,
  "voices": [
    {
      "id": "vi-VN-Northern-Male-1",
      "name": "Quang Minh (Bắc)",
      "region": "Bắc",
      "gender": "Nam",
      "description": "Giọng đọc nam Hà Nội chuẩn, phong thái đĩnh đạc, phù hợp tin tức, phóng sự và tài liệu.",
      "sample_url": "https://sample-audio.vieneu.ai/vi-VN-Northern-Male-1.mp3"
    },
    {
      "id": "vi-VN-Northern-Female-1",
      "name": "Mai Chi (Bắc)",
      "region": "Bắc",
      "gender": "Nữ",
      "description": "Giọng nữ phát thanh viên chuẩn đài quốc gia, trong trẻo, lưu loát.",
      "sample_url": "https://sample-audio.vieneu.ai/vi-VN-Northern-Female-1.mp3"
    }
  ]
}
```

---

### 4.3. Kiểm tra trạng thái Worker GPU (`GET /v1/status`)

Dùng để kiểm tra xem Colab GPU Worker có đang online và sẵn sàng xử lý yêu cầu hay không trước khi gửi job lớn.

* **URL:** `/v1/status`
* **Method:** `GET`

#### Phản hồi mẫu (HTTP 200 OK):
```json
{
  "status": "ok",
  "timestamp": "2026-11-09T10:05:00Z",
  "gpu_worker": {
    "connected": true,
    "last_seen": "2026-11-09T10:04:55Z",
    "active_jobs": 0
  }
}
```

---

### 4.4. Tra cứu lịch sử tạo âm thanh (`GET /v1/history`)

Lấy danh sách các tệp âm thanh đã tạo của tài khoản hiện tại, có hỗ trợ phân trang.

* **URL:** `/v1/history?page=1&limit=10`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <YOUR_API_KEY>`
* **Query Params:**
  * `page`: Trang hiện tại (mặc định `1`).
  * `limit`: Số mục mỗi trang (mặc định `10`, tối đa `50`).

#### Phản hồi mẫu (HTTP 200 OK):
```json
{
  "total": 42,
  "page": 1,
  "limit": 10,
  "items": [
    {
      "id": "job_a1b2c3d4-e5f6-7890-abcd-1234567890ef",
      "input_text": "Chào bạn, đây là bản tin sáng...",
      "voice_id": "vi-VN-Northern-Male-1",
      "speed": 1.0,
      "status": "COMPLETED",
      "audio_url": "https://.../tts_job_a1b2c3d4.mp3",
      "execution_time_ms": 720,
      "word_count": 8,
      "credit_cost": 2,
      "created_at": "2026-11-09T09:45:10Z"
    }
  ]
}
```

---

## 5. Bảng mã giọng đọc (28 Giọng AI chuẩn)

| Mã Giọng (`voice`) | Tên Giọng | Vùng Miền | Giới Tính | Phong Cách Phù Hợp |
|---|---|---|---|---|
| `vi-VN-Northern-Male-1` | Quang Minh | Miền Bắc | Nam | Bản tin thời sự, tài liệu chính luận, báo chí |
| `vi-VN-Northern-Male-2` | Tuấn Kiệt | Miền Bắc | Nam | Sách nói tản văn, podcast, radio đêm |
| `vi-VN-Northern-Male-3` | Đức Duy | Miền Bắc | Nam | Review công nghệ, video TikTok, Shorts vui tươi |
| `vi-VN-Northern-Male-4` | Việt Hùng | Miền Bắc | Nam | Phim tài liệu lịch sử, giọng trung niên trầm hùng |
| `vi-VN-Northern-Male-5` | Hải Đăng | Miền Bắc | Nam | Sách thiếu nhi, phim hoạt hình |
| `vi-VN-Northern-Female-1` | Mai Chi | Miền Bắc | Nữ | MC đài truyền hình, phóng sự, thuyết minh |
| `vi-VN-Northern-Female-2` | Ngọc Lan | Miền Bắc | Nữ | Sách nói ngôn tình, thiền định, nhẹ nhàng |
| `vi-VN-Northern-Female-3` | Hà My | Miền Bắc | Nữ | E-learning, bài giảng trực tuyến, giới thiệu app |
| `vi-VN-Northern-Female-4` | Thục Quyên | Miền Bắc | Nữ | Kịch truyền thanh, văn học cổ điển |
| `vi-VN-Northern-Female-5` | Bảo Trâm | Miền Bắc | Nữ | Quảng cáo TVC thương mại, giọng tự tin cuốn hút |
| `vi-VN-Central-Male-1` | Bảo An | Miền Trung (Huế) | Nam | Thơ văn Huế, sâu lắng, trầm mặc |
| `vi-VN-Central-Male-2` | Trung Nghĩa | Miền Trung (Đà Nẵng) | Nam | Du lịch, trải nghiệm ẩm thực miền Trung |
| `vi-VN-Central-Male-3` | Văn Hiệp | Miền Trung (Quảng Nam) | Nam | Truyện kể dân gian, phóng sự đời sống |
| `vi-VN-Central-Male-4` | Thành Vinh | Miền Trung (Nghệ An) | Nam | Bình luận thể thao, phong cách khỏe khoắn |
| `vi-VN-Central-Female-1` | Như Quỳnh | Miền Trung (Huế) | Nữ | Giọng Huế ngọt ngào, dịu dàng, hoài niệm |
| `vi-VN-Central-Female-2` | Diệu Thảo | Miền Trung (Huế) | Nữ | Đọc thơ, nhạc trữ tình, lãng mạn |
| `vi-VN-Central-Female-3` | Thu Trang | Miền Trung (Đà Nẵng) | Nữ | Chăm sóc khách hàng, tổng đài tự động |
| `vi-VN-Central-Female-4` | Cẩm Tú | Miền Trung (Khánh Hòa) | Nữ | Giới thiệu danh lam thắng cảnh biển đảo |
| `vi-VN-Southern-Male-1` | Hùng Dũng | Miền Nam (Sài Gòn) | Nam | TVC quảng cáo hàng đầu, doanh nghiệp sang trọng |
| `vi-VN-Southern-Male-2` | Minh Trí | Miền Nam (Sài Gòn) | Nam | Vlog đời sống, review đồ ăn, hài hước |
| `vi-VN-Southern-Male-3` | Quốc Hưng | Miền Nam (Miền Tây) | Nam | Truyện sông nước miệt vườn, hào sảng |
| `vi-VN-Southern-Male-4` | Tấn Tài | Miền Nam (Nam Bộ) | Nam | Bản tin kinh tế, tài chính, chứng khoán |
| `vi-VN-Southern-Male-5` | Chí Thiện | Miền Nam (Sài Gòn) | Nam | Kể chuyện đêm muộn, podcast chữa lành tâm hồn |
| `vi-VN-Southern-Female-1` | Thảo Vy | Miền Nam (Sài Gòn) | Nữ | Thời thượng, hiện đại, giới thiệu mỹ phẩm/thời trang |
| `vi-VN-Southern-Female-2` | Yến Nhi | Miền Nam (Sài Gòn) | Nữ | TikTok trend, video ngắn giới thiệu sản phẩm |
| `vi-VN-Southern-Female-3` | Mỹ Linh | Miền Nam (Miền Tây) | Nữ | Giọng miền Tây ngọt lịm, đậm tình quê hương |
| `vi-VN-Southern-Female-4` | Thanh Trúc | Miền Nam (Sài Gòn) | Nữ | MC sự kiện, hội nghị, chuyên nghiệp |
| `vi-VN-Southern-Female-5` | Bích Vân | Miền Nam (Sài Gòn) | Nữ | Kể chuyện kinh dị, truyện trinh thám ly kỳ |

---

## 6. Thẻ biểu cảm & điều khiển ngữ điệu (Độc quyền)

Mô hình VieNeu-TTS v3 Turbo hỗ trợ nhận diện các thẻ cảm xúc phi ngôn ngữ chèn trực tiếp vào văn bản để tăng tính tự nhiên:

* `[cười]`: Chèn tiếng cười nhẹ hoặc ngữ điệu vui vẻ, thích thú.
* `[thở dài]`: Chèn hơi thở dài diễn tả cảm xúc buồn, tiếc nuối hoặc thư giãn.
* `[hắng giọng]`: Tiếng hắng giọng ngắn thu hút sự chú ý.
* `[nghỉ 0.5s]` hoặc `[nghỉ 1.0s]`: Tùy chỉnh độ dài ngắt nghỉ giữa các ý văn.

#### Ví dụ văn bản giàu cảm xúc:
```text
Hôm nay đi làm về mệt quá mọi người ơi [thở dài]. Nhưng nhận được tin nhắn lương về là lại thấy vui ngay [cười]!
```

---

## 7. Bảng mã lỗi (Error Codes)

Khi có lỗi xảy ra, API trả về cấu trúc lỗi JSON chuẩn:
```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Tài khoản của bạn không đủ credit để thực hiện yêu cầu này."
  }
}
```

| HTTP Status | Mã lỗi (`code`) | Nguyên nhân & Hướng giải quyết |
|---|---|---|
| `400` | `INVALID_INPUT` | Văn bản rỗng hoặc vượt quá giới hạn 5.000 ký tự. |
| `401` | `INVALID_API_KEY` | Thiếu Header Authorization hoặc API Key sai / đã bị xóa. |
| `401` | `MISSING_CREDENTIALS` | Chưa truyền `Authorization: Bearer <API_KEY>`. |
| `402` | `INSUFFICIENT_CREDITS` | Hết số dư Credit. Hãy nạp thêm gói cước trên web studio. |
| `403` | `API_KEY_REVOKED` | API Key này đã bị tắt/vô hiệu hóa trong bảng quản trị. |
| `503` | `GPU_WORKER_OFFLINE` | Colab GPU Worker chưa kết nối vào hệ thống. Hãy mở Google Colab và chạy worker. |
| `504` | `WORKER_TIMEOUT` | GPU Worker không phản hồi kết quả sau 60 giây. |

---

## 8. Code mẫu tích hợp đa ngôn ngữ

### 8.1. cURL

```bash
curl -X POST "https://your-gateway.trycloudflare.com/v1/audio/speech" \
     -H "Authorization: Bearer <YOUR_API_KEY>" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "vieneu-v3-turbo",
       "input": "Xin chào! Đây là âm thanh tạo từ API VieNeu TTS.",
       "voice": "vi-VN-Northern-Male-1",
       "speed": 1.0,
       "response_format": "mp3"
     }'
```

---

### 8.2. Python (Requests)

```python
import requests

API_URL = "https://your-gateway.trycloudflare.com/v1/audio/speech"
API_KEY = "<YOUR_API_KEY>"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

payload = {
    "model": "vieneu-v3-turbo",
    "input": "Trải nghiệm giọng đọc trí tuệ nhân tạo tiếng Việt với VieNeu v3 Turbo [cười].",
    "voice": "vi-VN-Northern-Female-1",
    "speed": 1.0,
    "response_format": "mp3"
}

response = requests.post(API_URL, json=payload, headers=headers)

if response.status_code == 200:
    data = response.json()
    print("✅ Tạo âm thanh thành công!")
    print(f"🔗 Link Audio: {data['audio_url']}")
    print(f"⏱️ Thời gian xử lý: {data['execution_time_ms']} ms")
    
    # Tải file về máy tính
    audio_data = requests.get(data['audio_url']).content
    with open("output.mp3", "wb") as f:
        f.write(audio_data)
    print("📁 Đã lưu file: output.mp3")
else:
    print(f"❌ Lỗi {response.status_code}: {response.json()}")
```

---

### 8.3. Python (Dùng OpenAI SDK chính thức)

Vì API hoàn toàn tương thích cấu trúc OpenAI, bạn có thể tái sử dụng thư viện `openai`:

```python
from openai import OpenAI

# Trỏ base_url về Gateway của bạn
client = OpenAI(
    api_key="<YOUR_API_KEY>",
    base_url="https://your-gateway.trycloudflare.com/v1"
)

response = client.audio.speech.create(
    model="vieneu-v3-turbo",
    voice="vi-VN-Southern-Female-1",
    input="Chúc bạn một ngày làm việc thật nhiều năng lượng và hiệu quả!"
)

# In kết quả hoặc lưu file
print(response)
```

---

### 8.4. Node.js / TypeScript (Fetch API)

```typescript
async function generateSpeech(text: string, voiceId = "vi-VN-Northern-Male-1") {
  const GATEWAY_URL = "https://your-gateway.trycloudflare.com/v1/audio/speech";
  const API_KEY = "<YOUR_API_KEY>";

  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "vieneu-v3-turbo",
        input: text,
        voice: voiceId,
        speed: 1.0,
        response_format: "mp3",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Tạo âm thanh thất bại");
    }

    console.log("Audio URL:", data.audio_url);
    console.log("Execution Time:", data.execution_time_ms, "ms");
    return data.audio_url;
  } catch (error) {
    console.error("Lỗi:", error);
  }
}

// Chạy thử
generateSpeech("Chào mừng quý khách đến với dịch vụ tổng đài tự động.");
```

---

### 8.5. PHP (cURL)

```php
<?php
$apiUrl = "https://your-gateway.trycloudflare.com/v1/audio/speech";
$apiKey = "<YOUR_API_KEY>";

$data = [
    "model" => "vieneu-v3-turbo",
    "input" => "Xin chào, đơn hàng của quý khách đã được vận chuyển thành công.",
    "voice" => "vi-VN-Central-Female-1",
    "speed" => 1.0,
    "response_format" => "mp3"
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $result = json_decode($response, true);
    echo "Audio URL: " . $result["audio_url"] . "\n";
} else {
    echo "Lỗi: " . $response . "\n";
}
?>
```

---

### 8.6. Golang

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type TTSRequest struct {
	Model          string  `json:"model"`
	Input          string  `json:"input"`
	Voice          string  `json:"voice"`
	Speed          float64 `json:"speed"`
	ResponseFormat string  `json:"response_format"`
}

type TTSResponse struct {
	JobID           string `json:"job_id"`
	Status          string `json:"status"`
	AudioURL        string `json:"audio_url"`
	ExecutionTimeMs int    `json:"execution_time_ms"`
}

func main() {
	url := "https://your-gateway.trycloudflare.com/v1/audio/speech"
	apiKey := "<YOUR_API_KEY>"

	reqBody := TTSRequest{
		Model:          "vieneu-v3-turbo",
		Input:          "Hệ thống chuyển đổi văn bản sang âm thanh tự động bằng Golang.",
		Voice:          "vi-VN-Northern-Male-3",
		Speed:          1.0,
		ResponseFormat: "mp3",
	}

	jsonData, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusOK {
		var result TTSResponse
		json.Unmarshal(body, &result)
		fmt.Printf("✅ Audio URL: %s (Time: %d ms)\n", result.AudioURL, result.ExecutionTimeMs)
	} else {
		fmt.Printf("❌ Lỗi: %s\n", string(body))
	}
}
```

---

## 9. Hỗ trợ kỹ thuật & Cộng đồng

* Nếu gặp lỗi kết nối hoặc cần nâng cấp hạn mức doanh nghiệp, vui lòng liên hệ ban quản trị qua trang **Dashboard** hoặc email quản trị.
* Mã nguồn và cập nhật mới nhất luôn được đồng bộ tại repository chính thức của nền tảng.
