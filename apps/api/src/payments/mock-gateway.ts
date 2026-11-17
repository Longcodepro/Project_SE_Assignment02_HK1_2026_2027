/**
 * Cổng thanh toán mô phỏng (Mock Payment Gateway).
 *
 * Quy tắc mô phỏng:
 * - CARD (Thẻ ngân hàng): Thẻ có 4 số cuối là '0000' sẽ bị từ chối (dùng để test luồng lỗi).
 * - WALLET (Ví điện tử): Đơn trên 500.000đ sẽ báo số dư ví không đủ.
 * - Các trường hợp còn lại: Thanh toán thành công 100%.
 */

import { Injectable } from '@nestjs/common';

export type ChargeInput = {
  method: 'WALLET' | 'CARD';
  amount: number;
  cardNumber?: string;
};

export const WALLET_LIMIT = 500_000; // Giới hạn số dư tối đa của ví mô phỏng

@Injectable()
export class MockPaymentGateway {
  charge({ method, amount, cardNumber }: ChargeInput) {
    if (method === 'CARD' && cardNumber?.endsWith('0000')) {
      return { ok: false, reason: 'Thẻ bị từ chối' };
    }
    if (method === 'WALLET' && amount > WALLET_LIMIT) {
      return { ok: false, reason: 'Số dư ví không đủ' };
    }
    return { ok: true as const, reason: undefined };
  }
}
