import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Đơn nháp tạo khi khách áp mã giảm giá ở Checkout: server trả số tiền giảm và tổng mới,
// thanh toán sẽ trả tiền chính đơn này. Lưu lại để tải lại trang không làm mất đơn.
export interface CheckoutDraft {
    orderId: string;
    // Dấu vân tay giỏ hàng lúc áp mã (lib/promo.ts: cartKeyOf)
    cartKey: string;
    promoCode: string;
    total: number;
    discountAmount: number;
}

interface CheckoutDraftState {
    draft: CheckoutDraft | null;
    setDraft: (draft: CheckoutDraft) => void;
    clearDraft: () => void;
}

export const useCheckoutDraftStore = create<CheckoutDraftState>()(
    persist(
        (set) => ({
            draft: null,
            setDraft: (draft) => set({ draft }),
            clearDraft: () => set({ draft: null }),
        }),
        { name: 'brewlite-checkout-draft' },
    ),
);
