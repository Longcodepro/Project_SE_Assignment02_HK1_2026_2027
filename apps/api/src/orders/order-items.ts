// Cách lấy và làm phẳng danh sách món cho màn hình nhân viên (KDS, quầy)
export const STAFF_ITEMS_SELECT = {
  orderBy: { id: 'asc' },
  select: {
    quantity: true,
    size: true,
    toppings: true,
    product: { select: { name: true } },
  },
} as const;

export const withProductName = <T extends { product: { name: string } }>({
  product,
  ...item
}: T) => ({ ...item, productName: product.name });
