#!/bin/bash
set -e

echo "=================================================="
echo "    BrewLite - Khởi động Cloudflare Tunnel        "
echo "=================================================="

# Đọc cấu hình cổng từ .env nếu có
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
PORT=4003
if [ -f "$ROOT_DIR/.env" ]; then
    ENV_PORT=$(grep -E '^BACKEND_PORT=' "$ROOT_DIR/.env" | cut -d '=' -f2 | tr -d ' "\r')
    if [ -n "$ENV_PORT" ]; then
        PORT="$ENV_PORT"
    fi
fi

# Kiểm tra backend cục bộ
if curl -s "http://localhost:$PORT" > /dev/null; then
    echo "✓ Đã phát hiện Backend NestJS đang chạy tại http://localhost:$PORT"
else
    echo "⚠ CẢNH BÁO: Chưa thấy Backend chạy tại cổng $PORT."
    echo "  Vui lòng khởi động backend bằng Docker trước:"
    echo "  $ docker compose up -d"
    echo ""
    read -p "Bạn có muốn khởi động backend ngay bây giờ không? (y/n): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        docker compose up -d
        echo "Đang chờ backend sẵn sàng..."
        until curl -s "http://localhost:$PORT" > /dev/null; do
            sleep 2
        done
        echo "✓ Backend đã sẵn sàng!"
        echo "💡 Gợi ý: Để theo dõi log request HTTP của backend, mở terminal khác chạy: bash scripts/logs.sh"
    fi
fi

echo ""
echo "--------------------------------------------------"
echo "Đang khởi tạo đường hầm HTTPS ra ngoài Internet..."
echo "Hệ thống sẽ cấp cho bạn một đường link HTTPS miễn phí."
echo "Hãy copy link đó và dán vào biến môi trường NEXT_PUBLIC_API_URL trên Vercel."
echo "Nhấn Ctrl+C để dừng đường hầm khi kết thúc demo."
echo "--------------------------------------------------"
echo ""

# Nếu đã cài binary cloudflared thì dùng trực tiếp
if command -v cloudflared &> /dev/null; then
    cloudflared tunnel --protocol http2 --url "http://localhost:$PORT"
else
    # Nếu chưa cài, chạy qua Docker image chính chủ của Cloudflare (dùng HTTP/2 để tránh bị nhà mạng chặn UDP/QUIC)
    echo "-> Đang chạy Cloudflare Tunnel qua Docker container (giao thức HTTP/2)..."
    docker run --rm -it --network host cloudflare/cloudflared:latest tunnel --protocol http2 --url "http://localhost:$PORT"
fi
