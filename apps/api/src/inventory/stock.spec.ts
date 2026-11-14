import {
  assertStockAvailable,
  deductStock,
  loadNeeds,
  OutOfStockError,
  refundStock,
  sumNeeds,
} from './stock.js';

const caPheM = { productId: 1, size: 'M', ingredientId: 1, quantity: 18 };
const suaM = { productId: 1, size: 'M', ingredientId: 2, quantity: 30 };
const caPheL = { productId: 1, size: 'L', ingredientId: 1, quantity: 22 };
const traiChau = { toppingCode: 'tran-chau', ingredientId: 3, quantity: 30 };
const suaTraiChau = { toppingCode: 'tran-chau', ingredientId: 2, quantity: 5 };

describe('sumNeeds', () => {
  it('công thức món theo đúng size, nhân với số ly', () => {
    const needs = sumNeeds([{ productId: 1, size: 'M', quantity: 3, toppings: [] }], [caPheM, suaM, caPheL], []);
    expect(needs).toEqual(new Map([[1, 54], [2, 90]]));
  });

  it('cộng cả nguyên liệu của topping (mỗi ly một phần) và cộng dồn cùng nguyên liệu', () => {
    const needs = sumNeeds(
      [{ productId: 1, size: 'M', quantity: 2, toppings: ['tran-chau'] }],
      [caPheM, suaM],
      [traiChau, suaTraiChau],
    );
    // sữa: 2 × 30 (món) + 2 × 5 (topping) = 70
    expect(needs).toEqual(new Map([[1, 36], [2, 70], [3, 60]]));
  });

  it('nhiều dòng đơn cùng nguyên liệu được cộng dồn', () => {
    const needs = sumNeeds(
      [
        { productId: 1, size: 'M', quantity: 1, toppings: [] },
        { productId: 1, size: 'L', quantity: 2, toppings: [] },
      ],
      [caPheM, caPheL],
      [],
    );
    expect(needs.get(1)).toBe(18 + 44);
  });

  it('món, size hoặc topping chưa có công thức thì không đóng góp', () => {
    expect(sumNeeds([{ productId: 9, size: 'M', quantity: 5, toppings: [] }], [caPheM], [])).toEqual(new Map());
    expect(sumNeeds([{ productId: 1, size: 'S', quantity: 5, toppings: [] }], [caPheM], [])).toEqual(new Map());
    const chiTopping = sumNeeds([{ productId: 9, size: 'S', quantity: 2, toppings: ['tran-chau', 'khong-cong-thuc'] }], [], [traiChau]);
    expect(chiTopping).toEqual(new Map([[3, 60]]));
  });
});

describe('loadNeeds', () => {
  it('chỉ tra bảng topping khi có topping; truy vấn đúng món và topping của đơn', async () => {
    const recipeFind = vi.fn().mockResolvedValue([caPheM]);
    const toppingFind = vi.fn().mockResolvedValue([traiChau]);
    const db: any = { recipeItem: { findMany: recipeFind }, toppingRecipeItem: { findMany: toppingFind } };

    await loadNeeds(db, [{ productId: 1, size: 'M', quantity: 1, toppings: [] }]);
    expect(toppingFind).not.toHaveBeenCalled();

    const needs = await loadNeeds(db, [
      { productId: 1, size: 'M', quantity: 1, toppings: ['tran-chau'] },
      { productId: 2, size: 'S', quantity: 1, toppings: ['tran-chau'] },
    ]);
    expect(recipeFind.mock.calls[1][0].where).toEqual({ productId: { in: [1, 2] } });
    expect(toppingFind.mock.calls[0][0].where).toEqual({ toppingCode: { in: ['tran-chau'] } });
    expect(needs.get(3)).toBe(60);
  });
});

describe('assertStockAvailable', () => {
  const db = (stocks: Record<number, number>) =>
    ({
      ingredient: {
        findMany: vi.fn().mockImplementation(({ where }) =>
          Promise.resolve(
            where.id.in.map((id: number) => ({ id, name: `NL${id}`, stock: stocks[id] })),
          ),
        ),
      },
    }) as any;

  it('đủ (kể cả đúng bằng) thì không ném lỗi', async () => {
    await expect(assertStockAvailable(db({ 1: 36, 2: 70 }), new Map([[1, 36], [2, 70]]))).resolves.toBeUndefined();
  });

  it('thiếu thì ném OutOfStockError liệt kê mọi nguyên liệu thiếu', async () => {
    const err = await assertStockAvailable(db({ 1: 10, 2: 100, 3: 0 }), new Map([[1, 36], [2, 70], [3, 1]])).catch((e) => e);
    expect(err).toBeInstanceOf(OutOfStockError);
    expect(err.ingredientNames).toEqual(['NL1', 'NL3']);
    expect(err.message).toBe('Hết nguyên liệu: NL1, NL3');
  });

  it('không cần nguyên liệu nào thì không truy vấn', async () => {
    const d = db({});
    await assertStockAvailable(d, new Map());
    expect(d.ingredient.findMany).not.toHaveBeenCalled();
  });
});

