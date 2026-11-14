import { BadRequestException } from '@nestjs/common';

export const GROUP_BY = ['day', 'week', 'month'] as const;
export type GroupBy = (typeof GROUP_BY)[number];

export type ReportOrder = {
  createdAt: Date;
  status: string;
  total: number;
  items: { productId: number; quantity: number; product: { name: string } }[];
};

// Doanh thu thực thu: đơn đã trả tiền và không bị hủy (context-and-scope.md §6.6, mục 7)
export const REVENUE_STATUSES: readonly string[] = [
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
];

const DAY_MS = 86_400_000;
// Việt Nam không có giờ mùa hè nên cố định UTC+7
const VN_OFFSET_MS = 7 * 3_600_000;
const MAX_DAYS = 366;
const TOP_PRODUCTS = 5;

const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / DAY_MS;
const dayString = (n: number) =>
  new Date(n * DAY_MS).toISOString().slice(0, 10);
const vnDay = (d: Date) =>
  new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);

// Chuỗi đúng định dạng và là ngày có thật (loại 2026-02-30)
const isRealDay = (day: string) => {
  const n = dayNumber(day);
  return Number.isFinite(n) && dayString(n) === day;
};

// Ngày 1/1/1970 là thứ Năm; (n + 3) % 7 là số ngày kể từ thứ Hai
const mondayOf = (n: number) => n - ((n + 3) % 7);

function periodKey(day: string, groupBy: GroupBy) {
  if (groupBy === 'day') return day;
  if (groupBy === 'month') return day.slice(0, 7);
  return dayString(mondayOf(dayNumber(day)));
}

export function resolveRange(
  q: { from?: string; to?: string },
  now = new Date(),
) {
  const to = q.to ?? vnDay(now);
  const from = q.from ?? (isRealDay(to) ? dayString(dayNumber(to) - 6) : to);
  if (!isRealDay(from) || !isRealDay(to)) {
    throw new BadRequestException(
      'from và to phải là ngày hợp lệ dạng YYYY-MM-DD',
    );
  }
  if (dayNumber(from) > dayNumber(to)) {
    throw new BadRequestException('from không được sau to');
  }
  if (dayNumber(to) - dayNumber(from) + 1 > MAX_DAYS) {
    throw new BadRequestException(`Khoảng báo cáo tối đa ${MAX_DAYS} ngày`);
  }
  return {
    from,
    to,
    start: new Date(`${from}T00:00:00+07:00`),
    endExclusive: new Date(Date.parse(`${to}T00:00:00+07:00`) + DAY_MS),
  };
}

const round4 = (x: number) => Math.round(x * 10_000) / 10_000;
const rate = (cancelled: number, total: number) =>
  total === 0 ? 0 : round4(cancelled / total);

type Bucket = {
  revenue: number;
  completedOrders: number;
  totalOrders: number;
  cancelledOrders: number;
};
const emptyBucket = (): Bucket => ({
  revenue: 0,
  completedOrders: 0,
  totalOrders: 0,
  cancelledOrders: 0,
});
const withRate = (b: Bucket) => ({
  ...b,
  cancelRate: rate(b.cancelledOrders, b.totalOrders),
});

export function buildReport(input: {
  from: string;
  to: string;
  groupBy: GroupBy;
  orders: ReportOrder[];
}) {
  const { from, to, groupBy, orders } = input;

  // Mỗi kỳ trong khoảng đều có mặt, kể cả kỳ không có đơn
  const buckets = new Map<string, Bucket>();
  for (let n = dayNumber(from); n <= dayNumber(to); n++) {
    const key = periodKey(dayString(n), groupBy);
    if (!buckets.has(key)) buckets.set(key, emptyBucket());
  }

  const sold = new Map<number, { productName: string; quantity: number }>();
  const totals = emptyBucket();
  for (const order of orders) {
    const bucket = buckets.get(periodKey(vnDay(order.createdAt), groupBy));
    if (!bucket) continue;
    for (const b of [bucket, totals]) {
      b.totalOrders++;
      if (order.status === 'CANCELLED') b.cancelledOrders++;
      if (order.status === 'COMPLETED') b.completedOrders++;
      if (REVENUE_STATUSES.includes(order.status)) b.revenue += order.total;
    }
    if (!REVENUE_STATUSES.includes(order.status)) continue;
    for (const item of order.items) {
      const entry = sold.get(item.productId) ?? {
        productName: item.product.name,
        quantity: 0,
      };
      entry.quantity += item.quantity;
      sold.set(item.productId, entry);
    }
  }

  const topProducts = [...sold.entries()]
    .map(([productId, s]) => ({ productId, ...s }))
    .sort((a, b) => b.quantity - a.quantity || a.productId - b.productId)
    .slice(0, TOP_PRODUCTS);

  return {
    from,
    to,
    groupBy,
    totals: withRate(totals),
    series: [...buckets.entries()].map(([period, b]) => ({
      period,
      ...withRate(b),
    })),
    topProducts,
  };
}
