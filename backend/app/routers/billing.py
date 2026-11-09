import math
import random
import logging
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.middlewares.auth import get_current_auth
from app.core.supabase import get_supabase_admin

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/v1/billing", tags=["Billing & Credits"])

# Cấu hình tài khoản Vietcombank từ ảnh mã QR người dùng cung cấp
BANK_BIN = "970436"         # Vietcombank BIN
BANK_NAME = "Vietcombank"
BANK_ACCOUNT = "1071895625"
BANK_ACCOUNT_NAME = "VIENEU TTS"
ADMIN_EMAIL = "admin@gmail.com"

PACKAGES_DATA = {
    "normal": {
        "id": "normal",
        "name": "Gói Miễn Phí",
        "credits": 1000,
        "price_vnd": 0,
        "words_equivalent": 5000,
        "badge": "Miễn phí",
        "description": "Dành cho người mới trải nghiệm chất lượng giọng đọc AI.",
        "is_popular": False,
        "features": [
            "1.000 Credit khởi tạo (~5.000 từ)",
            "Toàn bộ giọng đọc Bắc - Trung - Nam",
            "Độ trễ tiêu chuẩn",
            "Xuất file MP3 & WAV"
        ]
    },
    "plus": {
        "id": "plus",
        "name": "Gói Plus",
        "credits": 20000,
        "price_vnd": 20000,
        "words_equivalent": 100000,
        "badge": "Khởi đầu tốt",
        "description": "Phù hợp làm video ngắn, podcast và đọc tin tức hàng ngày.",
        "is_popular": False,
        "features": [
            "20.000 Credit (~100.000 từ)",
            "Chỉ 1đ / 1 credit",
            "Không giới hạn số lần tạo",
            "Tốc độ xử lý ưu tiên nhẹ",
            "Hỗ trợ xuất API"
        ]
    },
    "pro": {
        "id": "pro",
        "name": "Gói Pro",
        "credits": 100000,
        "price_vnd": 80000,
        "words_equivalent": 500000,
        "badge": "Phổ biến nhất",
        "description": "Lựa chọn hàng đầu cho các nhà sáng tạo nội dung YouTube/TikTok chuyên nghiệp.",
        "is_popular": True,
        "features": [
            "100.000 Credit (~500.000 từ)",
            "Tiết kiệm 20% chi phí",
            "Ưu tiên hàng đợi cao cấp",
            "Tạo nhiều API Keys cho dự án",
            "Băng thông tải không giới hạn"
        ]
    },
    "ultra": {
        "id": "ultra",
        "name": "Gói Ultra",
        "credits": 300000,
        "price_vnd": 150000,
        "words_equivalent": 1500000,
        "badge": "Tiết kiệm 50%",
        "description": "Dành cho studio sản xuất sách nói, doanh nghiệp và agency nội dung số.",
        "is_popular": False,
        "features": [
            "300.000 Credit (~1.500.000 từ)",
            "Giá tốt nhất chỉ 0.5đ / credit",
            "Tốc độ phản hồi tức thì",
            "Hàng đợi ưu tiên VIP cao nhất",
            "Hỗ trợ kỹ thuật 24/7"
        ]
    }
}


class CreateOrderRequest(BaseModel):
    package_id: str = Field(..., description="Mã gói nạp: plus, pro, ultra")
    preferred_code: Optional[str] = Field(None, description="Mã mong muốn nếu có")


class NotifyTransferRequest(BaseModel):
    order_code: str = Field(..., description="Mã đơn nạp user thông báo đã chuyển khoản")


class AdminApproveRequest(BaseModel):
    order_code: str = Field(..., description="Mã đơn nạp hoặc mã 6 chữ số cần duyệt")


class AdminRejectRequest(BaseModel):
    order_code: str = Field(..., description="Mã đơn nạp cần từ chối")
    reason: Optional[str] = Field("Thông tin giao dịch không hợp lệ", description="Lý do từ chối")


