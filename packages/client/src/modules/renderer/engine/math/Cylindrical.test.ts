import { describe, expect, it } from 'vitest';
import { IVec3 } from './Vector3.js';
import { Cylindrical } from './Cylindrical.js';

describe('Math - Cylindrical', () => {
  it('Instancing', () => {
    const cylindrical = Cylindrical.empty();
    expect(cylindrical).toEqual({ radius: 0, theta: 0, y: 0 });

    const radius = 10.0;
    const theta = Math.PI;
    const y = 5;
    expect(Cylindrical.set(cylindrical, radius, theta, y)).toBe(cylindrical);
    expect(cylindrical).toEqual({ radius, theta, y });

    const cloned = Cylindrical.clone(cylindrical);
    expect(cloned).not.toBe(cylindrical);
    expect(cloned).toEqual(cylindrical);
  });

  it('fromCartesian', () => {
    const a = Cylindrical.create(1, 1, 1);
    const b = IVec3.create(0, 0, 0);
    const c = IVec3.create(3, -1, -3);
    const expected = Cylindrical.create(Math.sqrt(9 + 9), Math.atan2(3, -3), -1);

    expect(Cylindrical.fillCartesian(a, b)).toBe(a);
    expect(a).toEqual({ radius: 0, theta: 0, y: 0 });

    expect(Cylindrical.fillCartesian(a, c)).toBe(a);
    expect(a.radius).closeTo(expected.radius, Number.EPSILON);
    expect(a.theta).closeTo(expected.theta, Number.EPSILON);
    expect(a.y).closeTo(expected.y, Number.EPSILON);
  });
});
