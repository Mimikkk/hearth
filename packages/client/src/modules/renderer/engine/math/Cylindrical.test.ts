import { describe, expect, it } from 'vitest';
import { IVec3 } from './Vector3.js';
import { Cylindrical } from './Cylindrical.js';
import vec3 = IVec3.vec3;

describe('Math - Cylindrical', () => {
  it('Instancing', () => {
    const cylindrical = Cylindrical.empty();
    expect(cylindrical).toEqual({ radius: 0, theta: 0, height: 0 });

    const radius = 10.0;
    const theta = Math.PI;
    const height = 5;

    expect(cylindrical.fill(radius, theta, height)).toBe(cylindrical);
    expect(cylindrical).toEqual(Cylindrical.new(radius, theta, height));

    const cloned = cylindrical.clone();
    expect(cloned).not.toBe(cylindrical);
    expect(cloned).toEqual(cylindrical);
  });

  it('fromCartesian', () => {
    const cylindrical = Cylindrical.new(1, 1, 1);
    const expected = Cylindrical.new(Math.sqrt(9 + 9), Math.atan2(3, -3), -1);

    expect(cylindrical.fillCartesian(vec3(0, 0, 0))).toBe(cylindrical);
    expect(cylindrical).toEqual(Cylindrical.new(0, 0, 0));

    expect(cylindrical.fillCartesian(vec3(3, -1, -3))).toBe(cylindrical);
    expect(cylindrical.radius).closeTo(expected.radius, Number.EPSILON);
    expect(cylindrical.theta).closeTo(expected.theta, Number.EPSILON);
    expect(cylindrical.height).closeTo(expected.height, Number.EPSILON);
  });
});