def generate_vietqr_url(bank_bin: str, account_number: str, amount: int, transfer_content: str) -> str:
    """
    Sinh link ảnh VietQR chuẩn tự động tương thích ứng dụng của tất cả ngân hàng tại Việt Nam.
    """
    encoded_content = transfer_content.replace(" ", "%20")
    return f"https://img.vietqr.io/image/{bank_bin}-{account_number}-compact2.png?amount={amount}&addInfo={encoded_content}&accountName={BANK_ACCOUNT_NAME.replace(' ', '%20')}"


def clean_order_code(code: str) -> str:
    """Chuẩn hóa mã đơn: nếu nhập '849201' thì biến thành 'TTS849201'."""
    clean = code.strip().upper()
    if clean.isdigit() and len(clean) == 6:
        clean = f"TTS{clean}"
    return clean


@router.get("/packages")
async def get_packages():
    """Lấy danh sách tất cả các gói cước."""
    supabase = get_supabase_admin()
    try:
        res = supabase.table("credit_packages").select("*").order("sort_order").execute()
        if res.data and len(res.data) > 0:
            return {"packages": res.data}
    except Exception as e:
        logger.warning(f"Lỗi truy vấn packages từ DB: {e}")
    
    return {"packages": list(PACKAGES_DATA.values())}


@router.get("/balance")
async def get_balance(auth_ctx: dict = Depends(get_current_auth)):
    """Lấy số dư credit và gói cước hiện tại của người dùng."""
    user_id = auth_ctx.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Xác thực không hợp lệ")

    supabase = get_supabase_admin()
    try:
        res = supabase.table("user_credits").select("*").eq("user_id", user_id).limit(1).execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            credit_balance = row.get("credit_balance", 1000)
            tier = row.get("tier", "normal")
            total_used = row.get("total_used_credits", 0)
        else:
            credit_balance = 1000
            tier = "normal"
            total_used = 0
            supabase.table("user_credits").insert({
                "user_id": user_id,
                "tier": "normal",
                "credit_balance": 1000,
                "total_used_credits": 0
            }).execute()

        return {
            "user_id": user_id,
            "tier": tier,
            "credit_balance": credit_balance,
            "words_remaining": credit_balance * 5,
            "total_used_credits": total_used,
            "rate_words_per_credit": 5
        }
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin credit của user {user_id}: {e}")
        return {
            "user_id": user_id,
            "tier": "normal",
            "credit_balance": 1000,
            "words_remaining": 5000,
            "total_used_credits": 0,
            "rate_words_per_credit": 5
        }


@router.post("/create-order")
async def create_order(
    payload: CreateOrderRequest,
    auth_ctx: dict = Depends(get_current_auth)
):
    """
    Tạo đơn nạp credit và sinh mã QR Vietcombank chuẩn VietQR kèm mã 6 số.
    """
    user_id = auth_ctx.get("user_id")
    user_email = auth_ctx.get("email") or ""

    pkg_id = payload.package_id.lower()
    if pkg_id not in PACKAGES_DATA or pkg_id == "normal":
        raise HTTPException(status_code=400, detail="Gói nạp không hợp lệ. Vui lòng chọn Plus, Pro hoặc Ultra.")

    pkg = PACKAGES_DATA[pkg_id]
    amount = pkg["price_vnd"]
    credits = pkg["credits"]

    if payload.preferred_code and len(payload.preferred_code.strip()) >= 6:
        order_code = clean_order_code(payload.preferred_code)
    else:
        random_num = random.randint(100000, 999999)
        order_code = f"TTS{random_num}"

    transfer_content = order_code
    qr_url = generate_vietqr_url(BANK_BIN, BANK_ACCOUNT, amount, transfer_content)

    supabase = get_supabase_admin()
    order_record = {
        "order_code": order_code,
        "user_id": user_id,
        "package_id": pkg_id,
        "amount_vnd": amount,
        "credits_granted": credits,
        "target_tier": pkg_id,
        "bank_bin": BANK_BIN,
        "bank_name": BANK_NAME,
        "bank_account": BANK_ACCOUNT,
        "transfer_content": transfer_content,
        "qr_data_url": qr_url,
        "status": "PENDING"
    }
    if user_email:
        order_record["user_email"] = user_email

    try:
        supabase.table("payment_orders").insert(order_record).execute()
    except Exception as e:
        logger.warning(f"Lưu đơn nạp DB thất bại (có thể đã tồn tại mã): {e}")

    return {
        "success": True,
        "order_code": order_code,
        "code_number": order_code.replace("TTS", ""),
        "package": pkg,
        "amount_vnd": amount,
        "credits_granted": credits,
        "bank_info": {
            "bin": BANK_BIN,
            "bank_name": BANK_NAME,
            "account_number": BANK_ACCOUNT,
            "account_name": BANK_ACCOUNT_NAME,
            "transfer_content": transfer_content,
            "amount": amount
        },
        "qr_code_url": qr_url,
        "status": "PENDING",
        "instructions": [
            f"1. Mở ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank...)",
            f"2. Quét mã VietQR trên màn hình",
            f"3. Giữ nguyên số tiền {amount:,}đ và nội dung chuyển khoản là '{transfer_content}'",
            f"4. Bấm 'Tôi đã quét mã & chuyển khoản' để gửi yêu cầu cho Admin duyệt."
        ]
    }


