#!/bin/bash
# Script tiện ích theo dõi log Backend theo thời gian thực
echo "=================================================="
echo "    BrewLite - Theo dõi log HTTP Backend         "
echo "=================================================="
echo "Đang stream log trực tiếp từ container Backend (Nhấn Ctrl+C để dừng)..."
echo ""

docker compose logs -f backend
