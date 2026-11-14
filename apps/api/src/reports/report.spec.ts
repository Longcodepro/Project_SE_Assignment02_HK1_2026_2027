import { BadRequestException } from '@nestjs/common';
import { buildReport, resolveRange, type ReportOrder } from './report.js';

const item = (productId: number, quantity: number, name = `Món ${productId}`) => ({
  productId,
  quantity,
  product: { name },
});
const don = (status: string, total: number, createdAt: string, items = [item(1, 1)]): ReportOrder => ({
  status,
  total,
  createdAt: new Date(createdAt),
  items,
});
const bao = (orders: ReportOrder[], groupBy: 'day' | 'week' | 'month' = 'day', from = '2026-11-12', to = '2026-11-14') =>
  buildReport({ from, to, groupBy, orders });

describe('chỉ số', () => {
  const orders = [
    don('PAID', 40000, '2026-11-13T03:00:00Z'),
    don('PREPARING', 30000, '2026-11-13T03:00:00Z'),
    don('READY', 20000, '2026-11-13T03:00:00Z'),
    don('COMPLETED', 10000, '2026-11-13T03:00:00Z'),
    don('CANCELLED', 99000, '2026-11-13T03:00:00Z'),
    don('PENDING', 88000, '2026-11-13T03:00:00Z'),
    don('PAYMENT_FAILED', 77000, '2026-11-13T03:00:00Z'),
  ];

  it('doanh thu chỉ cộng PAID, PREPARING, READY, COMPLETED', () => {
    expect(bao(orders).totals.revenue).toBe(100000);
  });

  it('đơn hoàn tất chỉ đếm COMPLETED', () => {
    expect(bao(orders).totals.completedOrders).toBe(1);
  });

  it('tổng đơn gồm mọi trạng thái; tỷ lệ hủy = CANCELLED / tổng đơn', () => {
    const { totals } = bao(orders);
    expect(totals.totalOrders).toBe(7);
    expect(totals.cancelledOrders).toBe(1);
    expect(totals.cancelRate).toBe(0.1429);
  });

  it('tỷ lệ hủy làm tròn 4 chữ số; không có đơn thì là 0, không chia cho 0', () => {
    expect(bao([don('CANCELLED', 1, '2026-11-13T03:00:00Z'), don('PAID', 1, '2026-11-13T03:00:00Z'), don('PAID', 1, '2026-11-13T03:00:00Z')]).totals.cancelRate).toBe(0.3333);
    const rong = bao([]);
    expect(rong.totals).toEqual({ revenue: 0, completedOrders: 0, totalOrders: 0, cancelledOrders: 0, cancelRate: 0 });
  });

  it('đơn đã hủy không cộng doanh thu dù đã từng PAID (total vẫn còn trên đơn)', () => {
    expect(bao([don('CANCELLED', 50000, '2026-11-13T03:00:00Z')]).totals.revenue).toBe(0);
  });

  it('totals bằng tổng của series', () => {
    const r = bao(
      [don('PAID', 10000, '2026-11-12T03:00:00Z'), don('COMPLETED', 20000, '2026-11-13T03:00:00Z'), don('CANCELLED', 5, '2026-11-14T03:00:00Z')],
    );
    const sum = (k: 'revenue' | 'completedOrders' | 'totalOrders' | 'cancelledOrders') =>
      r.series.reduce((s, b) => s + b[k], 0);
    expect(r.totals.revenue).toBe(sum('revenue'));
    expect(r.totals.completedOrders).toBe(sum('completedOrders'));
    expect(r.totals.totalOrders).toBe(sum('totalOrders'));
    expect(r.totals.cancelledOrders).toBe(sum('cancelledOrders'));
  });

  it('đơn nằm ngoài khoảng bị bỏ qua', () => {
    const r = bao([don('PAID', 10000, '2026-11-20T03:00:00Z'), don('PAID', 10000, '2026-11-01T03:00:00Z')]);
    expect(r.totals.totalOrders).toBe(0);
  });
});

