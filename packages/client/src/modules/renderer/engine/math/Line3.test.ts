/* global QUnit */

import { describe, expect, it } from 'vitest';
import { Line3_ } from './Line3.ts';

describe('Math - Line3', () => {
  it.only('Instancing', () => {
    let line = Line3_.empty();
    expect(line).toEqual({ start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: 0, z: 0 } });

    line = Line3_.create(1, 2, 3, 4, 5, 6);
    expect(line).toEqual({ start: { x: 1, y: 2, z: 3 }, end: { x: 4, y: 5, z: 6 } });

    const clone = Line3_.clone(line);
    expect(clone).not.toBe(line);
    expect(clone.start).not.toBe(line.start);
    expect(clone.end).not.toBe(line.end);
    expect(clone).toEqual({ start: { x: 1, y: 2, z: 3 }, end: { x: 4, y: 5, z: 6 } });

    const copy = Line3_.copy(line);
    expect(copy).not.toBe(line);
    expect(copy.start).toBe(line.start);
    expect(copy.end).toBe(line.end);

    Line3_.set(line, 7, 8, 9, 10, 11, 12);
    expect(line).toEqual({ start: { x: 7, y: 8, z: 9 }, end: { x: 10, y: 11, z: 12 } });
    expect(copy).toEqual(line);

    expect(Line3_.equals(line, copy)).toBe(true);
    expect(Line3_.equals(line, clone)).toBe(false);
  });

  it.only('center', () => {
    const line = Line3_.create(0, 0, 0, 2, 2, 2);
    const center = Line3_.center(line);

    expect(center).toEqual({ x: 1, y: 1, z: 1 });
  });

  it.only('delta', () => {
    const line = Line3_.create(0, 0, 0, 2, 2, 2);
    const delta = Line3_.delta(line);

    expect(delta).toEqual({ x: 2, y: 2, z: 2 });
  });

  it.only('distance/distanceSq', () => {
    const line = Line3_.create(0, 0, 0, 3, 3, 3);
    const distanceSq = Line3_.distanceSq(line);
    const distance = Line3_.distance(line);
    expect(distance).toBe(Math.sqrt(27));
    expect(distanceSq).toBe(27);
  });

  it('at', () => {
    const a = new Line3(one3.clone(), new Vector3(1, 1, 2));
    const point = new Vector3();

    a.at(-1, point);
    assert.ok(point.distanceTo(new Vector3(1, 1, 0)) < 0.0001, 'Passed!');
    a.at(0, point);
    assert.ok(point.distanceTo(one3.clone()) < 0.0001, 'Passed!');
    a.at(1, point);
    assert.ok(point.distanceTo(new Vector3(1, 1, 2)) < 0.0001, 'Passed!');
    a.at(2, point);
    assert.ok(point.distanceTo(new Vector3(1, 1, 3)) < 0.0001, 'Passed!');
  });

  it('closestAt/closestTo/at', () => {
    const a = new Line3(one3.clone(), new Vector3(1, 1, 2));
    const point = new Vector3();

    // nearby the ray
    assert.ok(a.closestPointToPointParameter(zero3.clone(), true) == 0, 'Passed!');
    a.closestPointToPoint(zero3.clone(), true, point);
    assert.ok(point.distanceTo(new Vector3(1, 1, 1)) < 0.0001, 'Passed!');

    // nearby the ray
    assert.ok(a.closestPointToPointParameter(zero3.clone(), false) == -1, 'Passed!');
    a.closestPointToPoint(zero3.clone(), false, point);
    assert.ok(point.distanceTo(new Vector3(1, 1, 0)) < 0.0001, 'Passed!');

    // nearby the ray
    assert.ok(a.closestPointToPointParameter(new Vector3(1, 1, 5), true) == 1, 'Passed!');
    a.closestPointToPoint(new Vector3(1, 1, 5), true, point);
    assert.ok(point.distanceTo(new Vector3(1, 1, 2)) < 0.0001, 'Passed!');

    // exactly on the ray
    assert.ok(a.closestPointToPointParameter(one3.clone(), true) == 0, 'Passed!');
    a.closestPointToPoint(one3.clone(), true, point);
    assert.ok(point.distanceTo(one3.clone()) < 0.0001, 'Passed!');
  });

  it('applyMat4', () => {
    const a = new Line3(zero3.clone(), two3.clone());
    const b = new Vector4(two3.x, two3.y, two3.z, 1);
    const m = new Matrix4().makeTranslation(x, y, z);
    const v = new Vector3(x, y, z);

    a.applyMatrix4(m);
    assert.ok(a.start.equals(v), 'Translation: check start');
    assert.ok(a.end.equals(new Vector3(2 + x, 2 + y, 2 + z)), 'Translation: check start');

    // reset starting conditions
    a.set(zero3.clone(), two3.clone());
    m.makeRotationX(Math.PI);

    a.applyMatrix4(m);
    b.applyMatrix4(m);

    assert.ok(a.start.equals(zero3), 'Rotation: check start');
    assert.numEqual(a.end.x, b.x / b.w, 'Rotation: check end.x');
    assert.numEqual(a.end.y, b.y / b.w, 'Rotation: check end.y');
    assert.numEqual(a.end.z, b.z / b.w, 'Rotation: check end.z');

    // reset starting conditions
    a.set(zero3.clone(), two3.clone());
    b.set(two3.x, two3.y, two3.z, 1);
    m.setPosition(v);

    a.applyMatrix4(m);
    b.applyMatrix4(m);

    assert.ok(a.start.equals(v), 'Both: check start');
    assert.numEqual(a.end.x, b.x / b.w, 'Both: check end.x');
    assert.numEqual(a.end.y, b.y / b.w, 'Both: check end.y');
    assert.numEqual(a.end.z, b.z / b.w, 'Both: check end.z');
  });
});
