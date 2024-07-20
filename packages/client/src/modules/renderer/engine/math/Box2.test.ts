import { describe, expect, it } from 'vitest';
import { Box2, Vec2 } from './Box2.js';

describe('Math - Box2', () => {
  it('Instancing', () => {
    const box = Box2.create(1, 2, 3, 4);

    expect(box.min.x).toBe(1);
    expect(box.min.y).toBe(2);
    expect(box.max.x).toBe(3);
    expect(box.max.y).toBe(4);

    const cloned = Box2.clone(box);
    expect(cloned.min).toBe(box.min);
    expect(cloned.max).toBe(box.max);
    expect(cloned).toEqual(box);

    const copied = Box2.copy(box);
    expect(copied.min).not.toBe(box.min);
    expect(copied.max).not.toBe(box.max);
    expect(copied.min.x).toBe(box.min.x);
    expect(copied.min.y).toBe(box.min.y);
    expect(copied.max.x).toBe(box.max.x);
    expect(copied.max.y).toBe(box.max.y);
    expect(copied).toEqual(box);

    const empty = Box2.empty();
    expect(empty.min.x).toBe(+Infinity);
    expect(empty.min.y).toBe(+Infinity);
    expect(empty.max.x).toBe(-Infinity);
    expect(empty.max.y).toBe(-Infinity);

    const fill = Box2.empty();
    Box2.fill_(box, fill);
    expect(fill).not.toBe(box);
    expect(fill).toEqual(box);
  });

  it('isEmpty', () => {
    const box = Box2.empty();

    Box2.fill(box, 0, 0, 0, 0);
    expect(Box2.isEmpty(box)).toBe(false);

    Box2.fill(box, 0, 0, 1, 1);
    expect(Box2.isEmpty(box)).toBe(false);

    Box2.fill(box, 2, 2, 1, 1);
    expect(Box2.isEmpty(box)).toBe(true);

    Box2.clear(box);
    expect(Box2.isEmpty(box)).toBe(true);
  });

  it('fromVecs', () => {
    const box1 = Box2.fromVecs([]);
    expect(Box2.isEmpty(box1)).toEqual(true);

    const box2 = Box2.fromVecs([Vec2.create(0, 0), Vec2.create(1, 1), Vec2.create(2, 2)]);
    expect(box2).toEqual(Box2.create(0, 0, 2, 2));

    const box3 = Box2.fromVecs([Vec2.create(1, 1)]);
    expect(box3).toEqual(Box2.create(1, 1, 1, 1));
  });

  it('fromCenterAndSize', () => {
    const box1 = Box2.fromCenterAndSize(Vec2.create(0, 0), Vec2.create(2, 2));
    expect(box1).toEqual(Box2.create(-1, -1, 1, 1));

    const box2 = Box2.fromCenterAndSize(Vec2.create(1, 1), Vec2.create(2, 2));
    expect(box2).toEqual(Box2.create(0, 0, 2, 2));

    const box3 = Box2.fromCenterAndSize(Vec2.create(0, 0), Vec2.create(0, 0));
    expect(box3).toEqual(Box2.create(0, 0, 0, 0));

    const box4 = Box2.create(0, 0, 0, 0);

    expect(Box2.fromCenterAndSize_(Vec2.create(0, 0), Vec2.create(2, 2), box4)).toBe(box4);
    expect(box4).toEqual(Box2.create(-1, -1, 1, 1));
  });

  it('center', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    const center1 = Vec2.create(0, 0);
    expect(Box2.center_(box1, center1)).toBe(center1);
    expect(center1).toEqual(Vec2.create(0, 0));

    const box2 = Box2.create(0, 0, 1, 1);
    const center2 = Box2.center(box2);
    expect(center2).toEqual(Vec2.create(0.5, 0.5));
  });

  it('size', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    const size1 = Box2.size(box1);
    expect(size1).toEqual(Vec2.create(0, 0));

    const box2 = Box2.create(0, 0, 1, 1);
    const size2 = Box2.size(box2);

    expect(size2).toEqual(Vec2.create(1, 1));

    const box3 = Box2.create(-1, -1, 1, 1);
    const size3 = Box2.size(box3);
    expect(size3).toEqual(Vec2.create(2, 2));

    const size = Vec2.create(0, 0);
    expect(Box2.size_(box3, size)).toBe(size);
    expect(size).toEqual(Vec2.create(2, 2));
  });

  it('expandByVec', () => {
    const box1 = Box2.create(0, 0, 0, 0);

    expect(Box2.expandByVec(box1, Vec2.create(0, 0))).toBe(box1);
    expect(box1).toEqual(Box2.create(0, 0, 0, 0));

    expect(Box2.expandByVec(box1, Vec2.create(1, 1))).toBe(box1);
    expect(box1).toEqual(Box2.create(0, 0, 1, 1));

    expect(Box2.expandByVec(box1, Vec2.create(-1, -1))).toBe(box1);
    expect(box1).toEqual(Box2.create(-1, -1, 1, 1));

    expect(Box2.expandByVec(box1, Vec2.create(-1, -1))).toBe(box1);
    expect(box1).toEqual(Box2.create(-1, -1, 1, 1));
  });

  it('expandByScalar', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    expect(Box2.expandByScalar(box1, 1)).toBe(box1);
    expect(box1).toEqual(Box2.create(-1, -1, 1, 1));

    expect(Box2.expandByScalar(box1, 1)).toBe(box1);
    expect(box1).toEqual(Box2.create(-2, -2, 2, 2));

    expect(Box2.expandByScalar(box1, -1)).toBe(box1);
    expect(box1).toEqual(Box2.create(-1, -1, 1, 1));

    Box2.fill(box1, 0, 0, 0, 0);
    const box2 = Box2.expandedByScalar(box1, 1);
    expect(box1).toEqual(Box2.create(0, 0, 0, 0));
    expect(box2).toEqual(Box2.create(-1, -1, 1, 1));
  });

  it('contains', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    const box2 = Box2.create(0, 0, 1, 1);
    const box3 = Box2.create(-1, -1, 1, 1);

    expect(Box2.contains(box1, box1)).toBe(true);
    expect(Box2.contains(box1, box2)).toBe(false);
    expect(Box2.contains(box1, box3)).toBe(false);

    expect(Box2.contains(box2, box1)).toBe(true);
    expect(Box2.contains(box3, box1)).toBe(true);
    expect(Box2.contains(box2, box3)).toBe(false);
  });

  it('containsVec', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    expect(Box2.containsVec(box1, Vec2.create(0, 0))).toBe(true);
    expect(Box2.containsVec(box1, Vec2.create(1, 1))).toBe(false);

    Box2.expandByScalar(box1, 1);
    expect(Box2.containsVec(box1, Vec2.create(0, 0))).toBe(true);
    expect(Box2.containsVec(box1, Vec2.create(1, 1))).toBe(true);
    expect(Box2.containsVec(box1, Vec2.create(-1, -1))).toBe(true);
  });

  it('intersects', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    const box2 = Box2.create(0, 0, 1, 1);
    const box3 = Box2.create(-1, -1, 1, 1);

    expect(Box2.intersects(box1, box1)).toBe(true);
    expect(Box2.intersects(box1, box2)).toBe(true);
    expect(Box2.intersects(box1, box3)).toBe(true);

    expect(Box2.intersects(box2, box1)).toBe(true);
    expect(Box2.intersects(box3, box1)).toBe(true);
    expect(Box2.intersects(box2, box3)).toBe(true);

    Box2.translate(box2, Vec2.create(2, 2));
    expect(Box2.intersects(box1, box2)).toBe(false);
    expect(Box2.intersects(box2, box1)).toBe(false);
    expect(Box2.intersects(box2, box3)).toBe(false);
  });

  it('clampVec', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    const box2 = Box2.create(-1, -1, 1, 1);
    const point1 = Vec2.create(0, 0);

    expect(Box2.clampVec_(box1, point1, point1)).toBe(point1);
    expect(point1).toEqual(Vec2.create(0, 0));

    const point2 = Vec2.create(2, 2);
    expect(Box2.clampVec_(box2, point2, point2)).toBe(point2);
    expect(point2).toEqual(Vec2.create(1, 1));

    const point3 = Vec2.create(2, 2);
    const point4 = Box2.clampVec(box2, point3);
    expect(point3).toEqual(Vec2.create(2, 2));
    expect(point4).toEqual(Vec2.create(1, 1));
  });

  it('distanceTo', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    expect(Box2.distanceTo(box1, Vec2.create(0, 0))).toBe(0);
    expect(Box2.distanceTo(box1, Vec2.create(1, 1))).toBe(Math.sqrt(2));
    expect(Box2.distanceTo(box1, Vec2.create(-1, -1))).toBe(Math.sqrt(2));

    const box2 = Box2.create(-1, -1, 1, 1);
    expect(Box2.distanceTo(box2, Vec2.create(1, 1))).toBe(0);
    expect(Box2.distanceTo(box2, Vec2.create(0, 0))).toBe(0);
    expect(Box2.distanceTo(box2, Vec2.create(-1, -1))).toBe(0);
    expect(Box2.distanceTo(box2, Vec2.create(-2, -2))).toBe(Math.sqrt(2));

    expect(Box2.distanceSqTo(box1, Vec2.create(0, 0))).toBe(0);
    expect(Box2.distanceSqTo(box1, Vec2.create(1, 1))).toBe(2);
    expect(Box2.distanceSqTo(box1, Vec2.create(-1, -1))).toBe(2);
  });

  it('intersect', () => {
    const box1 = Box2.create(1, 2, 3, 4);
    const box2 = Box2.create(5, 6, 7, 8);
    Box2.intersect(box1, box2);

    expect(box1).toEqual(Box2.create(5, 6, 3, 4));
    expect(box2).toEqual(Box2.create(5, 6, 7, 8));

    Box2.fill(box1, 1, 2, 3, 4);
    const box3 = Box2.intersected(box1, box2);

    expect(box1).toEqual(Box2.create(1, 2, 3, 4));
    expect(box2).toEqual(Box2.create(5, 6, 7, 8));
    expect(box3).toEqual(Box2.create(5, 6, 3, 4));
  });

  it('union', () => {
    const box1 = Box2.create(1, 2, 3, 4);
    const box2 = Box2.create(5, 6, 7, 8);
    Box2.union(box1, box2);

    expect(box1).toEqual(Box2.create(1, 2, 7, 8));
    expect(box2).toEqual(Box2.create(5, 6, 7, 8));

    Box2.fill(box1, 1, 2, 3, 4);
    const box3 = Box2.united(box1, box2);

    expect(box1).toEqual(Box2.create(1, 2, 3, 4));
    expect(box2).toEqual(Box2.create(5, 6, 7, 8));
    expect(box3).toEqual(Box2.create(1, 2, 7, 8));
  });

  it('translate', () => {
    const box1 = Box2.create(1, 2, 3, 4);
    expect(Box2.translate(box1, Vec2.create(1, 1))).toBe(box1);
    expect(box1).toEqual(Box2.create(2, 3, 4, 5));

    expect(Box2.translate(box1, Vec2.create(-1, -1))).toBe(box1);
    expect(box1).toEqual(Box2.create(1, 2, 3, 4));

    expect(Box2.translate(box1, Vec2.create(0, 0))).toBe(box1);
    expect(box1).toEqual(Box2.create(1, 2, 3, 4));

    const box2 = Box2.translated(box1, Vec2.create(1, 1));
    expect(box1).toEqual(Box2.create(1, 2, 3, 4));
    expect(box2).toEqual(Box2.create(2, 3, 4, 5));
  });

  it('equals', () => {
    const box1 = Box2.create(1, 2, 3, 4);
    const box2 = Box2.create(1, 2, 3, 4);
    expect(Box2.equals(box1, box2)).toEqual(true);
    expect(Box2.equals(box2, box1)).toEqual(true);

    Box2.fill(box2, 1, 2, 3, 5);
    expect(Box2.equals(box1, box2)).toEqual(false);
    expect(Box2.equals(box2, box1)).toEqual(false);

    Box2.fill(box2, 1, 2, 3, 4);
    expect(Box2.equals(box1, box2)).toEqual(true);
    expect(Box2.equals(box2, box1)).toEqual(true);
  });
});
