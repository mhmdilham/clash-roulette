import { describe, it, expect } from 'vitest';
import {
  computeTargetRotation,
  getSliceIndexAtPointer,
  describeSlicePath,
  pickRandomIndex,
  getSliceMidAngle,
} from '../../src/engine/wheelMath';

describe('wheelMath', () => {
  it('maps target rotation back to exact winning slice for slice counts 1, 2, 3, 6, 12, 35', () => {
    for (const count of [1, 2, 3, 6, 12, 35]) {
      for (const startDeg of [0, 37, 359.9, 1420.5]) {
        for (let target = 0; target < count; target++) {
          const endDeg = computeTargetRotation(startDeg, target, count, {
            minSpins: 4,
            rng: () => 0.5,
          });
          expect(endDeg).toBeGreaterThan(startDeg + 360 * 3);
          expect(getSliceIndexAtPointer(endDeg, count)).toBe(target);
        }
      }
    }
  });

  it('handles 0/360 wraparound and negative angles in getSliceIndexAtPointer', () => {
    expect(getSliceIndexAtPointer(0, 4)).toBe(0);
    expect(getSliceIndexAtPointer(360, 4)).toBe(0);
    expect(getSliceIndexAtPointer(359.99, 4)).toBe(0);
    expect(getSliceIndexAtPointer(-10, 4)).toBe(0);
    expect(getSliceIndexAtPointer(90, 4)).toBe(3);
  });

  it('produces a non-degenerate full-circle SVG path for 1-slice wheels', () => {
    const path = describeSlicePath(200, 200, 180, 0, 360);
    expect(path).toContain('A 180 180');
    expect(path.match(/A 180 180/g)?.length).toBe(2);
  });

  it('picks valid indices in [0, length - 1] and computes slice mid angles', () => {
    expect(pickRandomIndex(1)).toBe(0);
    expect(pickRandomIndex(10, () => 0.9999)).toBe(9);
    expect(getSliceMidAngle(0, 4)).toBe(45);
    expect(getSliceMidAngle(2, 4)).toBe(225);
  });
});
