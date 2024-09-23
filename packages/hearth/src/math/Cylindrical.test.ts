import { describe, expect, it } from 'vitest';
import { Vec3 } from './Vec3.js';
import { Cylindrical } from './Cylindrical.js';

describe('Math - Cylindrical', () => {
  it('Instancing', () => {
    const cylindrical = Cylindrical.empty();
    expect(cylindrical).toEqual({ radius: 0, theta: 0, height: 0 });

    const radius = 10.0;
    const theta = Math.PI;
    const height = 5;
    expect(cylindrical.set(radius, theta, height)).toBe(cylindrical);
    expect(cylindrical).toEqual({ radius, theta, height });

    const cloned = Cylindrical.clone(cylindrical);
    expect(cloned).not.toBe(cylindrical);
    expect(cloned).toEqual(cylindrical);
  });

  it('fromCartesian', () => {
    const a = Cylindrical.new(1, 1, 1);
    const b = Vec3.new(0, 0, 0);
    const c = Vec3.new(3, -1, -3);
    const expected = Cylindrical.new(Math.sqrt(9 + 9), Math.atan2(3, -3), -1);

    expect(a.fromCoord(b)).toBe(a);
    expect(a).toEqual({ radius: 0, theta: 0, height: 0 });

    expect(a.fromCoord(c)).toBe(a);
    expect(a.radius).closeTo(expected.radius, Number.EPSILON);
    expect(a.theta).closeTo(expected.theta, Number.EPSILON);
    expect(a.height).closeTo(expected.height, Number.EPSILON);
  });
});