@router.get("/orders/{order_code}")
async def get_order_status(
    order_code: str,
    auth_ctx: dict = Depends(get_current_auth)
):
    """Kiểm tra trạng thái của một đơn nạp cụ thể."""
    user_id = auth_ctx.get("user_id")
    code = clean_order_code(order_code)
    supabase = get_supabase_admin()

    try:
        res = supabase.table("payment_orders").select("*").eq("order_code", code).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn nạp.")
        order = res.data[0]
        return {
            "order_code": order["order_code"],
            "status": order["status"],
            "amount_vnd": order["amount_vnd"],
            "credits_granted": order["credits_granted"],
            "target_tier": order["target_tier"],
            "completed_at": order.get("completed_at")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify-transfer")
async def notify_transfer(
    payload: NotifyTransferRequest,
    auth_ctx: dict = Depends(get_current_auth)
):
    """
    Người dùng thông báo đã chuyển khoản -> Chuyển đơn sang trạng thái WAITING_APPROVAL.
    (Người dùng KHÔNG được tự ý duyệt đơn).
    """
    code = clean_order_code(payload.order_code)
    supabase = get_supabase_admin()

    try:
        res = supabase.table("payment_orders").select("*").eq("order_code", code).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn nạp.")
        order = res.data[0]
        if order["status"] == "COMPLETED":
            return {"success": True, "status": "COMPLETED", "message": "Đơn nạp đã được Admin duyệt thành công!"}

        supabase.table("payment_orders").update({
            "status": "WAITING_APPROVAL"
        }).eq("id", order["id"]).execute()

        return {
            "success": True,
            "status": "WAITING_APPROVAL",
            "message": "Đã gửi thông báo chuyển khoản thành công. Admin sẽ kiểm tra và duyệt credit trong ít phút."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ====================================================================
# ADMIN ENDPOINTS (CHỈ DÀNH CHO admin@gmail.com)
# ====================================================================

def verify_admin(auth_ctx: dict):
    user_email = auth_ctx.get("email") or ""
    if user_email.lower() != ADMIN_EMAIL.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Truy cập bị từ chối. Chỉ tài khoản quản trị admin@gmail.com mới có quyền duyệt nạp."
        )


@router.get("/admin/orders")
async def admin_get_orders(
    status_filter: Optional[str] = None,
    auth_ctx: dict = Depends(get_current_auth)
):
    """Admin lấy danh sách tất cả các đơn nạp tiền."""
    verify_admin(auth_ctx)
    supabase = get_supabase_admin()

    try:
        query = supabase.table("payment_orders").select("*").order("created_at", desc=True)
        if status_filter:
            query = query.eq("status", status_filter.upper())
        res = query.limit(50).execute()
        return {"orders": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/approve-order")
async def admin_approve_order(
    payload: AdminApproveRequest,
    auth_ctx: dict = Depends(get_current_auth)
):
    """
    Admin duyệt nạp thành công bằng mã đơn hoặc mã 6 chữ số:
    Cộng credit + Nâng hạng tài khoản người dùng ngay lập tức.
    """
    verify_admin(auth_ctx)
    order_code = clean_order_code(payload.order_code)
    supabase = get_supabase_admin()

    try:
        # 1. Gọi stored function complete_payment_order nếu có
        res = supabase.rpc("complete_payment_order", {"p_order_code": order_code}).execute()
        if res.data and res.data.get("success"):
            return res.data
    except Exception as rpc_err:
        logger.warning(f"RPC complete_payment_order lỗi: {rpc_err}, xử lý thủ công qua admin client.")

    try:
        order_res = supabase.table("payment_orders").select("*").eq("order_code", order_code).limit(1).execute()
        if not order_res.data:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy đơn nạp với mã {order_code}.")

        order = order_res.data[0]
        if order.get("status") == "COMPLETED":
            return {"success": True, "message": "Đơn này đã được duyệt thành công trước đó."}

        # Cập nhật status
        supabase.table("payment_orders").update({
            "status": "COMPLETED",
            "completed_at": datetime.utcnow().isoformat() + "Z"
        }).eq("id", order["id"]).execute()

        # Cập nhật ví credit
        credit_res = supabase.table("user_credits").select("*").eq("user_id", order["user_id"]).limit(1).execute()
        current_balance = 0
        current_tier = "normal"
        if credit_res.data:
            current_balance = credit_res.data[0].get("credit_balance", 0)
            current_tier = credit_res.data[0].get("tier", "normal")

        new_balance = current_balance + order["credits_granted"]
        target_tier = order["target_tier"]

        # Cập nhật tier người dùng
        supabase.table("user_credits").upsert({
            "user_id": order["user_id"],
            "credit_balance": new_balance,
            "tier": target_tier,
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }).execute()

        # Ghi log lịch sử biến động
        supabase.table("credit_transactions").insert({
            "user_id": order["user_id"],
            "amount": order["credits_granted"],
            "balance_after": new_balance,
            "type": "TOPUP",
            "order_id": order["id"],
            "description": f"Admin duyệt nạp thành công đơn {order_code} (+{order['credits_granted']:,} Credit)"
        }).execute()

        return {
            "success": True,
            "order_code": order_code,
            "credits_added": order["credits_granted"],
            "new_balance": new_balance,
            "tier": target_tier,
            "user_id": order["user_id"]
        }
    except Exception as e:
        logger.error(f"Lỗi khi admin duyệt đơn {order_code}: {e}")
        raise HTTPException(status_code=500, detail=f"Không thể duyệt đơn: {str(e)}")


@router.post("/admin/reject-order")
async def admin_reject_order(
    payload: AdminRejectRequest,
    auth_ctx: dict = Depends(get_current_auth)
):
    """Admin từ chối đơn nạp."""
    verify_admin(auth_ctx)
    order_code = clean_order_code(payload.order_code)
    supabase = get_supabase_admin()

    try:
        supabase.table("payment_orders").update({
            "status": "CANCELLED"
        }).eq("order_code", order_code).execute()

        return {"success": True, "order_code": order_code, "status": "CANCELLED"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(auth_ctx: dict = Depends(get_current_auth)):
    """Lấy danh sách đơn nạp và lịch sử biến động credit của người dùng."""
    user_id = auth_ctx.get("user_id")
    supabase = get_supabase_admin()

    orders = []
    transactions = []

    try:
        orders_res = supabase.table("payment_orders") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()
        orders = orders_res.data or []
    except Exception as e:
        logger.warning(f"Lỗi lấy orders: {e}")

    try:
        tx_res = supabase.table("credit_transactions") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(30) \
            .execute()
        transactions = tx_res.data or []
    except Exception as e:
        logger.warning(f"Lỗi lấy credit transactions: {e}")

    return {
        "orders": orders,
        "transactions": transactions
    }
