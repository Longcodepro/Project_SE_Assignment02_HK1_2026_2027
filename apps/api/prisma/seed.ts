import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const products = [
  {
    id: 1,
    name: 'Cà phê sữa',
    price: 29000,
    imageUrl: '/images/ca-phe-sua.svg',
  },
  {
    id: 2,
    name: 'Cà phê đen',
    price: 25000,
    imageUrl: '/images/ca-phe-den.svg',
  },
  {
    id: 3,
    name: 'Bạc xỉu',
    price: 32000,
    imageUrl: '/images/bac-xiu.svg',
  },
  {
    id: 4,
    name: 'Trà đào cam sả',
    price: 39000,
    imageUrl: '/images/tra-dao-cam-sa.svg',
  },
  {
    id: 5,
    name: 'Trà sữa trân châu',
    price: 35000,
    imageUrl: '/images/tra-sua-tran-chau.svg',
  },
  {
    id: 6,
    name: 'Matcha latte',
    price: 45000,
    imageUrl: '/images/matcha-latte.svg',
  },
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// upsert theo id nên chạy lại nhiều lần không bị trùng
for (const p of products) {
  await prisma.product.upsert({ where: { id: p.id }, update: p, create: p });
}
await prisma.$disconnect();
