import { describe, it, expect } from 'vitest';
import { Vec2 } from './Vec2.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

describe('Math - Vec2', () => {
  it('Instancing', () => {
    let a = Vec2.new();
    expect(a).toEqual({ x: 0, y: 0 });

    a.set(1, 2);
    expect(a).toEqual({ x: 1, y: 2 });

    let b = Vec2.from(a);
    expect(b).toEqual({ x: 1, y: 2 });
    expect(b).not.toBe(a);
  });

  it('add', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(-1, -2);

    a.add(b);
    expect(a).toEqual({ x: 0, y: 0 });
  });

  it('addScalar', () => {
    const a = Vec2.new(1, 2);
    a.addScalar(1);
    expect(a).toEqual({ x: 2, y: 3 });
  });

  it('addScaled', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(-1, -2);
    a.addScaled(b, 2);
    expect(a).toEqual({ x: -1, y: -2 });
  });

  it('sub', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(-1, -2);

    a.sub(b);
    expect(a).toEqual({ x: 2, y: 4 });
  });

  it('subScalar', () => {
    const a = Vec2.new(1, 2);
    a.subScalar(1);
    expect(a).toEqual({ x: 0, y: 1 });
  });

  it('subScaled', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(-1, -2);
    a.subScaled(b, 2);
    expect(a).toEqual({ x: 3, y: 6 });
  });

  it('mul', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(-1, -2);

    a.mul(b);
    expect(a).toEqual({ x: -1, y: -4 });
  });

  it('mulScalar', () => {
    const a = Vec2.new(1, 2);
    a.mulScalar(2);
    expect(a).toEqual({ x: 2, y: 4 });
  });

  it('div', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(-1, -2);

    a.div(b);
    expect(a).toEqual({ x: -1, y: -1 });
  });

  it('divScalar', () => {
    const a = Vec2.new(1, 2);
    a.divScalar(2);
    expect(a).toEqual({ x: 0.5, y: 1 });
  });

  it('negate', () => {
    const a = Vec2.new(1, 2);
    a.negate();
    expect(a).toEqual({ x: -1, y: -2 });
  });

  it('min', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(-1, -2);

    a.min(b);
    expect(a).toEqual({ x: -1, y: -2 });
  });

  it('max', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(-1, -2);

    a.max(b);
    expect(a).toEqual({ x: 1, y: 2 });
  });

  it('clamp', () => {
    const a = Vec2.new(1, 2);
    const min = Vec2.new(-1, -1);
    const max = Vec2.new(1, 1);

    a.clamp(min, max);
    expect(a).toEqual({ x: 1, y: 1 });
  });

  it('clampScalar', () => {
    const a = Vec2.new(1, 2);
    a.clampScalar(0, 1);

    expect(a).toEqual({ x: 1, y: 1 });
  });

  it('clampLength', () => {
    const a = Vec2.new(1, 2);
    expect(a.length()).toBe(Math.sqrt(5));

    a.clampLength(1, 2);

    expect(a.length()).closeTo(1, Number.EPSILON);
  });

  it('setLength', () => {
    const a = Vec2.new(1, 2);

    expect(a.length()).toBe(Math.sqrt(5));

    a.setLength(1);

    expect(a.length()).closeTo(1, Number.EPSILON);
  });

  it('truncate', () => {
    const a = Vec2.new(1.1, 2.2);
    a.truncate();
    expect(a).toEqual({ x: 1, y: 2 });
  });

  it('round', () => {
    const a = Vec2.new(1.1, 2.7);
    a.round();
    expect(a).toEqual({ x: 1, y: 3 });
  });

  it('floor', () => {
    const a = Vec2.new(1.1, 2.2);
    a.floor();
    expect(a).toEqual({ x: 1, y: 2 });
  });

  it('ceil', () => {
    const a = Vec2.new(1.1, 2.2);
    a.ceil();
    expect(a).toEqual({ x: 2, y: 3 });
  });

  it('equals', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(1, 2);

    expect(a.equals(b)).toBe(true);
  });

  it('dot', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(-1, -2);

    expect(a.dot(b)).toBe(-5);
  });

  it('cross', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(-1, -2);

    expect(a.cross(b)).toBe(0);
  });

  it('length/euclidean', () => {
    const a = Vec2.new(3, 4);
    expect(a.euclidean()).toBe(5);
    expect(a.euclidean()).toBe(a.length());
  });

  it('distanceTo/euclideanTo', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(4, 6);

    expect(a.euclideanTo(b)).toBe(5);
    expect(a.euclideanTo(b)).toBe(a.distanceTo(b));
  });

  it('manhattan', () => {
    const a = Vec2.new(1, 2);
    expect(a.manhattan()).toBe(3);
  });

  it('manhattanTo', () => {
    const a = Vec2.new(1, 2);
    const b = Vec2.new(4, 6);
    expect(a.manhattanTo(b)).toBe(7);
  });

  it('normalize', () => {
    const a = Vec2.new(3, 4);
    a.normalize();
    expect(a).toEqual({ x: 0.6, y: 0.8 });
  });

  it('angle', () => {
    const a = Vec2.new(1, 0);
    expect(a.angle()).toBe(0);

    const b = Vec2.new(0, 1);
    expect(b.angle()).toBe(Math.PI / 2);

    const c = Vec2.new(-1, 0);
    expect(c.angle()).toBe(Math.PI);

    const d = Vec2.new(0, -1);
    expect(d.angle()).toBe((3 * Math.PI) / 2);
  });

  it('angleTo', () => {
    const a = Vec2.new(1, 0);
    const b = Vec2.new(0, 1);
    expect(a.angleTo(b)).toBe(Math.PI / 2);

    const c = Vec2.new(-1, 0);
    expect(a.angleTo(c)).toBe(Math.PI);

    const d = Vec2.new(0, -1);
    expect(a.angleTo(d)).toBe(Math.PI / 2);
  });

  it('rotate', () => {
    const a = Vec2.new(1, 0);
    a.rotate(Math.PI / 2);

    expect(a.x).closeTo(0, Number.EPSILON);
    expect(a.y).closeTo(1, Number.EPSILON);
  });

  it('rotateAround', () => {
    const a = Vec2.new(1, 0);
    const center = Vec2.new(0, 0);

    a.rotateAround(center, Math.PI / 2);

    expect(a.x).closeTo(0, Number.EPSILON);
    expect(a.y).closeTo(1, Number.EPSILON);
  });

  it('lerp', () => {
    const a = Vec2.new(2, 0);
    const b = Vec2.new(0, 3);
    const c = Vec2.new();

    expect(c.lerp(a, b, 0)).toEqual(a);
    expect(c.lerp(a, b, 0.5)).toEqual(Vec2.new(1, 1.5));
    expect(c.lerp(a, b, 1)).toEqual(b);
  });

  it('applyMat3', () => {
    const a = Vec2.new(2, 3);
    const m = new Mat3().set(2, 3, 5, 7, 11, 13, 17, 19, 23);

    a.applyMat3(m);

    expect(a.x).toBe(18);
    expect(a.y).toBe(60);
  });

  it('intoArray/fromArray', () => {
    const a = Vec2.new(1, 2);
    const array = a.intoArray();
    expect(array).toEqual([1, 2]);

    const b = Vec2.new();
    b.fromArray(array);
    expect(b).toEqual({ x: 1, y: 2 });
  });

  it('fromAttribute', () => {
    const a = Vec2.new();
    const attribute = new BufferAttribute(new Float32Array([1, 2, 3, 4]), 2);

    a.fromAttribute(attribute, 0);
    expect(a).toEqual({ x: 1, y: 2 });

    a.fromAttribute(attribute, 1);
    expect(a).toEqual({ x: 3, y: 4 });
  });
});
