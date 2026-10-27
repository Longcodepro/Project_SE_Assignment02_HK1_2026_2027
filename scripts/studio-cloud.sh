#!/usr/bin/env bash
# Mở Prisma Studio xem dữ liệu trên Neon Cloud
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../apps/api"

export DATABASE_URL="postgresql://neondb_owner:npg_EuIOJaD5g6sx@ep-crimson-scene-b3h22agi-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "🚀 Đang khởi động Prisma Studio kết nối tới Neon Cloud..."
echo "🌐 Sau khi hiện link, mở trình duyệt vào: http://localhost:5555"
npx prisma studio
