import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const products = [
  {
    id: 1,
    name: 'Cà phê sữa',
    price: 29000,
    imageUrl: 'https://example.com/ca-phe-sua.jpg',
  },
  {
    id: 2,
    name: 'Cà phê đen',
    price: 25000,
    imageUrl: 'https://example.com/ca-phe-den.jpg',
  },
  {
    id: 3,
    name: 'Bạc xỉu',
    price: 32000,
    imageUrl: 'https://example.com/bac-xiu.jpg',
  },
  {
    id: 4,
    name: 'Trà đào cam sả',
    price: 39000,
    imageUrl: 'https://example.com/tra-dao-cam-sa.jpg',
  },
  {
    id: 5,
    name: 'Trà sữa trân châu',
    price: 35000,
    imageUrl: 'https://example.com/tra-sua-tran-chau.jpg',
  },
  {
    id: 6,
    name: 'Matcha latte',
    price: 45000,
    imageUrl: 'https://example.com/matcha-latte.jpg',
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
