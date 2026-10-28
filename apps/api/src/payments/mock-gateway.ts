import { Injectable } from '@nestjs/common';

export type ChargeInput = {
  method: 'WALLET' | 'CARD';
  amount: number;
  cardNumber?: string;
};

// Cổng thanh toán mô phỏng, kết quả cố định để test và demo được:
//  - CARD: số thẻ kết thúc bằng 0000 bị từ chối
//  - WALLET: đơn trên 500.000đ báo không đủ số dư
export const WALLET_LIMIT = 500_000;

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
