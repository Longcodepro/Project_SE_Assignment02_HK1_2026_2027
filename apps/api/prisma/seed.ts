import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';

const categories = [
  { id: 1, name: 'Cà phê' },
  { id: 2, name: 'Trà trái cây' },
  { id: 3, name: 'Đá xay' },
];

const products = [
  {
    id: 1,
    name: 'Cà phê sữa',
    price: 29000,
    imageUrl: '/images/ca-phe-sua.svg',
    categoryId: 1,
    isAvailable: true,
  },
  {
    id: 2,
    name: 'Cà phê đen',
    price: 25000,
    imageUrl: '/images/ca-phe-den.svg',
    categoryId: 1,
    isAvailable: true,
  },
  {
    id: 3,
    name: 'Bạc xỉu',
    price: 32000,
    imageUrl: '/images/bac-xiu.svg',
    categoryId: 1,
    isAvailable: true,
  },
  {
    id: 4,
    name: 'Trà đào cam sả',
    price: 39000,
    imageUrl: '/images/tra-dao-cam-sa.svg',
    categoryId: 2,
    isAvailable: true,
  },
  {
    id: 5,
    name: 'Trà sữa trân châu',
    price: 35000,
    imageUrl: '/images/tra-sua-tran-chau.svg',
    categoryId: 2,
    isAvailable: true,
  },
  {
    id: 6,
    name: 'Matcha latte',
    price: 45000,
    imageUrl: '/images/matcha-latte.svg',
    categoryId: 3,
    isAvailable: true,
  },
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Seed Categories trước
for (const c of categories) {
  await prisma.category.upsert({ where: { id: c.id }, update: c, create: c });
}

// upsert theo id nên chạy lại nhiều lần không bị trùng
for (const p of products) {
  await prisma.product.upsert({ where: { id: p.id }, update: p, create: p });
}
// Bảng giá topping và phụ thu size (Sprint 4), đúng giá đang dùng trong pricing.ts.
// update rỗng: chạy seed lại không ghi đè giá Manager đã chỉnh.
const toppings = [
  { code: 'tran-chau', name: 'Trân châu đen', price: 8000 },
  { code: 'kem-cheese', name: 'Kem cheese', price: 10000 },
  { code: 'thach-cafe', name: 'Thạch cà phê', price: 6000 },
];
for (const t of toppings) {
  await prisma.topping.upsert({
    where: { code: t.code },
    update: {},
    create: t,
  });
}
for (const s of [
  { size: 'S', extra: 0 },
  { size: 'M', extra: 5000 },
  { size: 'L', extra: 10000 },
] as const) {
  await prisma.sizeSurcharge.upsert({
    where: { size: s.size },
    update: {},
    create: s,
  });
}

// Mã giảm giá (Sprint 3). update rỗng: chạy seed lại không ghi đè mã Manager đã sửa hay đặt lại usedCount.
const promotions = [
  {
    code: 'WELCOME10',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderAmount: 50000,
    maxUses: 1000,
  },
  {
    code: 'GIAM15K',
    discountType: 'FIXED',
    discountValue: 15000,
    minOrderAmount: 80000,
    maxUses: null,
  },
  {
    code: 'BREW20',
    discountType: 'PERCENT',
    discountValue: 20,
    minOrderAmount: 100000,
    maxUses: 50,
  },
] as const;
for (const p of promotions) {
  await prisma.promotion.upsert({
    where: { code: p.code },
    update: {},
    create: p,
  });
}

// Tài khoản nhân viên (Sprint 3). Mật khẩu lấy từ SEED_STAFF_PASSWORD.
// Production mà thiếu biến này thì bỏ qua, để không để lại tài khoản nhân viên có mật khẩu đoán được.
const staffPassword =
  process.env.SEED_STAFF_PASSWORD ??
  (process.env.NODE_ENV === 'production' ? undefined : 'matkhau123');

if (staffPassword) {
  const passwordHash = await bcrypt.hash(staffPassword, 10);
  const staff = [
    { phone: '0900000001', name: 'Barista', role: 'BARISTA' },
    { phone: '0900000002', name: 'Cashier', role: 'CASHIER' },
    { phone: '0900000003', name: 'Manager', role: 'MANAGER' },
  ] as const;
  // upsert theo phone nên chạy lại seed không tạo trùng
  for (const s of staff) {
    await prisma.user.upsert({
      where: { phone: s.phone },
      update: { ...s, passwordHash },
      create: { ...s, passwordHash },
    });
  }
} else {
  console.log(
    'Bỏ qua tài khoản nhân viên: production chưa đặt SEED_STAFF_PASSWORD',
  );
}

await prisma.$disconnect();
