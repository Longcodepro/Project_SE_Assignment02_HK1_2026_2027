// Bảng giá size và topping, phải khớp apps/api/src/orders/pricing.ts.
// Server luôn tính lại tiền; giá ở đây chỉ để hiển thị cho khách.
// pricing.test.ts so khớp trực tiếp với file của server.
export const SIZE_OPTIONS = [
    { id: 'S', name: 'Size S (Nhỏ)', extraPrice: 0 },
    { id: 'M', name: 'Size M (Vừa)', extraPrice: 5000 },
    { id: 'L', name: 'Size L (Lớn)', extraPrice: 10000 },
] as const;

export const TOPPING_OPTIONS = [
    { id: 'tran-chau', name: 'Trân châu đen', price: 8000 },
    { id: 'kem-cheese', name: 'Kem cheese béo ngậy', price: 10000 },
    { id: 'thach-cafe', name: 'Thạch cà phê giòn', price: 6000 },
];

export type SizeId = (typeof SIZE_OPTIONS)[number]['id'];

// Giá 1 ly = giá gốc (size S) + phụ thu size + tổng giá topping
export function calcUnitPrice(basePrice: number, size: SizeId, toppingIds: string[]) {
    const sizeExtra = SIZE_OPTIONS.find((s) => s.id === size)?.extraPrice ?? 0;
    const toppingsExtra = toppingIds.reduce(
        (total, id) => total + (TOPPING_OPTIONS.find((t) => t.id === id)?.price ?? 0),
        0,
    );
    return basePrice + sizeExtra + toppingsExtra;
}
