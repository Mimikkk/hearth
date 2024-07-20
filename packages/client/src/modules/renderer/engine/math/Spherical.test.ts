import { describe, expect, it } from 'vitest';
import { IVec3, Vector3 } from './Vector3.js';
import { Spherical } from './Spherical.js';

describe('Math - Spherical', () => {
  it('Instancing', () => {
    const spherical = Spherical.empty();
    expect(spherical).toEqual({ radius: 0, phi: 0, theta: 0 });

    const radius = 10.0;
    const phi = Math.acos(-0.5);
    const theta = Math.sqrt(Math.PI) * phi;
    expect(Spherical.set(spherical, radius, phi, theta)).toBe(spherical);
    expect(spherical).toEqual({ radius, phi, theta });

    const cloned = Spherical.clone(spherical);
    expect(cloned).not.toBe(spherical);
    expect(cloned).toEqual(spherical);
  });

  it('clamp', () => {
    const tooLow = 0.0;
    const tooHigh = Math.PI;
    const justRight = 1.5;
    const spherical = Spherical.create(1, tooLow, 0);

    Spherical.clamp(spherical);
    expect(spherical.phi).toBe(Number.EPSILON);

    Spherical.set(spherical, 1, tooHigh, 0);
    Spherical.clamp(spherical);
    expect(spherical.phi).toBe(Math.PI - Number.EPSILON);

    Spherical.set(spherical, 1, justRight, 0);
    Spherical.clamp(spherical);
    expect(spherical.phi).toBe(justRight);
  });

  it('fromCartesian', () => {
    const a = Spherical.create(1, 1, 1);
    const b = IVec3.empty();
    const c = IVec3.create(Math.PI, 1, -Math.PI);
    const expected = Spherical.create(4.554032147688322, 1.3494066171539107, 2.356194490192345);

    expect(Spherical.fillCartesian(a, b)).toBe(a);
    expect(a).toEqual({ radius: 0, phi: 0, theta: 0 });

    expect(Spherical.fillCartesian(a, c)).toBe(a);
    expect(a.radius).closeTo(expected.radius, Number.EPSILON);
    expect(a.phi).closeTo(expected.phi, Number.EPSILON);
    expect(a.theta).closeTo(expected.theta, Number.EPSILON);
  });
});
