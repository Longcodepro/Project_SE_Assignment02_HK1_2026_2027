#!/usr/bin/env bash
# Mở Prisma Studio xem dữ liệu trên Neon Cloud
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../apps/api"

if [ -z "${DATABASE_URL:-}" ] && [ -f "$SCRIPT_DIR/../.env" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$SCRIPT_DIR/../.env" | head -1 | cut -d= -f2- | tr -d '"')"
fi
: "${DATABASE_URL:?Chưa có DATABASE_URL: đặt chuỗi kết nối Neon trong môi trường hoặc trong file .env ở thư mục gốc (không commit)}"
export DATABASE_URL

echo "🚀 Đang khởi động Prisma Studio kết nối tới Neon Cloud..."
echo "🌐 Sau khi hiện link, mở trình duyệt vào: http://localhost:5555"
npx prisma studio
