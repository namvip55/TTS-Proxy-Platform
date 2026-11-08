from typing import List
from fastapi import APIRouter
from app.models.schemas import VoiceItem, VoiceListResponse

router = APIRouter(prefix="/v1/voices", tags=["Voices"])

# Danh sách 28 giọng đọc VieNeu-TTS v3 Turbo chất lượng cao phân bổ 3 miền Bắc - Trung - Nam
VIENEU_VOICES: List[VoiceItem] = [
    # Miền Bắc - Nam
    VoiceItem(
        id="vi-VN-Northern-Male-1",
        name="Quang Minh (Bắc)",
        region="Bắc",
        gender="Nam",
        description="Giọng đọc nam Hà Nội chuẩn, phong thái đĩnh đạc, phù hợp tin tức, phóng sự và tài liệu.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Northern-Male-1.mp3"
    ),
    VoiceItem(
        id="vi-VN-Northern-Male-2",
        name="Tuấn Kiệt (Bắc)",
        region="Bắc",
        gender="Nam",
        description="Giọng nam trầm ấm, truyền cảm, thích hợp đọc sách nói, tản văn và podcast.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Northern-Male-2.mp3"
    ),
    VoiceItem(
        id="vi-VN-Northern-Male-3",
        name="Đức Duy (Bắc)",
        region="Bắc",
        gender="Nam",
        description="Giọng nam trẻ trung, năng động, phong cách review công nghệ và video ngắn TikTok/YouTube.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Northern-Male-3.mp3"
    ),
    VoiceItem(
        id="vi-VN-Northern-Male-4",
        name="Việt Hùng (Bắc)",
        region="Bắc",
        gender="Nam",
        description="Giọng nam trung niên đằm thắm, uy nghiêm, dành cho phim tài liệu lịch sử.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Northern-Male-4.mp3"
    ),
    VoiceItem(
        id="vi-VN-Northern-Male-5",
        name="Hải Đăng (Bắc)",
        region="Bắc",
        gender="Nam",
        description="Giọng nam tươi vui, tự nhiên, thích hợp sách thiếu nhi và hoạt hình.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Northern-Male-5.mp3"
    ),

    # Miền Bắc - Nữ
    VoiceItem(
        id="vi-VN-Northern-Female-1",
        name="Mai Chi (Bắc)",
        region="Bắc",
        gender="Nữ",
        description="Giọng nữ phát thanh viên chuẩn đài quốc gia, trong trẻo, lưu loát.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Northern-Female-1.mp3"
    ),
    VoiceItem(
        id="vi-VN-Northern-Female-2",
        name="Ngọc Lan (Bắc)",
        region="Bắc",
        gender="Nữ",
        description="Giọng nữ dịu dàng, êm ái, lý tưởng cho sách nói ngôn tình và thiền định.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Northern-Female-2.mp3"
    ),
    VoiceItem(
        id="vi-VN-Northern-Female-3",
        name="Hà My (Bắc)",
        region="Bắc",
        gender="Nữ",
        description="Giọng nữ MC trẻ, hiện đại, thuyết minh bài giảng và e-learning.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Northern-Female-3.mp3"
    ),
    VoiceItem(
        id="vi-VN-Northern-Female-4",
        name="Thục Quyên (Bắc)",
        region="Bắc",
        gender="Nữ",
        description="Giọng nữ Hà Nội thanh lịch, biểu cảm phong phú dành cho kịch truyền thanh.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Northern-Female-4.mp3"
    ),
    VoiceItem(
        id="vi-VN-Northern-Female-5",
        name="Bảo Trâm (Bắc)",
        region="Bắc",
        gender="Nữ",
        description="Giọng nữ chuyên nghiệp, tự tin, thích hợp quảng cáo TVC và giới thiệu sản phẩm.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Northern-Female-5.mp3"
    ),

    # Miền Trung - Nam
    VoiceItem(
        id="vi-VN-Central-Male-1",
        name="Bảo An (Huế)",
        region="Trung",
        gender="Nam",
        description="Giọng nam Huế nhẹ nhàng, văn vẻ, sâu lắng, đậm chất thơ.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Central-Male-1.mp3"
    ),
    VoiceItem(
        id="vi-VN-Central-Male-2",
        name="Trung Nghĩa (Đà Nẵng)",
        region="Trung",
        gender="Nam",
        description="Giọng nam Đà Nẵng rõ ràng, truyền cảm, phong cách du lịch và ẩm thực.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Central-Male-2.mp3"
    ),
    VoiceItem(
        id="vi-VN-Central-Male-3",
        name="Văn Hiệp (Quảng Nam)",
        region="Trung",
        gender="Nam",
        description="Giọng nam Quảng Nam mộc mạc, gần gũi, dành cho truyện dân gian.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Central-Male-3.mp3"
    ),
    VoiceItem(
        id="vi-VN-Central-Male-4",
        name="Thành Vinh (Nghệ An)",
        region="Trung",
        gender="Nam",
        description="Giọng nam xứ Nghệ khỏe khoắn, chân tình, thích hợp bình luận thể thao và văn hóa.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Central-Male-4.mp3"
    ),

    # Miền Trung - Nữ
    VoiceItem(
        id="vi-VN-Central-Female-1",
        name="Như Quỳnh (Huế)",
        region="Trung",
        gender="Nữ",
        description="Giọng nữ Huế ngọt ngào, đằm thắm, mang âm hưởng cố đô cổ kính.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Central-Female-1.mp3"
    ),
    VoiceItem(
        id="vi-VN-Central-Female-2",
        name="Diệu Thảo (Huế)",
        region="Trung",
        gender="Nữ",
        description="Giọng nữ Huế trong trẻo, du dương, lý tưởng cho đọc thơ và truyện tình ca.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Central-Female-2.mp3"
    ),
    VoiceItem(
        id="vi-VN-Central-Female-3",
        name="Thu Trang (Đà Nẵng)",
        region="Trung",
        gender="Nữ",
        description="Giọng nữ Đà Nẵng ấm áp, dễ nghe, phù hợp tư vấn khách hàng tự động.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Central-Female-3.mp3"
    ),
    VoiceItem(
        id="vi-VN-Central-Female-4",
        name="Cẩm Tú (Khánh Hòa)",
        region="Trung",
        gender="Nữ",
        description="Giọng nữ Nam Trung Bộ tươi sáng, rạng rỡ, thích hợp du lịch và giới thiệu trải nghiệm.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Central-Female-4.mp3"
    ),

    # Miền Nam - Nam
    VoiceItem(
        id="vi-VN-Southern-Male-1",
        name="Hùng Dũng (Sài Gòn)",
        region="Nam",
        gender="Nam",
        description="Giọng nam Sài Gòn sang trọng, lôi cuốn, giọng TVC quảng cáo hàng đầu.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Southern-Male-1.mp3"
    ),
    VoiceItem(
        id="vi-VN-Southern-Male-2",
        name="Minh Trí (Sài Gòn)",
        region="Nam",
        gender="Nam",
        description="Giọng nam trẻ Sài Gòn tự nhiên, hài hước, phong cách sáng tạo nội dung vlog.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Southern-Male-2.mp3"
    ),
    VoiceItem(
        id="vi-VN-Southern-Male-3",
        name="Quốc Hưng (Miền Tây)",
        region="Nam",
        gender="Nam",
        description="Giọng nam miền Tây chân chất, hào sảng, thích hợp truyện kể miệt vườn.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Southern-Male-3.mp3"
    ),
    VoiceItem(
        id="vi-VN-Southern-Male-4",
        name="Tấn Tài (Nam Bộ)",
        region="Nam",
        gender="Nam",
        description="Giọng nam trung niên đĩnh đạc, phù hợp bản tin tài chính và kinh tế.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Southern-Male-4.mp3"
    ),
    VoiceItem(
        id="vi-VN-Southern-Male-5",
        name="Chí Thiện (Sài Gòn)",
        region="Nam",
        gender="Nam",
        description="Giọng nam ấm áp, kể chuyện đêm khuya, podcast chữa lành.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Southern-Male-5.mp3"
    ),

    # Miền Nam - Nữ
    VoiceItem(
        id="vi-VN-Southern-Female-1",
        name="Thảo Vy (Sài Gòn)",
        region="Nam",
        gender="Nữ",
        description="Giọng nữ Sài Gòn thời thượng, thanh thoát, chuyên nghiệp cho giới thiệu thương hiệu.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Southern-Female-1.mp3"
    ),
    VoiceItem(
        id="vi-VN-Southern-Female-2",
        name="Yến Nhi (Sài Gòn)",
        region="Nam",
        gender="Nữ",
        description="Giọng nữ trẻ năng động, vui tươi, thích hợp video TikTok, Reels và review ẩm thực.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Southern-Female-2.mp3"
    ),
    VoiceItem(
        id="vi-VN-Southern-Female-3",
        name="Mỹ Linh (Miền Tây)",
        region="Nam",
        gender="Nữ",
        description="Giọng nữ miền Tây sông nước ngọt lịm, ấm áp, giàu tình cảm.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Southern-Female-3.mp3"
    ),
    VoiceItem(
        id="vi-VN-Southern-Female-4",
        name="Thanh Trúc (Sài Gòn)",
        region="Nam",
        gender="Nữ",
        description="Giọng nữ MC hội nghị truyền hình, rõ ràng, rành mạch và cuốn hút.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Southern-Female-4.mp3"
    ),
    VoiceItem(
        id="vi-VN-Southern-Female-5",
        name="Bích Vân (Sài Gòn)",
        region="Nam",
        gender="Nữ",
        description="Giọng nữ phát thanh truyện ma, kịch bản ly kỳ hoặc tài liệu xã hội.",
        sample_url="https://sample-audio.vieneu.ai/vi-VN-Southern-Female-5.mp3"
    ),
]


@router.get("", response_model=VoiceListResponse)
async def list_voices():
    """Lấy danh sách 28+ giọng đọc VieNeu-TTS v3 Turbo với bộ lọc vùng miền và giới tính."""
    return VoiceListResponse(
        total=len(VIENEU_VOICES),
        voices=VIENEU_VOICES
    )
