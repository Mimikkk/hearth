import { describe, expect, it } from 'vitest';
import { Box2 } from './Box2.js';
import { Vec2 } from './Vector2.ts';

const vec2 = Vec2.new;

describe('Math - Box2', () => {
  it('Instancing', () => {
    const box = Box2.create(1, 2, 3, 4);

    expect(box.min.x).toBe(1);
    expect(box.min.y).toBe(2);
    expect(box.max.x).toBe(3);
    expect(box.max.y).toBe(4);

    const copy = Box2.copy(box);
    expect(copy.min).toBe(box.min);
    expect(copy.max).toBe(box.max);
    expect(copy).toEqual(box);

    const clone = Box2.clone(box);
    expect(clone.min).not.toBe(box.min);
    expect(clone.max).not.toBe(box.max);
    expect(clone.min.x).toBe(box.min.x);
    expect(clone.min.y).toBe(box.min.y);
    expect(clone.max.x).toBe(box.max.x);
    expect(clone.max.y).toBe(box.max.y);
    expect(clone).toEqual(box);

    const empty = Box2.empty();
    expect(empty.min.x).toBe(+Infinity);
    expect(empty.min.y).toBe(+Infinity);
    expect(empty.max.x).toBe(-Infinity);
    expect(empty.max.y).toBe(-Infinity);

    const fill = Box2.empty();
    Box2.clone_(box, fill);
    expect(fill).not.toBe(box);
    expect(fill).toEqual(box);
  });

  it('isEmpty', () => {
    const box = Box2.empty();

    Box2.set(box, 0, 0, 0, 0);
    expect(Box2.isEmpty(box)).toBe(false);

    Box2.set(box, 0, 0, 1, 1);
    expect(Box2.isEmpty(box)).toBe(false);

    Box2.set(box, 2, 2, 1, 1);
    expect(Box2.isEmpty(box)).toBe(true);

    Box2.clear(box);
    expect(Box2.isEmpty(box)).toBe(true);
  });

  it('fromVecs', () => {
    const box1 = Box2.fromVecs([]);
    expect(Box2.isEmpty(box1)).toEqual(true);

    const box2 = Box2.fromVecs([vec2(0, 0), vec2(1, 1), vec2(2, 2)]);
    expect(box2).toEqual(Box2.create(0, 0, 2, 2));

    const box3 = Box2.fromVecs([vec2(1, 1)]);
    expect(box3).toEqual(Box2.create(1, 1, 1, 1));
  });

  it('fromCenterAndSize', () => {
    const box1 = Box2.fromCenterAndSize(vec2(0, 0), vec2(2, 2));
    expect(box1).toEqual(Box2.create(-1, -1, 1, 1));

    const box2 = Box2.fromCenterAndSize(vec2(1, 1), vec2(2, 2));
    expect(box2).toEqual(Box2.create(0, 0, 2, 2));

    const box3 = Box2.fromCenterAndSize(vec2(0, 0), vec2(0, 0));
    expect(box3).toEqual(Box2.create(0, 0, 0, 0));

    const box4 = Box2.create(0, 0, 0, 0);

    expect(Box2.fromCenterAndSize_(vec2(0, 0), vec2(2, 2), box4)).toBe(box4);
    expect(box4).toEqual(Box2.create(-1, -1, 1, 1));
  });

  it('center', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    const center1 = vec2(0, 0);
    expect(Box2.center_(box1, center1)).toBe(center1);
    expect(center1).toEqual(vec2(0, 0));

    const box2 = Box2.create(0, 0, 1, 1);
    const center2 = Box2.center(box2);
    expect(center2).toEqual(vec2(0.5, 0.5));
  });

  it('size', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    const size1 = Box2.size(box1);
    expect(size1).toEqual(vec2(0, 0));

    const box2 = Box2.create(0, 0, 1, 1);
    const size2 = Box2.size(box2);

    expect(size2).toEqual(vec2(1, 1));

    const box3 = Box2.create(-1, -1, 1, 1);
    const size3 = Box2.size(box3);
    expect(size3).toEqual(vec2(2, 2));

    const size = vec2(0, 0);
    expect(Box2.size_(box3, size)).toBe(size);
    expect(size).toEqual(vec2(2, 2));
  });

  it('expandByVec', () => {
    const box1 = Box2.create(0, 0, 0, 0);

    expect(Box2.expandByVec(box1, vec2(0, 0))).toBe(box1);
    expect(box1).toEqual(Box2.create(0, 0, 0, 0));

    expect(Box2.expandByVec(box1, vec2(1, 1))).toBe(box1);
    expect(box1).toEqual(Box2.create(0, 0, 1, 1));

    expect(Box2.expandByVec(box1, vec2(-1, -1))).toBe(box1);
    expect(box1).toEqual(Box2.create(-1, -1, 1, 1));

    expect(Box2.expandByVec(box1, vec2(-1, -1))).toBe(box1);
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

    Box2.set(box1, 0, 0, 0, 0);
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
    expect(Box2.containsVec(box1, vec2(0, 0))).toBe(true);
    expect(Box2.containsVec(box1, vec2(1, 1))).toBe(false);

    Box2.expandByScalar(box1, 1);
    expect(Box2.containsVec(box1, vec2(0, 0))).toBe(true);
    expect(Box2.containsVec(box1, vec2(1, 1))).toBe(true);
    expect(Box2.containsVec(box1, vec2(-1, -1))).toBe(true);
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

    Box2.translate(box2, vec2(2, 2));
    expect(Box2.intersects(box1, box2)).toBe(false);
    expect(Box2.intersects(box2, box1)).toBe(false);
    expect(Box2.intersects(box2, box3)).toBe(false);
  });

  it('clampVec', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    const box2 = Box2.create(-1, -1, 1, 1);
    const point1 = vec2(0, 0);

    expect(Box2.clampVec_(box1, point1, point1)).toBe(point1);
    expect(point1).toEqual(vec2(0, 0));

    const point2 = vec2(2, 2);
    expect(Box2.clampVec_(box2, point2, point2)).toBe(point2);
    expect(point2).toEqual(vec2(1, 1));

    const point3 = vec2(2, 2);
    const point4 = Box2.clampVec(box2, point3);
    expect(point3).toEqual(vec2(2, 2));
    expect(point4).toEqual(vec2(1, 1));
  });

  it('distanceTo', () => {
    const box1 = Box2.create(0, 0, 0, 0);
    expect(Box2.distanceTo(box1, vec2(0, 0))).toBe(0);
    expect(Box2.distanceTo(box1, vec2(1, 1))).toBe(Math.sqrt(2));
    expect(Box2.distanceTo(box1, vec2(-1, -1))).toBe(Math.sqrt(2));

    const box2 = Box2.create(-1, -1, 1, 1);
    expect(Box2.distanceTo(box2, vec2(1, 1))).toBe(0);
    expect(Box2.distanceTo(box2, vec2(0, 0))).toBe(0);
    expect(Box2.distanceTo(box2, vec2(-1, -1))).toBe(0);
    expect(Box2.distanceTo(box2, vec2(-2, -2))).toBe(Math.sqrt(2));

    expect(Box2.distanceSqTo(box1, vec2(0, 0))).toBe(0);
    expect(Box2.distanceSqTo(box1, vec2(1, 1))).toBe(2);
    expect(Box2.distanceSqTo(box1, vec2(-1, -1))).toBe(2);
  });

  it('intersect', () => {
    const box1 = Box2.create(1, 2, 3, 4);
    const box2 = Box2.create(5, 6, 7, 8);
    Box2.intersect(box1, box2);

    expect(box1).toEqual(Box2.create(5, 6, 3, 4));
    expect(box2).toEqual(Box2.create(5, 6, 7, 8));

    Box2.set(box1, 1, 2, 3, 4);
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

    Box2.set(box1, 1, 2, 3, 4);
    const box3 = Box2.united(box1, box2);

    expect(box1).toEqual(Box2.create(1, 2, 3, 4));
    expect(box2).toEqual(Box2.create(5, 6, 7, 8));
    expect(box3).toEqual(Box2.create(1, 2, 7, 8));
  });

  it('translate', () => {
    const box1 = Box2.create(1, 2, 3, 4);
    expect(Box2.translate(box1, vec2(1, 1))).toBe(box1);
    expect(box1).toEqual(Box2.create(2, 3, 4, 5));

    expect(Box2.translate(box1, vec2(-1, -1))).toBe(box1);
    expect(box1).toEqual(Box2.create(1, 2, 3, 4));

    expect(Box2.translate(box1, vec2(0, 0))).toBe(box1);
    expect(box1).toEqual(Box2.create(1, 2, 3, 4));

    const box2 = Box2.translated(box1, vec2(1, 1));
    expect(box1).toEqual(Box2.create(1, 2, 3, 4));
    expect(box2).toEqual(Box2.create(2, 3, 4, 5));
  });

  it('equals', () => {
    const box1 = Box2.create(1, 2, 3, 4);
    const box2 = Box2.create(1, 2, 3, 4);
    expect(Box2.equals(box1, box2)).toEqual(true);
    expect(Box2.equals(box2, box1)).toEqual(true);

    Box2.set(box2, 1, 2, 3, 5);
    expect(Box2.equals(box1, box2)).toEqual(false);
    expect(Box2.equals(box2, box1)).toEqual(false);

    Box2.set(box2, 1, 2, 3, 4);
    expect(Box2.equals(box1, box2)).toEqual(true);
    expect(Box2.equals(box2, box1)).toEqual(true);
  });
});
