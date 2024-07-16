import { describe, expect, it } from 'vitest';
import { Vec3 } from './Vector3.ts';
import { Vec2 } from './Vector2.ts';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { Spherical } from '@modules/renderer/engine/math/Spherical.js';
import { Euler } from './Euler.ts';
import { Cylindrical } from '@modules/renderer/engine/math/Cylindrical.js';
import { Color } from './Color.ts';
import { Matrix4 } from './Matrix4.ts';
import { Matrix3 } from './Matrix3.ts';
import { Quaternion } from './Quaternion.ts';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.ts';

const { vec3 } = Vec3;
const { vec2 } = Vec2;

const closeTo = (a: Vec3, b: Vec3, epsilon = Number.EPSILON) => {
  expect(a.x).closeTo(b.x, epsilon);
  expect(a.y).closeTo(b.y, epsilon);
  expect(a.z).closeTo(b.z, epsilon);
};

describe('Math - Vec3', () => {
  it('Instancing', () => {
    const vec = Vec3.empty();
    expect(vec).toEqual({ x: 0, y: 0, z: 0 });

    Vec3.set(vec, 2, 3, 4);
    expect(vec).toEqual({ x: 2, y: 3, z: 4 });

    const clone = Vec3.clone(vec);
    expect(clone).not.toBe(vec);
    expect(clone).toEqual(vec);

    const item = vec2(1, 2);
    expect(Vec3.is(item)).toBe(false);
  });

  it('equals', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(2, 3, 4);
    const c = vec3(4, 3, 2);

    expect(Vec3.equals(a, b)).toBe(true);
    expect(Vec3.equals(a, c)).toBe(false);
  });

  it('negate', () => {
    const a = vec3(2, 3, 4);

    Vec3.negate(a);
    expect(a).toEqual(vec3(-2, -3, -4));

    const b = Vec3.negated(a);
    expect(b).toEqual(vec3(2, 3, 4));
  });

  it('clamp', () => {
    const a = vec3(2, 3, 4);
    const min = vec3(3, 3, 3);
    const max = vec3(5, 5, 5);

    Vec3.clamp(a, min, max);
    expect(a).toEqual(vec3(3, 3, 4));

    const b = Vec3.clamped(a, min, max);
    expect(b).toEqual(vec3(3, 3, 4));
  });

  it('scale', () => {
    const a = vec3(2, 3, 4);
    const s = 2;

    Vec3.scale(a, s);
    expect(a).toEqual(vec3(4, 6, 8));

    const b = Vec3.scaled(a, s);
    expect(b).toEqual(vec3(8, 12, 16));
  });

  it('add', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    Vec3.add(a, b);
    expect(a).toEqual(Vec3.empty());

    const c = Vec3.added(a, b);
    expect(c).toEqual(b);
  });

  it('addScaled', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);
    const s = 2;

    Vec3.addScaled(a, b, s);
    expect(a).toEqual(b);

    const c = Vec3.addScaled(a, b, s);
    expect(c).toEqual(vec3(-6, -9, -12));
  });

  it('sub', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    Vec3.sub(a, b);
    expect(a).toEqual(vec3(4, 6, 8));

    const c = Vec3.subbed(a, b);
    expect(c).toEqual(vec3(6, 9, 12));
  });

  it('subScaled', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);
    const s = 2;

    Vec3.subScaled(a, b, s);
    expect(a).toEqual(vec3(6, 9, 12));

    const c = Vec3.subScaled(a, b, s);
    expect(c).toEqual(vec3(10, 15, 20));
  });

  it('mul', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    Vec3.mul(a, b);
    expect(a).toEqual(vec3(-4, -9, -16));

    const c = Vec3.mulled(a, b);
    expect(c).toEqual(vec3(8, 27, 64));
  });

  it('div', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    Vec3.div(a, b);
    expect(a).toEqual(vec3(-1, -1, -1));

    const c = Vec3.dived(a, b);
    expect(c).toEqual(vec3(0.5, 0.3333333333333333, 0.25));
  });

  it('invScale', () => {
    const a = vec3(2, 3, 4);
    const s = 2;

    Vec3.divScalar(a, s);
    expect(a).toEqual(vec3(1, 1.5, 2));

    const b = Vec3.divScalar(a, s);
    expect(b).toEqual(vec3(0.5, 0.75, 1));
  });

  it('min', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    Vec3.min(a, b);
    expect(a).toEqual(vec3(-2, -3, -4));

    const c = Vec3.mined(a, b);
    expect(c).toEqual(vec3(-2, -3, -4));
  });

  it('max', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    Vec3.max(a, b);
    expect(a).toEqual(vec3(2, 3, 4));

    const c = Vec3.maxed(a, b);
    expect(c).toEqual(vec3(2, 3, 4));
  });

  it('floor', () => {
    const a = vec3(2.1, 3.9, 4.5);

    Vec3.floor(a);
    expect(a).toEqual(vec3(2, 3, 4));

    const b = Vec3.floored(a);
    expect(b).toEqual(vec3(2, 3, 4));
  });

  it('ceil', () => {
    const a = vec3(2.1, 3.9, 4.5);

    Vec3.ceil(a);
    expect(a).toEqual(vec3(3, 4, 5));

    const b = Vec3.ceiled(a);
    expect(b).toEqual(vec3(3, 4, 5));
  });

  it('round', () => {
    const a = vec3(2.1, 3.9, 4.5);

    Vec3.round(a);
    expect(a).toEqual(vec3(2, 4, 5));

    const b = Vec3.rounded(a);
    expect(b).toEqual(vec3(2, 4, 5));
  });

  it('trunc', () => {
    const a = vec3(2.1, 3.9, 4.5);

    Vec3.trunc(a);
    expect(a).toEqual(vec3(2, 3, 4));

    const b = Vec3.trunced(a);
    expect(b).toEqual(vec3(2, 3, 4));
  });

  it('cross', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    Vec3.cross(a, b);
    expect(a).toEqual(vec3(0, 0, 0));

    const c = Vec3.crossed(a, b);
    expect(c).toEqual(vec3(0, 0, 0));

    const d = vec3(1, 0, 0);
    const e = vec3(0, 1, 0);

    Vec3.cross(d, e);
    expect(d).toEqual(vec3(0, 0, 1));
  });

  it('dot', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);

    const result = Vec3.dot(a, b);
    expect(result).toEqual(-29);
  });

  it('normalize', () => {
    const a = vec3(2, 3, 4);

    Vec3.normalize(a);
    expect(a).toEqual(vec3(0.3713906763541037, 0.5570860145311556, 0.7427813527082074));

    const b = Vec3.normalized(a);
    expect(b).toEqual(vec3(0.3713906763541037, 0.5570860145311556, 0.7427813527082074));
  });

  it('length', () => {
    const a = vec3(2, 3, 4);

    const result = Vec3.length(a);
    expect(result).toEqual(Math.sqrt(29));

    const b = Vec3.lengthSq(a);
    expect(b).toEqual(29);
  });

  it('manhattanLength', () => {
    const a = vec3(2, 3, 4);

    const result = Vec3.manhattanLength(a);
    expect(result).toEqual(9);
  });

  it('distanceTo', () => {
    const a = vec3(1, 2, 3);
    const b = vec3(2, 3, 4);

    const result = Vec3.distanceTo(a, b);
    expect(result).toEqual(Math.sqrt(3));

    const c = Vec3.distanceSqTo(a, b);
    expect(c).toEqual(3);
  });

  it('manhattanDistanceTo', () => {
    const a = vec3(1, 2, 3);
    const b = vec3(2, 3, 4);

    const result = Vec3.manhattanDistanceTo(a, b);
    expect(result).toEqual(3);
  });

  it('lerp', () => {
    const a = vec3(2, 3, 4);
    const b = vec3(-2, -3, -4);
    const t = 0.5;

    Vec3.lerp(a, b, t);
    expect(a).toEqual(vec3(0, 0, 0));

    const c = Vec3.lerped(a, b, t);
    expect(c).toEqual(vec3(-1, -1.5, -2));
  });

  it('fillArray', () => {
    const a = Vec3.empty();
    const array = [0, 2, 3, 4];

    Vec3.fillArray(a, array, 1);
    expect(a).toEqual(vec3(2, 3, 4));

    Vec3.intoArray_(a, 0, array);
    expect(array).toEqual([2, 3, 4, 4]);
  });

  it('fillAttribute', () => {
    const attribute = new BufferAttribute(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), 3);

    const a = Vec3.empty();
    Vec3.fillAttribute(a, attribute, 0);
    expect(a).toEqual(vec3(1, 2, 3));
    Vec3.fillAttribute(a, attribute, 1);
    expect(a).toEqual(vec3(4, 5, 6));
    Vec3.fillAttribute(a, attribute, 2);
    expect(a).toEqual(vec3(7, 8, 9));

    Vec3.intoAttribute_(a, 0, attribute);
    expect(attribute.array).toEqual(new Float32Array([7, 8, 9, 4, 5, 6, 7, 8, 9]));
  });

  it('fillSpherical', () => {
    const coord = Vec3.empty();
    const expected = vec3(1, 0, 1);

    const spherical = Spherical.fromCartesian(expected);
    Vec3.fillSpherical(coord, spherical);

    closeTo(coord, expected);
  });

  it('fillCylindrical', () => {
    const coord = Vec3.empty();
    const expected = vec3(1, 0, 1);

    const cylindrical = Cylindrical.fromCartesian(expected);
    Vec3.fillCylindrical(coord, cylindrical);

    closeTo(coord, expected);
  });

  it('fillEuler', () => {
    const coord = Vec3.empty();
    const expected = vec3(1, 0, 1);

    const euler = Euler.fromVec(expected);
    Vec3.fillEuler(coord, euler);

    closeTo(coord, expected);
  });

  it('fillColor', () => {
    const coord = Vec3.empty();
    const expected = vec3(1, 0, 1);

    Vec3.fillColor(coord, new Color(1, 0, 1));

    closeTo(coord, expected);
  });

  it('fillMat4Position', () => {
    const coord = Vec3.empty();
    const expected = vec3(1, 0, 1);

    const m = new Matrix4().setPosition(expected);
    Vec3.fillMat4Position(coord, m);

    closeTo(coord, expected);
  });

  it('fillMat4Column', () => {
    const coord = Vec3.empty();
    const expected = vec3(1, 5, 9);

    const m = new Matrix4().set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
    Vec3.fillMat4Column(coord, m, 0);

    closeTo(coord, expected);
  });

  it('applyMat3', () => {
    const a = vec3(2, 3, 4);
    const m = new Matrix3().set(2, 3, 5, 7, 11, 13, 17, 19, 23);
    const expected = vec3(33, 99, 183);

    Vec3.applyMat3(a, m);
    closeTo(a, expected);
  });

  it('applyMat4', () => {
    const a = vec3(2, 3, 4);
    const expected = vec3(2, -3, -4);
    const m = new Matrix4().makeRotationX(Math.PI);

    Vec3.applyMat4(a, m);
    closeTo(a, expected, Number.EPSILON * 2);
  });

  it('applyQuaternion', () => {
    const a = vec3(2, 3, 4);
    const expected = vec3(2, 3, 4);

    Vec3.applyQuaternion(a, Quaternion.identity());
    expect(a).toEqual(expected);
  });

  it('applyAxisAngle', () => {
    const a = vec3(2, 3, 4);
    const axis = vec3(0, 1, 0);
    const angle = Math.PI / 4.0;
    const expected = vec3(3 * Math.sqrt(2), 3, Math.sqrt(2));

    Vec3.applyAxisAngle(a, axis, angle);
    closeTo(a, expected, Number.EPSILON * 4);
  });

  it('transformDirection', () => {
    const a = vec3(2, 3, 4);
    const m = new Matrix4();
    const expected = vec3(0.3713906763541037, 0.5570860145311556, 0.7427813527082074);

    Vec3.transformDirection(a, m);
    closeTo(a, expected);
  });

  it('project/unproject', () => {
    const a = vec3(2, 3, 4);
    const camera = new PerspectiveCamera(75, 16 / 9, 0.1, 300.0);
    const expected = vec3(-0.36653213611158914, -0.9774190296309043, 1.0506835611870624);

    Vec3.project(a, camera);
    closeTo(a, expected);

    Vec3.unproject(a, camera);
    closeTo(a, vec3(2, 3, 4), Number.EPSILON * 4);
  });

  it('angleTo', () => {
    const a = vec3(0, 0, 4);
    const b = vec3(0, 0, -4);

    const result = Vec3.angleTo(a, b);
    expect(result).toEqual(Math.PI);

    const x = vec3(1, 0, 0);
    const y = vec3(0, 1, 0);
    const z = vec3(0, 0, 1);

    expect(Vec3.angleTo(x, y)).toEqual(Math.PI / 2);
    expect(Vec3.angleTo(x, z)).toEqual(Math.PI / 2);
    expect(Vec3.angleTo(z, x)).toEqual(Math.PI / 2);
  });

  it('reflect', () => {
    const a = Vec3.create(0, -1, 0);
    const normal = vec3(0, 1, 0);

    Vec3.reflect(a, normal);
    expect(a).toEqual(vec3(0, 1, 0));

    Vec3.reflect(a, normal);
    expect(a).toEqual(vec3(0, -1, 0));

    Vec3.set(a, 1, -1, 0);
    Vec3.reflect(a, normal);
    expect(a).toEqual(vec3(1, 1, 0));

    Vec3.set(a, 1, -1, 0);
    Vec3.set(normal, 0, -1, 0);
    Vec3.reflect(a, normal);
    expect(a).toEqual(vec3(1, 1, 0));
  });

  it('clampScalar', () => {
    const a = vec3(-0.01, 0.5, 1.5);
    const clamped = vec3(0.1, 0.5, 1.0);

    Vec3.clampScalar(a, 0.1, 1.0);
    expect(a).toEqual(clamped);

    Vec3.set(a, -0.01, 0.5, 1.5);
    Vec3.clampScalar(a, 0.1, 1.0);
    expect(a).toEqual(clamped);
  });

  it('clampLength', () => {
    const a = vec3(2, 3, 4);
    const expected = vec3(1.4866068747318506, 2.229910312097776, 2.973213749463701);

    const len = Vec3.length(a);
    expect(len).toEqual(Math.sqrt(29));

    Vec3.clampLength(a, 3, 5);

    const result = Vec3.length(a);
    expect(result).toBeGreaterThanOrEqual(3);
    expect(result).toBeLessThanOrEqual(5);
  });

  it('setLength', () => {
    let a = vec3(2, 0, 0);

    expect(Vec3.length(a)).toEqual(2);
    Vec3.setLength(a, 5);
    expect(Vec3.length(a)).toEqual(5);

    a = Vec3.empty();
    expect(Vec3.length(a)).toEqual(0);
    Vec3.setLength(a, 5);
    expect(Vec3.length(a)).toEqual(0);
  });

  it('projectVec', () => {
    const normal = vec3(10, 0, 0);

    closeTo(Vec3.projectVec(vec3(1, 0, 0), normal), vec3(1, 0, 0));
    closeTo(Vec3.projectVec(vec3(0, 1, 0), normal), vec3(0, 0, 0));
    closeTo(Vec3.projectVec(vec3(0, 0, -1), normal), vec3(0, 0, 0));
    closeTo(Vec3.projectVec(vec3(-1, 0, 0), normal), vec3(-1, 0, 0));
  });

  it('projectPlane', () => {
    const normal = vec3(1, 0, 0);

    closeTo(Vec3.projectPlane(vec3(1, 0, 0), normal), vec3(0, 0, 0));
    closeTo(Vec3.projectPlane(vec3(0, 1, 0), normal), vec3(0, 1, 0));
    closeTo(Vec3.projectPlane(vec3(0, 0, -1), normal), vec3(0, 0, -1));
    closeTo(Vec3.projectPlane(vec3(-1, 0, 0), normal), vec3(0, 0, 0));
  });
});
