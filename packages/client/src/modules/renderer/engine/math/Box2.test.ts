import { describe, expect, it } from 'vitest';
import { Box2 } from './Box2.js';
import { Vec2 } from './Vec2.js';

const vec2 = Vec2.new;

describe('Math - Box2', () => {
  it('Instancing', () => {
    const box = Box2.fromParams(1, 2, 3, 4);

    expect(box.min.x).toBe(1);
    expect(box.min.y).toBe(2);
    expect(box.max.x).toBe(3);
    expect(box.max.y).toBe(4);

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
  });

  it('isEmpty', () => {
    const box = Box2.empty();

    box.setParams(0, 0, 0, 0);
    expect(box.isEmpty()).toBe(false);

    box.setParams(0, 0, 1, 1);
    expect(box.isEmpty()).toBe(false);

    box.setParams(2, 2, 1, 1);
    expect(box.isEmpty()).toBe(true);

    box.clear();
    expect(box.isEmpty()).toBe(true);
  });

  it('fromCoords', () => {
    const box1 = Box2.fromCoords([]);
    expect(box1.isEmpty()).toEqual(true);

    const box2 = Box2.fromCoords([vec2(0, 0), vec2(1, 1), vec2(2, 2)]);
    expect(box2).toEqual(Box2.fromParams(0, 0, 2, 2));

    const box3 = Box2.fromCoords([vec2(1, 1)]);
    expect(box3).toEqual(Box2.fromParams(1, 1, 1, 1));
  });

  it('fromCenterSize', () => {
    const box1 = Box2.fromCenterSize(vec2(0, 0), vec2(2, 2));
    expect(box1).toEqual(Box2.fromParams(-1, -1, 1, 1));

    const box2 = Box2.fromCenterSize(vec2(1, 1), vec2(2, 2));
    expect(box2).toEqual(Box2.fromParams(0, 0, 2, 2));

    const box3 = Box2.fromCenterSize(vec2(0, 0), vec2(0, 0));
    expect(box3).toEqual(Box2.fromParams(0, 0, 0, 0));
  });

  it('center', () => {
    const box1 = Box2.fromParams(0, 0, 0, 0);
    const center1 = vec2(0, 0);
    expect(box1.center(center1)).toBe(center1);
    expect(center1).toEqual(vec2(0, 0));

    const box2 = Box2.fromParams(0, 0, 1, 1);
    const center2 = box2.center();
    expect(center2).toEqual(vec2(0.5, 0.5));
  });

  it('size', () => {
    const box1 = Box2.fromParams(0, 0, 0, 0);
    const size1 = box1.size();
    expect(size1).toEqual(vec2(0, 0));

    const box2 = Box2.fromParams(0, 0, 1, 1);
    const size2 = box2.size();

    expect(size2).toEqual(vec2(1, 1));

    const box3 = Box2.fromParams(-1, -1, 1, 1);
    const size3 = box3.size();
    expect(size3).toEqual(vec2(2, 2));
  });

  it('expandCoord', () => {
    const box1 = Box2.fromParams(0, 0, 0, 0);

    expect(box1.expandCoord(vec2(0, 0))).toBe(box1);
    expect(box1).toEqual(Box2.fromParams(0, 0, 0, 0));

    expect(box1.expandCoord(vec2(1, 1))).toBe(box1);
    expect(box1).toEqual(Box2.fromParams(0, 0, 1, 1));

    expect(box1.expandCoord(vec2(-1, -1))).toBe(box1);
    expect(box1).toEqual(Box2.fromParams(-1, -1, 1, 1));

    expect(box1.expandCoord(vec2(-1, -1))).toBe(box1);
    expect(box1).toEqual(Box2.fromParams(-1, -1, 1, 1));
  });

  it('expandScalar', () => {
    const box1 = Box2.fromParams(0, 0, 0, 0);
    expect(box1.expandScalar(1)).toBe(box1);
    expect(box1).toEqual(Box2.fromParams(-1, -1, 1, 1));

    expect(box1.expandScalar(1)).toBe(box1);
    expect(box1).toEqual(Box2.fromParams(-2, -2, 2, 2));

    expect(box1.expandScalar(-1)).toBe(box1);
    expect(box1).toEqual(Box2.fromParams(-1, -1, 1, 1));
  });

  it('contains', () => {
    const box1 = Box2.fromParams(0, 0, 0, 0);
    const box2 = Box2.fromParams(0, 0, 1, 1);
    const box3 = Box2.fromParams(-1, -1, 1, 1);

    expect(box1.containsBox(box1)).toBe(true);
    expect(box1.containsBox(box2)).toBe(false);
    expect(box1.containsBox(box3)).toBe(false);

    expect(box2.containsBox(box1)).toBe(true);
    expect(box3.containsBox(box1)).toBe(true);
    expect(box2.containsBox(box3)).toBe(false);
  });

  it('containsVec', () => {
    const box1 = Box2.fromParams(0, 0, 0, 0);
    expect(box1.containsVec(vec2(0, 0))).toBe(true);
    expect(box1.containsVec(vec2(1, 1))).toBe(false);

    box1.expandScalar(1);
    expect(box1.containsVec(vec2(0, 0))).toBe(true);
    expect(box1.containsVec(vec2(1, 1))).toBe(true);
    expect(box1.containsVec(vec2(-1, -1))).toBe(true);
  });

  it('intersects', () => {
    const box1 = Box2.fromParams(0, 0, 0, 0);
    const box2 = Box2.fromParams(0, 0, 1, 1);
    const box3 = Box2.fromParams(-1, -1, 1, 1);

    expect(box1.intersectsBox(box1)).toBe(true);
    expect(box1.intersectsBox(box2)).toBe(true);
    expect(box1.intersectsBox(box3)).toBe(true);

    expect(box2.intersectsBox(box1)).toBe(true);
    expect(box3.intersectsBox(box1)).toBe(true);
    expect(box2.intersectsBox(box3)).toBe(true);

    box2.translate(vec2(2, 2));
    expect(box1.intersectsBox(box2)).toBe(false);
    expect(box2.intersectsBox(box1)).toBe(false);
    expect(box2.intersectsBox(box3)).toBe(false);
  });

  it('clamp', () => {
    const box1 = Box2.fromParams(0, 0, 0, 0);
    const box2 = Box2.fromParams(-1, -1, 1, 1);
    const point1 = vec2(0, 0);

    expect(box1.clamp(point1, point1)).toBe(point1);
    expect(point1).toEqual(vec2(0, 0));

    const point2 = vec2(2, 2);
    expect(box2.clamp(point2, point2)).toBe(point2);
    expect(point2).toEqual(vec2(1, 1));

    const point3 = vec2(2, 2);
    const point4 = box2.clamp(point3);
    expect(point4).toEqual(vec2(1, 1));
  });

  it('distanceTo/euclideanTo', () => {
    const box1 = Box2.fromParams(0, 0, 0, 0);

    expect(box1.distanceTo(vec2(0, 0))).toBe(0);
    expect(box1.distanceTo(vec2(1, 1))).toBe(Math.sqrt(2));
    expect(box1.distanceTo(vec2(-1, -1))).toBe(Math.sqrt(2));

    const box2 = Box2.fromParams(-1, -1, 1, 1);
    expect(box2.distanceTo(vec2(1, 1))).toBe(0);
    expect(box2.distanceTo(vec2(0, 0))).toBe(0);
    expect(box2.distanceTo(vec2(-1, -1))).toBe(0);
    expect(box2.distanceTo(vec2(-2, -2))).toBe(Math.sqrt(2));

    expect(box1.distanceSqTo(vec2(0, 0))).toBe(0);
    expect(box1.distanceSqTo(vec2(1, 1))).toBe(2);
    expect(box1.distanceSqTo(vec2(-1, -1))).toBe(2);
  });

  it('intersect', () => {
    const box1 = Box2.fromParams(1, 2, 3, 4);
    const box2 = Box2.fromParams(5, 6, 7, 8);
    box1.intersect(box2);

    expect(box1.isEmpty()).toBe(true);

    const box3 = Box2.fromParams(1, 2, 3, 4);
    const box4 = Box2.fromParams(3, 4, 5, 6);

    box3.intersect(box4);
    expect(box3).toEqual(Box2.fromParams(3, 4, 3, 4));
  });

  it('union', () => {
    const box1 = Box2.fromParams(1, 2, 3, 4);
    const box2 = Box2.fromParams(5, 6, 7, 8);
    box1.union(box2);

    expect(box1).toEqual(Box2.fromParams(1, 2, 7, 8));
    expect(box2).toEqual(Box2.fromParams(5, 6, 7, 8));
  });

  it('translate', () => {
    const box1 = Box2.fromParams(1, 2, 3, 4);
    expect(box1.translate(vec2(1, 1))).toBe(box1);
    expect(box1).toEqual(Box2.fromParams(2, 3, 4, 5));

    expect(box1.translate(vec2(-1, -1))).toBe(box1);
    expect(box1).toEqual(Box2.fromParams(1, 2, 3, 4));

    expect(box1.translate(vec2(0, 0))).toBe(box1);
    expect(box1).toEqual(Box2.fromParams(1, 2, 3, 4));
  });

  it('equals', () => {
    const box1 = Box2.fromParams(1, 2, 3, 4);
    const box2 = Box2.fromParams(1, 2, 3, 4);
    expect(box1.equals(box2)).toEqual(true);
    expect(box2.equals(box1)).toEqual(true);

    box2.setParams(1, 2, 3, 5);
    expect(box1.equals(box2)).toEqual(false);
    expect(box2.equals(box1)).toEqual(false);

    box2.setParams(1, 2, 3, 4);
    expect(box1.equals(box2)).toEqual(true);
    expect(box2.equals(box1)).toEqual(true);
  });
});
