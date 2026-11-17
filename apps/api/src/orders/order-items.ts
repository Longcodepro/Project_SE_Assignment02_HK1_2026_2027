/**
 * Tiện ích truy vấn và định dạng danh sách món cho màn hình nhân viên (KDS, Thu ngân).
 */

// SELECT tối ưu: lấy tên món từ quan hệ product
export const STAFF_ITEMS_SELECT = {
  orderBy: { id: 'asc' },
  select: {
    quantity: true,
    size: true,
    toppings: true,
    product: { select: { name: true } },
  },
} as const;

// Làm phẳng (flatten) dữ liệu: chuyển { product: { name: 'X' } } thành { productName: 'X' }
export const withProductName = <T extends { product: { name: string } }>({
  product,
  ...item
}: T) => ({ ...item, productName: product.name });
