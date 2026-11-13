# Kết quả đo Lighthouse (NFR-04, NFR-05)

> Đối chiếu: `NFR-04` (khả dụng), `NFR-05` (hiệu năng giao diện) trong `docs/requirements/context-and-scope.md` và `docs/traceability-matrix.md`.

## Điều kiện đo

| Mục | Giá trị |
|---|---|
| Ngày đo | 13/11/2026 |
| Môi trường | Production: `https://se-as2-brewlite.vercel.app` (frontend trên Vercel) |
| Công cụ | Lighthouse 12.8.2 (CLI), Chrome headless, chế độ **di động** |
| Giả lập mặc định của Lighthouse | Điện thoại Moto G Power, mạng chậm (RTT 150 ms, tải xuống khoảng 1,6 Mbps), CPU chậm đi 4 lần. Khắt khe hơn mạng 4G thông thường |
| Cách đo | 3 lượt cho mỗi trang, báo cáo **giá trị giữa** (median) |
| Lệnh | `npx lighthouse@12 <URL> --only-categories=performance,accessibility,best-practices --form-factor=mobile` |

## Điểm (giá trị giữa của 3 lượt)

| Trang | Performance | Accessibility | Best Practices |
|---|:---:|:---:|:---:|
| `/` (menu) | 97 | 92 | 100 |
| `/cart` | 97 | 95 | 100 |
| `/checkout` | 97 | 95 | 100 |

Từng lượt (Performance / Accessibility / Best Practices):

| Trang | Lượt 1 | Lượt 2 | Lượt 3 |
|---|---|---|---|
| `/` | 93 / 90 / 100 | 98 / 92 / 100 | 97 / 92 / 100 |
| `/cart` | 90 / 95 / 100 | 97 / 95 / 100 | 99 / 95 / 100 |
| `/checkout` | 98 / 95 / 100 | 97 / 95 / 100 | 93 / 95 / 100 |

## Chỉ số hiệu năng so với NFR-05

NFR-05 đặt mục tiêu FCP không quá 1,5 giây và TBT không quá 200 ms.

| Trang | FCP (3 lượt) | TBT (3 lượt) | CLS |
|---|---|---|:---:|
| `/` | 2,1 s; 1,2 s; 1,2 s | 50 ms; 50 ms; 80 ms | 0 |
| `/cart` | 1,8 s; 1,2 s; 1,0 s | 70 ms; 40 ms; 40 ms | 0 |
| `/checkout` | 1,1 s; 1,2 s; 1,8 s | 30 ms; 70 ms; 60 ms | 0 |

- **TBT:** cả 9 lượt đều dưới 200 ms (lớn nhất 80 ms): đạt.
- **FCP:** giá trị giữa của cả ba trang là 1,2 s: đạt. Tuy nhiên **3 trong 9 lượt vượt 1,5 s** (2,1 s, 1,8 s, 1,8 s), nên không thể nói mọi lần tải đều đạt. Điều kiện giả lập ở đây chậm hơn mạng 4G thật.
- **CLS = 0:** trang không bị nhảy bố cục.

## Mục Accessibility chưa đạt 100

- `/`: độ tương phản màu chưa đủ ở một số chữ (`color-contrast`) và có liên kết không có tên mô tả (`link-name`).
- `/cart`: có liên kết không có tên mô tả (`link-name`).

Điểm từ 90 trở lên nên chưa tạo issue riêng; hai lỗi trên là việc cải thiện nhỏ cho frontend.

## Giới hạn của phép đo

- `/cart` và `/checkout` được đo khi **giỏ hàng trống** (trạng thái khi vừa vào trang), nên chưa phản ánh trang có nhiều món.
- Lighthouse chỉ đo tải trang. Hai mục còn lại của NFR-05 là *đổi size/topping cập nhật giá trong 50 ms* và *luồng từ menu đến thanh toán trong 60 giây* **chưa được đo** ở đây (phần luồng đặt hàng được bao phủ bởi E2E Playwright nhưng không đo thời gian).
- Chưa đo trên điện thoại thật.
