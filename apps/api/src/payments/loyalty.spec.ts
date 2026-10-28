import { pointsFor } from './loyalty.js';

describe('pointsFor', () => {
  it.each([
    [0, 0],
    [999, 0],
    [1000, 1],
    [25000, 25],
    [29900, 29],
    [84000, 84],
  ])('đơn %i₫ → %i điểm', (total, points) => {
    expect(pointsFor(total)).toBe(points);
  });
});
