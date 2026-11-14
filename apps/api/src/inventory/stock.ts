import type { PrismaClient } from '../generated/prisma/client.js';

// Chạy được với PrismaService lẫn transaction client (chỉ cần các model dưới đây)
type Db = Pick<PrismaClient, 'recipeItem' | 'toppingRecipeItem' | 'ingredient' | 'stockUsage'>;

export type NeedItem = { productId: number; size: string; quantity: number; toppings: string[] };
type Recipe = { productId: number; size: string; ingredientId: number; quantity: number };
type ToppingRecipe = { toppingCode: string; ingredientId: number; quantity: number };

export class OutOfStockError extends Error {
  constructor(readonly ingredientNames: string[]) {
    super(`Hết nguyên liệu: ${ingredientNames.join(', ')}`);
  }
}

// Nguyên liệu cần cho cả đơn: công thức món theo size và công thức từng topping, nhân với số ly.
// Món, size hoặc topping chưa có công thức thì không đóng góp gì.
export function sumNeeds(items: NeedItem[], recipes: Recipe[], toppingRecipes: ToppingRecipe[]) {
  const needs = new Map<number, number>();
  const add = (ingredientId: number, quantity: number) =>
    needs.set(ingredientId, (needs.get(ingredientId) ?? 0) + quantity);
  for (const item of items) {
    for (const r of recipes) {
      if (r.productId === item.productId && r.size === item.size) add(r.ingredientId, r.quantity * item.quantity);
    }
    for (const code of item.toppings) {
      for (const r of toppingRecipes) {
        if (r.toppingCode === code) add(r.ingredientId, r.quantity * item.quantity);
      }
    }
  }
  return needs;
}

export async function loadNeeds(db: Db, items: NeedItem[]) {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const toppingCodes = [...new Set(items.flatMap((i) => i.toppings))];
  const recipes = await db.recipeItem.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true, size: true, ingredientId: true, quantity: true },
  });
  const toppingRecipes = toppingCodes.length
    ? await db.toppingRecipeItem.findMany({
        where: { toppingCode: { in: toppingCodes } },
        select: { toppingCode: true, ingredientId: true, quantity: true },
      })
    : [];
  return sumNeeds(items, recipes, toppingRecipes);
}

// Kiểm tra sớm khi tạo đơn, không giữ chỗ; thiếu thì ném OutOfStockError kèm tên nguyên liệu
export async function assertStockAvailable(db: Db, needs: Map<number, number>) {
  if (!needs.size) return;
  const rows = await db.ingredient.findMany({
    where: { id: { in: [...needs.keys()] } },
    select: { id: true, name: true, stock: true },
  });
  const short = rows.filter((r) => r.stock < needs.get(r.id)!).map((r) => r.name);
  if (short.length) throw new OutOfStockError(short);
}

// Trừ kho có điều kiện (stock >= cần): hai thanh toán đồng thời không bao giờ làm tồn âm.
// Phải gọi trong transaction; ném OutOfStockError thì mọi thay đổi trước đó bị hoàn tác.
export async function deductStock(db: Db, orderId: string, needs: Map<number, number>) {
  if (!needs.size) return;
  // Luôn trừ theo thứ tự id để hai transaction không khóa chéo nhau
  const ids = [...needs.keys()].sort((a, b) => a - b);
  const short: number[] = [];
  for (const id of ids) {
    const need = needs.get(id)!;
    const result = await db.ingredient.updateMany({
      where: { id, stock: { gte: need } },
      data: { stock: { decrement: need } },
    });
    if (result.count === 0) short.push(id);
  }
  if (short.length) {
    const rows = await db.ingredient.findMany({ where: { id: { in: short } }, select: { name: true } });
    throw new OutOfStockError(rows.map((r) => r.name));
  }
  await db.stockUsage.createMany({
    data: ids.map((ingredientId) => ({ orderId, ingredientId, quantity: needs.get(ingredientId)! })),
  });
}

// Hoàn đúng số đã trừ của đơn (không tính lại theo công thức hiện hành); gọi trong transaction
export async function refundStock(db: Db, orderId: string) {
  const usages = await db.stockUsage.findMany({
    where: { orderId },
    orderBy: { ingredientId: 'asc' },
    select: { ingredientId: true, quantity: true },
  });
  for (const u of usages) {
    await db.ingredient.update({
      where: { id: u.ingredientId },
      data: { stock: { increment: u.quantity } },
    });
  }
  if (usages.length) await db.stockUsage.deleteMany({ where: { orderId } });
}
