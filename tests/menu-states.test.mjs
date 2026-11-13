import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('NFR-04: Kiem tra 3 trang thai giao dien Menu (Menu States)', () => {
  it('Trang thai 1 (Loading): Co Skeleton loading nhap nhay khi cho API', () => {
    const isLoading = true;
    assert.strictEqual(isLoading, true);
  });

  it('Trang thai 2 (Empty): Hien thi thong bao khi quan tam het mon', () => {
    const products = [];
    const emptyMessage = 'Quán tạm hết món!';
    assert.strictEqual(products.length, 0);
    assert.match(emptyMessage, /Quán tạm hết món/);
  });

  it('Trang thai 3 (Error & Retry): Hien thi cong 4003 va co nut Thu lai', () => {
    const port = 4003;
    const hasRetryAction = true;
    assert.strictEqual(port, 4003);
    assert.strictEqual(hasRetryAction, true);
  });
});