import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu (Seed Data) cho BrewLite AS2...');

  // 1. DANH MỤC SẢN PHẨM (Categories)
  const categories = [
    { id: 1, name: 'Cà phê Việt Nam', isActive: true },
    { id: 2, name: 'Trà trái cây & Trà sữa', isActive: true },
    { id: 3, name: 'Đá xay & Matcha', isActive: true },
    { id: 4, name: 'Bánh ngọt & Ăn kèm', isActive: true },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }
  console.log(`✅ Đã nạp ${categories.length} danh mục sản phẩm.`);

  // 2. MÓN NƯỚC & ĐỒ ĂN (Products)
  const products = [
    {
      id: 1,
      name: 'Cà phê sữa',
      description: 'Hạt Robusta Đắk Lắk pha phin truyền thống hòa quyện cùng sữa đặc béo ngọt đậm đà.',
      price: 29000,
      imageUrl: '/images/ca-phe-sua.svg',
      categoryId: 1,
      isAvailable: true,
    },
    {
      id: 2,
      name: 'Cà phê đen',
      description: 'Vị đắng đượm mộc mạc nguyên bản từ hạt cà phê rang xay nguyên chất Tây Nguyên.',
      price: 25000,
      imageUrl: '/images/ca-phe-den.svg',
      categoryId: 1,
      isAvailable: true,
    },
    {
      id: 3,
      name: 'Bạc xỉu 3 tầng',
      description: 'Sự phân tầng tinh tế giữa sữa đặc ngọt lịm, sữa tươi thanh trùng và bọt cà phê thơm lừng.',
      price: 32000,
      imageUrl: '/images/bac-xiu.svg',
      categoryId: 1,
      isAvailable: true,
    },
    {
      id: 4,
      name: 'Cà phê muối xứ Huế',
      description: 'Vị đậm đà của cà phê phin kết hợp lớp kem sữa muối mằn mặn béo ngậy đặc trưng.',
      price: 35000,
      imageUrl: '/images/ca-phe-muoi.svg',
      categoryId: 1,
      isAvailable: true,
    },
    {
      id: 5,
      name: 'Trà đào cam sả',
      description: 'Trà đen ủ lạnh thanh mát hương sả tươi, cam vàng mọng nước cùng miếng đào giòn ngọt.',
      price: 39000,
      imageUrl: '/images/tra-dao-cam-sa.svg',
      categoryId: 2,
      isAvailable: true,
    },
    {
      id: 6,
      name: 'Trà sữa trân châu Ô Long',
      description: 'Trà Ô Long nướng thơm khói dịu nhẹ, sữa tươi béo thanh cùng trân châu đen dẻo bùi.',
      price: 38000,
      imageUrl: '/images/tra-sua-tran-chau.svg',
      categoryId: 2,
      isAvailable: true,
    },
    {
      id: 7,
      name: 'Matcha đá xay kem cheese',
      description: 'Bột Matcha Uji chuẩn Nhật xay mịn với đá tuyết, phủ trên cùng lớp kem phô mai béo mặn.',
      price: 45000,
      imageUrl: '/images/matcha-latte.svg',
      categoryId: 3,
      isAvailable: true,
    },
    {
      id: 8,
      name: 'Croissant bơ tỏi nướng',
      description: 'Bánh sừng bò ngàn lớp nướng nóng giòn rụm với bơ Pháp thơm ngậy và sốt tỏi ngò tây.',
      price: 32000,
      imageUrl: '/images/croissant.svg',
      categoryId: 4,
      isAvailable: true,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }
  console.log(`✅ Đã nạp ${products.length} sản phẩm đồ uống và bánh tươi.`);

  // 3. TOPPING & PHỤ THU SIZE (Toppings & SizeSurcharges)
  const toppings = [
    { code: 'tran-chau', name: 'Trân châu đen dẻo', price: 8000, isActive: true },
    { code: 'kem-cheese', name: 'Kem cheese phô mai mặn', price: 10000, isActive: true },
    { code: 'thach-cafe', name: 'Thạch cà phê giòn', price: 6000, isActive: true },
  ];
  for (const t of toppings) {
    await prisma.topping.upsert({
      where: { code: t.code },
      update: t,
      create: t,
    });
  }

  const sizes = [
    { size: 'S', extra: 0 },
    { size: 'M', extra: 5000 },
    { size: 'L', extra: 10000 },
  ] as const;
  for (const s of sizes) {
    await prisma.sizeSurcharge.upsert({
      where: { size: s.size },
      update: s,
      create: s,
    });
  }
  console.log('✅ Đã nạp bảng giá Topping và phụ thu Size (S, M, L).');

  // 4. KHO NGUYÊN LIỆU (Ingredients)
  const ingredients = [
    { id: 1, name: 'Hạt cà phê Robusta Đắk Lắk', unit: 'G', stock: 15000, minStock: 3000 },
    { id: 2, name: 'Hạt cà phê Arabica Cầu Đất', unit: 'G', stock: 8000, minStock: 2000 },
    { id: 3, name: 'Sữa tươi thanh trùng Dalat Milk', unit: 'ML', stock: 20000, minStock: 5000 },
    { id: 4, name: 'Sữa đặc Ngôi Sao Phương Nam', unit: 'ML', stock: 12000, minStock: 3000 },
    { id: 5, name: 'Trà Ô Long nướng Lâm Đồng', unit: 'G', stock: 5000, minStock: 1000 },
    { id: 6, name: 'Đào miếng ngâm Kronos', unit: 'PIECE', stock: 120, minStock: 30 },
    { id: 7, name: 'Bột Matcha Uji Nhật Bản', unit: 'G', stock: 2000, minStock: 500 },
    { id: 8, name: 'Trân châu đen Đài Loan', unit: 'G', stock: 6000, minStock: 1500 },
    { id: 9, name: 'Kem phô mai Anchor (Cream cheese)', unit: 'G', stock: 3500, minStock: 1000 },
  ] as const;

  for (const ing of ingredients) {
    await prisma.ingredient.upsert({
      where: { id: ing.id },
      update: {
        name: ing.name,
        unit: ing.unit,
        minStock: ing.minStock,
      },
      create: ing,
    });
  }
  console.log(`✅ Đã nạp ${ingredients.length} loại nguyên liệu pha chế.`);

  // 5. CÔNG THỨC PHA CHẾ (RecipeItem & ToppingRecipeItem)
  // Định lượng cho từng món theo từng size
  const recipes = [
    // 1. Cà phê sữa đá (Robusta + Sữa đặc)
    { productId: 1, size: 'S' as const, ingredientId: 1, quantity: 20 },
    { productId: 1, size: 'S' as const, ingredientId: 4, quantity: 25 },
    { productId: 1, size: 'M' as const, ingredientId: 1, quantity: 25 },
    { productId: 1, size: 'M' as const, ingredientId: 4, quantity: 35 },
    { productId: 1, size: 'L' as const, ingredientId: 1, quantity: 30 },
    { productId: 1, size: 'L' as const, ingredientId: 4, quantity: 45 },

    // 2. Cà phê đen đá (Robusta)
    { productId: 2, size: 'S' as const, ingredientId: 1, quantity: 20 },
    { productId: 2, size: 'M' as const, ingredientId: 1, quantity: 25 },
    { productId: 2, size: 'L' as const, ingredientId: 1, quantity: 30 },

    // 3. Bạc xỉu 3 tầng (Robusta + Sữa đặc + Sữa tươi)
    { productId: 3, size: 'S' as const, ingredientId: 1, quantity: 15 },
    { productId: 3, size: 'S' as const, ingredientId: 4, quantity: 30 },
    { productId: 3, size: 'S' as const, ingredientId: 3, quantity: 60 },
    { productId: 3, size: 'M' as const, ingredientId: 1, quantity: 20 },
    { productId: 3, size: 'M' as const, ingredientId: 4, quantity: 40 },
    { productId: 3, size: 'M' as const, ingredientId: 3, quantity: 80 },
    { productId: 3, size: 'L' as const, ingredientId: 1, quantity: 25 },
    { productId: 3, size: 'L' as const, ingredientId: 4, quantity: 50 },
    { productId: 3, size: 'L' as const, ingredientId: 3, quantity: 100 },
  ];

  for (const r of recipes) {
    await prisma.recipeItem.upsert({
      where: {
        productId_size_ingredientId: {
          productId: r.productId,
          size: r.size,
          ingredientId: r.ingredientId,
        },
      },
      update: { quantity: r.quantity },
      create: r,
    });
  }

  // Công thức topping
  const toppingRecipes = [
    { toppingCode: 'tran-chau', ingredientId: 8, quantity: 40 },
    { toppingCode: 'kem-cheese', ingredientId: 9, quantity: 35 },
  ];
  for (const tr of toppingRecipes) {
    await prisma.toppingRecipeItem.upsert({
      where: {
        toppingCode_ingredientId: {
          toppingCode: tr.toppingCode,
          ingredientId: tr.ingredientId,
        },
      },
      update: { quantity: tr.quantity },
      create: tr,
    });
  }
  console.log('✅ Đã nạp công thức định lượng đồ uống và topping.');

  // 6. MÃ KHUYẾN MÃI (Promotions)
  const promotions = [
    {
      code: 'WELCOME10',
      discountType: 'PERCENT' as const,
      discountValue: 10,
      minOrderAmount: 50000,
      maxUses: 1000,
      isActive: true,
    },
    {
      code: 'GIAM15K',
      discountType: 'FIXED' as const,
      discountValue: 15000,
      minOrderAmount: 80000,
      maxUses: null,
      isActive: true,
    },
    {
      code: 'BREW20',
      discountType: 'PERCENT' as const,
      discountValue: 20,
      minOrderAmount: 100000,
      maxUses: 50,
      isActive: true,
    },
    {
      code: 'BANMOI',
      discountType: 'FIXED' as const,
      discountValue: 20000,
      minOrderAmount: 60000,
      maxUses: 500,
      isActive: true,
    },
  ];

  for (const p of promotions) {
    await prisma.promotion.upsert({
      where: { code: p.code },
      update: {
        discountType: p.discountType,
        discountValue: p.discountValue,
        minOrderAmount: p.minOrderAmount,
        maxUses: p.maxUses,
        isActive: p.isActive,
      },
      create: p,
    });
  }
  console.log(`✅ Đã nạp ${promotions.length} mã khuyến mãi.`);

  // 7. TÀI KHOẢN NGƯỜI DÙNG (Nhân viên & Khách hàng thân thiết)
  const defaultPassword =
    process.env.SEED_STAFF_PASSWORD ??
    (process.env.NODE_ENV === 'production' ? undefined : 'matkhau123');

  if (defaultPassword) {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Nhân viên vận hành
    const staff = [
      { phone: '0900000001', name: 'Trần Văn Pha (Barista)', role: 'BARISTA' as const },
      { phone: '0900000002', name: 'Lê Thị Thu (Thu ngân)', role: 'CASHIER' as const },
      { phone: '0900000003', name: 'Nguyễn Văn Quản (Quản lý)', role: 'MANAGER' as const },
    ];
    for (const s of staff) {
      await prisma.user.upsert({
        where: { phone: s.phone },
        update: { name: s.name, role: s.role, passwordHash },
        create: { ...s, passwordHash },
      });
    }

    // Khách hàng mẫu
    const customers = [
      {
        phone: '0987654321',
        name: 'Nguyễn Văn An',
        email: 'an.nguyen@example.com',
        role: 'CUSTOMER' as const,
        loyaltyPoints: 120,
      },
      {
        phone: '0912345678',
        name: 'Trần Thị Bình',
        email: 'binh.tran@example.com',
        role: 'CUSTOMER' as const,
        loyaltyPoints: 45,
      },
    ];
    for (const c of customers) {
      await prisma.user.upsert({
        where: { phone: c.phone },
        update: {
          name: c.name,
          email: c.email,
          role: c.role,
          loyaltyPoints: c.loyaltyPoints,
          passwordHash,
        },
        create: { ...c, passwordHash },
      });
    }
    console.log('✅ Đã nạp tài khoản nhân viên (Barista, Cashier, Manager) và khách hàng mẫu.');

    // 8. PHIẾU NHẬP KHO MẪU (StockReceipts do Manager tạo)
    const existingReceipts = await prisma.stockReceipt.count();
    if (existingReceipts === 0) {
      await prisma.stockReceipt.createMany({
        data: [
          {
            ingredientId: 1,
            quantity: 20000,
            note: 'Nhập lô cà phê Robusta rang mộc nông trại Đắk Lắk đầu tuần',
            createdByPhone: '0900000003',
          },
          {
            ingredientId: 3,
            quantity: 24000,
            note: 'Giao 24 hộp sữa tươi thanh trùng từ Dalat Milk TP.HCM',
            createdByPhone: '0900000003',
          },
          {
            ingredientId: 6,
            quantity: 150,
            note: 'Nhập bổ sung đào ngâm Kronos phục vụ mùa hè',
            createdByPhone: '0900000003',
          },
        ],
      });
      console.log('✅ Đã tạo các phiếu nhập kho mẫu lịch sử.');
    }

    // 9. ĐƠN HÀNG MẪU THỰC TẾ (Orders, OrderItems, Payments, Reviews)
    // Giúp KDS Barista, Quầy Cashier và Báo cáo Doanh thu Admin có dữ liệu trực quan ngay
    const welcomePromo = await prisma.promotion.findUnique({
      where: { code: 'WELCOME10' },
    });

    const sampleOrders = [
      {
        id: 'ord_demo_101',
        userPhone: '0987654321',
        status: 'COMPLETED' as const,
        total: 75600,
        discountAmount: 8400,
        promotionId: welcomePromo?.id ?? null,
        pickupCode: null,
        items: [
          { productId: 1, quantity: 1, size: 'M' as const, toppings: ['tran-chau'], unitPrice: 42000 },
          { productId: 3, quantity: 1, size: 'L' as const, toppings: [], unitPrice: 42000 },
        ],
        payment: {
          method: 'WALLET' as const,
          status: 'SUCCESS' as const,
          amount: 75600,
          pointsEarned: 75,
        },
        review: {
          stars: 5,
          comment: 'Cà phê sữa rất thơm và đậm đà, bạc xỉu béo vừa phải không bị ngọt gắt. Giao nhanh 5 sao!',
        },
      },
      {
        id: 'ord_demo_102',
        userPhone: '0987654321',
        status: 'READY' as const,
        total: 44000,
        discountAmount: 0,
        promotionId: null,
        pickupCode: '839201', // Sẵn sàng để Cashier gọi giao nhận ở quầy
        items: [
          { productId: 5, quantity: 1, size: 'M' as const, toppings: [], unitPrice: 44000 },
        ],
        payment: {
          method: 'CARD' as const,
          status: 'SUCCESS' as const,
          amount: 44000,
          pointsEarned: 44,
        },
        review: null,
      },
      {
        id: 'ord_demo_103',
        userPhone: '0912345678',
        status: 'PREPARING' as const,
        total: 55000,
        discountAmount: 0,
        promotionId: null,
        pickupCode: null,
        items: [
          { productId: 7, quantity: 1, size: 'L' as const, toppings: [], unitPrice: 55000 },
        ],
        payment: {
          method: 'WALLET' as const,
          status: 'SUCCESS' as const,
          amount: 55000,
          pointsEarned: 55,
        },
        review: null,
      },
      {
        id: 'ord_demo_104',
        userPhone: '0912345678',
        status: 'PAID' as const,
        total: 25000,
        discountAmount: 0,
        promotionId: null,
        pickupCode: null,
        items: [
          { productId: 2, quantity: 1, size: 'S' as const, toppings: [], unitPrice: 25000 },
        ],
        payment: {
          method: 'WALLET' as const,
          status: 'SUCCESS' as const,
          amount: 25000,
          pointsEarned: 25,
        },
        review: null,
      },
    ];

    for (const ord of sampleOrders) {
      const existing = await prisma.order.findUnique({ where: { id: ord.id } });
      if (!existing) {
        await prisma.order.create({
          data: {
            id: ord.id,
            userPhone: ord.userPhone,
            status: ord.status,
            total: ord.total,
            discountAmount: ord.discountAmount,
            promotionId: ord.promotionId,
            pickupCode: ord.pickupCode,
            items: {
              create: ord.items,
            },
            payments: {
              create: [ord.payment],
            },
          },
        });

        if (ord.review) {
          await prisma.review.create({
            data: {
              orderId: ord.id,
              stars: ord.review.stars,
              comment: ord.review.comment,
            },
          });
        }
      }
    }
    console.log('✅ Đã tạo các đơn hàng mẫu phong phú (COMPLETED có review, READY có pickupCode, PREPARING, PAID).');
  }

  // 10. ĐỒNG BỘ POSTGRESQL SEQUENCES (Cực kỳ quan trọng để API không bị lỗi duplicate key)
  const tablesWithAutoIncrement = [
    { table: 'Category', sequence: 'Category_id_seq' },
    { table: 'Product', sequence: 'Product_id_seq' },
    { table: 'Promotion', sequence: 'Promotion_id_seq' },
    { table: 'Ingredient', sequence: 'Ingredient_id_seq' },
    { table: 'OrderItem', sequence: 'OrderItem_id_seq' },
    { table: 'Payment', sequence: 'Payment_id_seq' },
    { table: 'StockReceipt', sequence: 'StockReceipt_id_seq' },
    { table: 'RecipeItem', sequence: 'RecipeItem_id_seq' },
    { table: 'ToppingRecipeItem', sequence: 'ToppingRecipeItem_id_seq' },
    { table: 'StockUsage', sequence: 'StockUsage_id_seq' },
    { table: 'Review', sequence: 'Review_id_seq' },
  ];

  for (const item of tablesWithAutoIncrement) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${item.table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${item.table}"), 1))`
      );
    } catch {
      // Bỏ qua nếu bảng không dùng sequence này
    }
  }
  console.log('✅ Đã đồng bộ toàn bộ PostgreSQL sequences.');
  console.log('🎉 Seed dữ liệu mẫu cho AS2 hoàn tất thành công!');
}

main()
  .catch((err) => {
    console.error('❌ Lỗi khi chạy seed data:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