describe('gom theo kỳ', () => {
  it('ngày: mỗi ngày trong khoảng đều có mặt, kể cả ngày không có đơn', () => {
    const r = bao([don('PAID', 10000, '2026-11-13T03:00:00Z')]);
    expect(r.series.map((s) => s.period)).toEqual(['2026-11-12', '2026-11-13', '2026-11-14']);
    expect(r.series.map((s) => s.revenue)).toEqual([0, 10000, 0]);
  });

  it('múi giờ Việt Nam: 16:59:59 UTC vẫn là hôm nay, 17:00:00 UTC đã sang ngày hôm sau', () => {
    const r = bao([don('PAID', 1, '2026-11-12T16:59:59Z'), don('PAID', 2, '2026-11-12T17:00:00Z')]);
    expect(r.series.map((s) => s.revenue)).toEqual([1, 2, 0]);
  });

  it('tuần bắt đầu thứ Hai; kỳ đầu có thể rộng hơn khoảng được chọn', () => {
    // 1/11/2026 là Chủ nhật nên thuộc tuần bắt đầu 26/10
    const r = bao(
      [
        don('PAID', 1, '2026-11-01T03:00:00Z'),
        don('PAID', 10, '2026-11-02T03:00:00Z'),
        don('PAID', 100, '2026-11-08T03:00:00Z'),
        don('PAID', 1000, '2026-11-09T03:00:00Z'),
      ],
      'week',
      '2026-11-01',
      '2026-11-14',
    );
    expect(r.series.map((s) => [s.period, s.revenue])).toEqual([
      ['2026-10-26', 1],
      ['2026-11-02', 110],
      ['2026-11-09', 1000],
    ]);
  });

  it('tháng: gom theo YYYY-MM, đơn cuối tháng theo giờ Việt Nam thuộc tháng sau', () => {
    const r = bao(
      [don('PAID', 1, '2026-10-30T03:00:00Z'), don('PAID', 10, '2026-10-31T17:30:00Z')],
      'month',
      '2026-10-30',
      '2026-11-02',
    );
    expect(r.series.map((s) => [s.period, s.revenue])).toEqual([
      ['2026-10', 1],
      ['2026-11', 10],
    ]);
  });
});

describe('Top 5 món bán chạy', () => {
  it('cộng số ly qua nhiều đơn, giảm dần; bằng nhau thì productId nhỏ trước; tối đa 5', () => {
    const r = bao([
      don('PAID', 1, '2026-11-13T03:00:00Z', [item(1, 2), item(2, 5), item(3, 5)]),
      don('COMPLETED', 1, '2026-11-13T04:00:00Z', [item(1, 4), item(4, 1), item(5, 1), item(6, 1), item(7, 1)]),
    ]);
    expect(r.topProducts.map((p) => [p.productId, p.quantity])).toEqual([
      [1, 6],
      [2, 5],
      [3, 5],
      [4, 1],
      [5, 1],
    ]);
    expect(r.topProducts[0]).toEqual({ productId: 1, productName: 'Món 1', quantity: 6 });
  });

  it('chỉ tính đơn được tính doanh thu: bỏ CANCELLED, PENDING, PAYMENT_FAILED', () => {
    const r = bao([
      don('CANCELLED', 1, '2026-11-13T03:00:00Z', [item(1, 99)]),
      don('PENDING', 1, '2026-11-13T03:00:00Z', [item(1, 99)]),
      don('PAYMENT_FAILED', 1, '2026-11-13T03:00:00Z', [item(1, 99)]),
      don('READY', 1, '2026-11-13T03:00:00Z', [item(2, 3)]),
    ]);
    expect(r.topProducts).toEqual([{ productId: 2, productName: 'Món 2', quantity: 3 }]);
  });

  it('không có đơn nào thì là mảng rỗng', () => {
    expect(bao([]).topProducts).toEqual([]);
  });
});

describe('resolveRange', () => {
  it('mặc định: to là hôm nay theo giờ Việt Nam, from là to trừ 6 ngày', () => {
    // 18:00 UTC ngày 14 là 01:00 ngày 15 ở Việt Nam
    const r = resolveRange({}, new Date('2026-11-14T18:00:00Z'));
    expect(r.to).toBe('2026-11-15');
    expect(r.from).toBe('2026-11-09');
  });

  it('chỉ có to thì from là to trừ 6 ngày', () => {
    expect(resolveRange({ to: '2026-03-03' }).from).toBe('2026-02-25');
  });

  it('biên thời gian: từ 00:00 ngày from đến hết ngày to (giờ Việt Nam)', () => {
    const r = resolveRange({ from: '2026-11-12', to: '2026-11-14' });
    expect(r.start.toISOString()).toBe('2026-11-11T17:00:00.000Z');
    expect(r.endExclusive.toISOString()).toBe('2026-11-14T17:00:00.000Z');
  });

  it('tối đa 366 ngày: đúng 366 được, 367 thì 400', () => {
    expect(() => resolveRange({ from: '2026-01-01', to: '2027-01-01' })).not.toThrow();
    expect(() => resolveRange({ from: '2025-12-31', to: '2027-01-01' })).toThrow(BadRequestException);
  });

  it.each([
    ['ngày không có thật', { from: '2026-02-30', to: '2026-03-05' }],
    ['tháng 13', { from: '2026-13-01', to: '2026-13-05' }],
    ['from sau to', { from: '2026-11-14', to: '2026-11-12' }],
  ])('400 khi %s', (_ten, q) => {
    expect(() => resolveRange(q)).toThrow(BadRequestException);
  });

  it('một ngày (from = to) là hợp lệ', () => {
    const r = resolveRange({ from: '2026-11-14', to: '2026-11-14' });
    expect(r.endExclusive.getTime() - r.start.getTime()).toBe(86_400_000);
  });
});
