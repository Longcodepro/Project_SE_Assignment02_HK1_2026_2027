// Mã giảm giá: 3-32 ký tự chữ, số, _ hoặc -, server so không phân biệt hoa thường
const PROMO_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

export const normalizePromoCode = (raw: string) => raw.trim().toUpperCase();

export const isValidPromoCode = (code: string) => PROMO_PATTERN.test(code);

type CartLine = { productId: string | number; size: string; quantity: number; toppings: string[] };

// Dấu vân tay của giỏ hàng: thay đổi món, size, topping hoặc số lượng thì khác nhau.
// Dùng để biết đơn nháp (đã áp mã) còn khớp giỏ hàng hiện tại hay không.
export function cartKeyOf(items: CartLine[]): string {
    return items
        .map((i) => `${i.productId}:${i.size}:${[...i.toppings].sort().join('+')}:${i.quantity}`)
        .sort()
        .join('|');
}
