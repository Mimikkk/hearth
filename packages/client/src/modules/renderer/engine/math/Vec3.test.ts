import { describe, expect, it } from 'vitest';
import { Vec3 } from './Vec3.ts';
import { Vec2 } from './Vec2.ts';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { Spherical } from '@modules/renderer/engine/math/Spherical.js';
import { Euler } from './Euler.ts';
import { Cylindrical } from '@modules/renderer/engine/math/Cylindrical.js';
import { Color } from './Color.ts';
import { Mat4 } from './Mat4.ts';
import { Mat3 } from './Mat3.ts';
import { Quaternion } from './Quaternion.ts';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.ts';

const vec3 = Vec3.new;
const vec2 = Vec2.new;

const closeTo = (a: Vec3, b: Vec3, epsilon = Number.EPSILON) => {
  expect(a.x).closeTo(b.x, epsilon);
  expect(a.y).closeTo(b.y, epsilon);
  expect(a.z).closeTo(b.z, epsilon);
};

describe('Math - Vec3', () => {
  it('Instancing', () => {
    const vec = Vec3.empty();
    expect(vec).toEqual({ x: 0, y: 0, z: 0 });

    vec.set(2, 3, 4);
    expect(vec).toEqual({ x: 2, y: 3, z: 4 });

    const clone = Vec3.clone(vec);
    expect(clone).not.toBe(vec);
    expect(clone).toEqual(vec);

    const v2 = vec2(1, 2);
    expect(Vec3.is(v2)).toBe(false);

    const v3 = vec3(1, 2, 1);
    expect(Vec3.is(v3)).toBe(true);
  });

  it('equals', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(2, 3, 4);
    const c = vec3(4, 3, 2);

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('negate', () => {
    const a = vec3(2, 3, 4);

    expect(a.negate()).toEqual(vec3(-2, -3, -4));
  });

  it('clamp', () => {
    const a = vec3(2, 3, 4);
    const min = vec3(3, 3, 3);
    const max = vec3(5, 5, 5);

    expect(a.clamp(min, max)).toEqual(vec3(3, 3, 4));
  });

  it('scale', () => {
    const a = vec3(2, 3, 4);
    const s = 2;

    expect(a.scale(s)).toEqual(vec3(4, 6, 8));
  });

  it('add', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    expect(a.add(b)).toEqual(vec3(0, 0, 0));
  });

  it('addScaled', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);
    const s = 2;

    expect(a.addScaled(b, s)).toEqual(vec3(-2, -3, -4));
  });

  it('sub', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    expect(a.sub(b)).toEqual(vec3(4, 6, 8));
  });

  it('subScaled', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);
    const s = 2;

    expect(a.subScaled(b, s)).toEqual(vec3(6, 9, 12));
  });

  it('mul', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    expect(a.mul(b)).toEqual(vec3(-4, -9, -16));
  });

  it('div', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    expect(a.div(b)).toEqual(vec3(-1, -1, -1));
  });

  it('invScale', () => {
    const a = vec3(2, 3, 4);
    const s = 2;

    expect(a.divScalar(s)).toEqual(vec3(1, 1.5, 2));
  });

  it('min', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    expect(a.min(b)).toEqual(vec3(-2, -3, -4));
  });

  it('max', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    expect(a.max(b)).toEqual(vec3(2, 3, 4));
  });

  it('floor', () => {
    const a = vec3(2.1, 3.9, 4.5);

    expect(a.floor()).toEqual(vec3(2, 3, 4));
  });

  it('ceil', () => {
    const a = vec3(2.1, 3.9, 4.5);

    expect(a.ceil()).toEqual(vec3(3, 4, 5));
  });

  it('round', () => {
    const a = vec3(2.1, 3.9, 4.5);

    expect(a.round()).toEqual(vec3(2, 4, 5));
  });

  it('truncate', () => {
    const a = vec3(2.1, 3.9, 4.5);

    expect(a.truncate()).toEqual(vec3(2, 3, 4));
  });

  it('cross', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    expect(a.cross(b)).toEqual(vec3(0, 0, 0));

    const d = vec3(1, 0, 0);
    const e = vec3(0, 1, 0);

    expect(d.cross(e)).toEqual(vec3(0, 0, 1));
  });

  it('dot', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    expect(a.dot(b)).toEqual(-29);
  });

  it('normalize', () => {
    const a = vec3(2, 3, 4);

    expect(a.normalize()).toEqual(vec3(0.3713906763541037, 0.5570860145311556, 0.7427813527082074));
  });

  it('length/euclidean', () => {
    const a = vec3(2, 3, 4);

    expect(a.length()).toEqual(Math.sqrt(29));
    expect(a.lengthSq()).toEqual(29);
  });

  it('manhattan', () => {
    const a = vec3(2, 3, 4);

    expect(a.manhattan()).toEqual(9);
  });

  it('distanceTo/euclideanTo', () => {
    const a = vec3(1, 2, 3);
    const b = vec3(2, 3, 4);

    expect(a.distanceTo(b)).toEqual(Math.sqrt(3));
    expect(a.distanceSqTo(b)).toEqual(3);
  });

  it('manhattanTo', () => {
    const a = vec3(1, 2, 3);
    const b = vec3(2, 3, 4);

    expect(a.manhattanTo(b)).toEqual(3);
  });

  it('lerp', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);
    const c = vec3();

    expect(c.lerp(a, b, 0)).toEqual(a);
    expect(c.lerp(a, b, 0.5)).toEqual(vec3(0, 0, 0));
    expect(c.lerp(a, b, 1)).toEqual(b);
  });

  it('fromArray/intoArray', () => {
    const a = vec3();
    const array = [0, 2, 3, 4];

    expect(a.fromArray(array, 1)).toEqual(vec3(2, 3, 4));
    expect(a.intoArray(array, 0)).toEqual([2, 3, 4, 4]);
  });

  it('fromAttribute/fillAttribute', () => {
    const attribute = new BufferAttribute(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), 3);

    const a = vec3();
    expect(a.fromAttribute(attribute, 0)).toEqual(vec3(1, 2, 3));
    expect(a.fromAttribute(attribute, 1)).toEqual(vec3(4, 5, 6));
    expect(a.fromAttribute(attribute, 2)).toEqual(vec3(7, 8, 9));
    a.fillAttribute(attribute, 0);
  });

  it('fromSpherical/intoSpherical', () => {
    const coord = vec3();
    const expected = vec3(1, 0, 1);

    const spherical = Spherical.fromCoord(expected);
    closeTo(coord.fromSpherical(spherical), expected, Number.EPSILON * 4);
  });

  it('fromCylindrical/intoCylindrical', () => {
    const coord = vec3();
    const expected = vec3(1, 0, 1);

    const cylindrical = Cylindrical.fromCoord(expected);
    closeTo(coord.fromCylindrical(cylindrical), expected, Number.EPSILON * 4);
  });

  it('fromEuler', () => {
    const coord = vec3();
    const expected = vec3(1, 0, 1);

    const euler = Euler.fromVec(expected);
    expect(coord.fromEuler(euler)).toEqual(expected);
  });

  it('fromColor', () => {
    const coord = vec3();
    const expected = vec3(1, 0, 1);

    expect(coord.fromColor(new Color(1, 0, 1))).toEqual(expected);
  });

  it('fromMat4Position', () => {
    const coord = vec3();
    const expected = vec3(1, 0, 1);

    const m = new Mat4().setPosition(expected);
    expect(coord.fromMat4Position(m)).toEqual(expected);
  });

  it('fromMat4Column', () => {
    const coord = vec3();
    const expected = vec3(1, 5, 9);

    const m = new Mat4().set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
    expect(coord.fromMat4Column(m, 0)).toEqual(expected);
  });

  it('applyMat3', () => {
    const a = vec3(2, 3, 4);
    const m = new Mat3().set(2, 3, 5, 7, 11, 13, 17, 19, 23);
    const expected = vec3(33, 99, 183);

    expect(a.applyMat3(m)).toEqual(expected);
  });

  it('applyMat4', () => {
    const a = vec3(2, 3, 4);
    const expected = vec3(2, -3, -4);
    const m = new Mat4().makeRotationX(Math.PI);

    closeTo(a.applyMat4(m), expected, Number.EPSILON * 4);
  });

  it('applyQuaternion', () => {
    const a = vec3(2, 3, 4);
    const expected = vec3(2, 3, 4);

    a.applyQuaternion(Quaternion.identity());
    expect(a).toEqual(expected);
  });

  it('applyAxisAngle', () => {
    const a = vec3(2, 3, 4);
    const axis = vec3(0, 1, 0);
    const angle = Math.PI / 4.0;
    const expected = vec3(3 * Math.sqrt(2), 3, Math.sqrt(2));

    a.applyAxisAngle(axis, angle);
    closeTo(a, expected, Number.EPSILON * 4);
  });

  it('transformDirection', () => {
    const a = vec3(2, 3, 4);
    const m = new Mat4();
    const expected = vec3(0.3713906763541037, 0.5570860145311556, 0.7427813527082074);

    a.transformDirection(m);
    closeTo(a, expected);
  });

  it('project/unproject', () => {
    const a = vec3(2, 3, 4);
    const camera = new PerspectiveCamera(75, 16 / 9, 0.1, 300.0);
    const expected = vec3(-0.36653213611158914, -0.9774190296309043, 1.0506835611870624);

    a.project(camera);
    closeTo(a, expected);

    a.unproject(camera);
    closeTo(a, vec3(2, 3, 4), Number.EPSILON * 4);
  });

  it('angleTo', () => {
    const a = vec3(0, 0, 4);
    const b = vec3(0, 0, -4);

    const result = a.angleTo(b);
    expect(result).toEqual(Math.PI);

    const x = vec3(1, 0, 0);
    const y = vec3(0, 1, 0);
    const z = vec3(0, 0, 1);

    expect(x.angleTo(y)).toEqual(Math.PI / 2);
    expect(x.angleTo(z)).toEqual(Math.PI / 2);
    expect(z.angleTo(x)).toEqual(Math.PI / 2);
  });

  it('reflect', () => {
    const a = vec3(0, -1, 0);
    const normal = vec3(0, 1, 0);

    a.reflect(normal);
    expect(a).toEqual(vec3(0, 1, 0));

    a.reflect(normal);
    expect(a).toEqual(vec3(0, -1, 0));

    a.set(1, -1, 0);
    a.reflect(normal);
    expect(a).toEqual(vec3(1, 1, 0));

    a.set(1, -1, 0);
    normal.set(0, -1, 0);
    a.reflect(normal);
    expect(a).toEqual(vec3(1, 1, 0));
  });

  it('clampScalar', () => {
    const a = vec3(-0.01, 0.5, 1.5);
    const clamped = vec3(0.1, 0.5, 1.0);

    a.clampScalar(0.1, 1.0);
    expect(a).toEqual(clamped);

    a.set(-0.01, 0.5, 1.5);
    a.clampScalar(0.1, 1.0);
    expect(a).toEqual(clamped);
  });

  it('clampLength', () => {
    const a = vec3(2, 3, 4);
    const expected = vec3(1.4866068747318506, 2.229910312097776, 2.973213749463701);

    const len = a.length();
    expect(len).toEqual(Math.sqrt(29));

    a.clampLength(3, 5);

    const result = a.length();
    expect(result).toBeGreaterThanOrEqual(3);
    expect(result).toBeLessThanOrEqual(5);
  });

  it('setLength', () => {
    let a = vec3(2, 0, 0);

    expect(a.length()).toEqual(2);
    a.setLength(5);
    expect(a.length()).toEqual(5);

    a = vec3();
    expect(a.length()).toEqual(0);
    a.setLength(5);
    expect(a.length()).toEqual(0);
  });

  it('projectVec', () => {
    const normal = vec3(10, 0, 0);

    closeTo(vec3(1, 0, 0).projectOnVec(normal), vec3(1, 0, 0));
    closeTo(vec3(0, 1, 0).projectOnVec(normal), vec3(0, 0, 0));
    closeTo(vec3(0, 0, -1).projectOnVec(normal), vec3(0, 0, 0));
    closeTo(vec3(-1, 0, 0).projectOnVec(normal), vec3(-1, 0, 0));
  });

  it('projectPlane', () => {
    const normal = vec3(1, 0, 0);

    closeTo(vec3(1, 0, 0).projectOnPlane(normal), vec3(0, 0, 0));
    closeTo(vec3(0, 1, 0).projectOnPlane(normal), vec3(0, 1, 0));
    closeTo(vec3(0, 0, -1).projectOnPlane(normal), vec3(0, 0, -1));
    closeTo(vec3(-1, 0, 0).projectOnPlane(normal), vec3(0, 0, 0));
  });
});