describe('deductStock', () => {
  // Mô phỏng kho thật: updateMany chỉ trừ khi stock >= cần, giống câu UPDATE ... WHERE stock >= cần
  function kho(stocks: Record<number, number>) {
    const usage: any[] = [];
    const db: any = {
      ingredient: {
        updateMany: vi.fn().mockImplementation(({ where, data }) => {
          const need = data.stock.decrement;
          if (stocks[where.id] >= where.stock.gte) {
            stocks[where.id] -= need;
            return Promise.resolve({ count: 1 });
          }
          return Promise.resolve({ count: 0 });
        }),
        findMany: vi.fn().mockImplementation(({ where }) =>
          Promise.resolve(where.id.in.map((id: number) => ({ name: `NL${id}` }))),
        ),
      },
      stockUsage: { createMany: vi.fn().mockImplementation(({ data }) => (usage.push(...data), Promise.resolve({}))) },
    };
    return { db, stocks, usage };
  }

  it('đủ: trừ có điều kiện từng nguyên liệu theo thứ tự id và lưu số đã trừ', async () => {
    const { db, stocks, usage } = kho({ 1: 100, 2: 100 });
    await deductStock(db, 'ord_1', new Map([[2, 30], [1, 20]]));
    expect(stocks).toEqual({ 1: 80, 2: 70 });
    expect(db.ingredient.updateMany.mock.calls.map((c: any) => c[0].where.id)).toEqual([1, 2]);
    expect(db.ingredient.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 1, stock: { gte: 20 } },
      data: { stock: { decrement: 20 } },
    });
    expect(usage).toEqual([
      { orderId: 'ord_1', ingredientId: 1, quantity: 20 },
      { orderId: 'ord_1', ingredientId: 2, quantity: 30 },
    ]);
  });

  it('thiếu một nguyên liệu: ném OutOfStockError tên nguyên liệu đó và không ghi StockUsage', async () => {
    const { db, usage } = kho({ 1: 100, 2: 10 });
    const err = await deductStock(db, 'ord_1', new Map([[1, 20], [2, 30]])).catch((e) => e);
    expect(err).toBeInstanceOf(OutOfStockError);
    expect(err.message).toBe('Hết nguyên liệu: NL2');
    expect(usage).toEqual([]);
  });

  it('hai đơn tranh phần kho cuối cùng: chỉ một đơn trừ được, tồn không âm', async () => {
    const { db, stocks } = kho({ 1: 100 });
    const ket = await Promise.allSettled([
      deductStock(db, 'ord_a', new Map([[1, 80]])),
      deductStock(db, 'ord_b', new Map([[1, 80]])),
    ]);
    expect(ket.filter((k) => k.status === 'fulfilled')).toHaveLength(1);
    const loi = ket.find((k) => k.status === 'rejected') as PromiseRejectedResult;
    expect(loi.reason).toBeInstanceOf(OutOfStockError);
    expect(stocks[1]).toBe(20);
  });

  it('nhiều đơn đồng thời cùng mua 30 trên tồn 100: đúng 3 đơn thành công, tồn còn 10', async () => {
    const { db, stocks } = kho({ 1: 100 });
    const ket = await Promise.allSettled(
      Array.from({ length: 6 }, (_, i) => deductStock(db, `ord_${i}`, new Map([[1, 30]]))),
    );
    expect(ket.filter((k) => k.status === 'fulfilled')).toHaveLength(3);
    expect(stocks[1]).toBe(10);
  });

  it('không cần nguyên liệu nào thì không động tới kho', async () => {
    const { db } = kho({});
    await deductStock(db, 'ord_1', new Map());
    expect(db.ingredient.updateMany).not.toHaveBeenCalled();
    expect(db.stockUsage.createMany).not.toHaveBeenCalled();
  });
});

describe('refundStock', () => {
  it('cộng lại đúng số đã trừ theo StockUsage rồi xóa dòng sử dụng', async () => {
    const db: any = {
      stockUsage: {
        findMany: vi.fn().mockResolvedValue([
          { ingredientId: 1, quantity: 20 },
          { ingredientId: 2, quantity: 30 },
        ]),
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      ingredient: { update: vi.fn().mockResolvedValue({}) },
    };

    await refundStock(db, 'ord_1');

    expect(db.stockUsage.findMany.mock.calls[0][0].where).toEqual({ orderId: 'ord_1' });
    expect(db.ingredient.update.mock.calls.map((c: any) => c[0])).toEqual([
      { where: { id: 1 }, data: { stock: { increment: 20 } } },
      { where: { id: 2 }, data: { stock: { increment: 30 } } },
    ]);
    expect(db.stockUsage.deleteMany).toHaveBeenCalledWith({ where: { orderId: 'ord_1' } });
  });

  it('đơn không có StockUsage (món chưa có công thức): không làm gì', async () => {
    const db: any = {
      stockUsage: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn() },
      ingredient: { update: vi.fn() },
    };
    await refundStock(db, 'ord_1');
    expect(db.ingredient.update).not.toHaveBeenCalled();
    expect(db.stockUsage.deleteMany).not.toHaveBeenCalled();
  });
});
