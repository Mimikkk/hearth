import { describe, expect, it } from 'vitest';
import { Frustum } from './Frustum.ts';
import { Plane_ } from './Plane.ts';
import { Vec3 } from './Vector3.ts';
import { Matrix4 } from './Matrix4.ts';
import { Box3_ } from '@modules/renderer/engine/math/Box3.js';
import { Sphere_ } from './Sphere.ts';
import { Sprite } from '@modules/renderer/engine/objects/Sprite.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { BoxGeometry } from '@modules/renderer/engine/geometries/BoxGeometry.js';

describe('Maths - Frustum', () => {
  it('Instancing', () => {
    let a = Frustum.empty();

    expect(a.planes).toBeDefined();
    expect(a.planes.length).toBe(6);

    const plane = Plane_.empty();
    for (let i = 0; i < 6; i++) {
      expect(a.planes[i]).toEqual(plane);
    }

    const p0 = Plane_.create(1, 0, 0, -1);
    const p1 = Plane_.create(1, 0, 0, 1);
    const p2 = Plane_.create(1, 0, 0, 2);
    const p3 = Plane_.create(1, 0, 0, 3);
    const p4 = Plane_.create(1, 0, 0, 4);
    const p5 = Plane_.create(1, 0, 0, 5);

    a = Frustum.create(p0, p1, p2, p3, p4, p5);
    expect(a.planes[0]).toEqual(p0);
    expect(a.planes[0]).toBe(p0);
    expect(a.planes[1]).toEqual(p1);
    expect(a.planes[1]).toBe(p1);
    expect(a.planes[2]).toEqual(p2);
    expect(a.planes[2]).toBe(p2);
    expect(a.planes[3]).toEqual(p3);
    expect(a.planes[3]).toBe(p3);
    expect(a.planes[4]).toEqual(p4);
    expect(a.planes[4]).toBe(p4);
    expect(a.planes[5]).toEqual(p5);
    expect(a.planes[5]).toBe(p5);

    const p6 = Plane_.create(1, 0, 0, -1);
    const p7 = Plane_.create(1, 0, 0, 1);
    const p8 = Plane_.create(1, 0, 0, 2);
    const p9 = Plane_.create(1, 0, 0, 3);
    const pa = Plane_.create(1, 0, 0, 4);
    const pb = Plane_.create(1, 0, 0, 5);

    Frustum.set(a, p6, p7, p8, p9, pa, pb);
    expect(a.planes[0]).toEqual(p6);
    expect(a.planes[0]).not.toBe(p6);
    expect(a.planes[1]).toEqual(p7);
    expect(a.planes[1]).not.toBe(p7);
    expect(a.planes[2]).toEqual(p8);
    expect(a.planes[2]).not.toBe(p8);
    expect(a.planes[3]).toEqual(p9);
    expect(a.planes[3]).not.toBe(p9);
    expect(a.planes[4]).toEqual(pa);
    expect(a.planes[4]).not.toBe(pa);
    expect(a.planes[5]).toEqual(pb);
    expect(a.planes[5]).not.toBe(pb);

    const b = Frustum.copy(a);
    expect(b.planes).toBe(a.planes);

    const c = Frustum.clone(a);
    expect(c.planes[0]).toEqual(p6);
    expect(c.planes[0]).not.toBe(p6);
    expect(c.planes[1]).toEqual(p7);
    expect(c.planes[1]).not.toBe(p7);
    expect(c.planes[2]).toEqual(p8);
    expect(c.planes[2]).not.toBe(p8);
    expect(c.planes[3]).toEqual(p9);
    expect(c.planes[3]).not.toBe(p9);
    expect(c.planes[4]).toEqual(pa);
    expect(c.planes[4]).not.toBe(pa);
    expect(c.planes[5]).toEqual(pb);
    expect(c.planes[5]).not.toBe(pb);
  });

  it('fromOrthographic/containsVec', () => {
    const mat = new Matrix4().makeOrthographic(0, 1, 1, 0, 1, 5);
    const frustum = Frustum.fromProjection(mat);

    const maxDepth = -5;
    const minDepth = -3;
    const bottom = 0;
    const top = 1;
    const left = 0;
    const right = 1;

    for (let i = maxDepth; i <= minDepth; i += 0.1) {
      for (let j = left; j <= right; j += 0.1) {
        for (let k = bottom; k <= top; k += 0.1) {
          expect(Frustum.containsVec(frustum, Vec3.create(j, k, i))).toBe(true);
        }
      }
    }

    // orthographic
    expect(Frustum.containsVec(frustum, Vec3.create(-0.1, 0, minDepth))).toBe(false);
    expect(Frustum.containsVec(frustum, Vec3.create(0, -0.1, minDepth))).toBe(false);
    expect(Frustum.containsVec(frustum, Vec3.create(1.1, 0, minDepth))).toBe(false);
    expect(Frustum.containsVec(frustum, Vec3.create(0, 1.1, minDepth))).toBe(false);
  });

  it('fromProjection/containsVec', () => {
    const mat = new Matrix4().makePerspective(0, 1, 1, 0, 1, 5);
    const frustum = Frustum.fromProjection(mat);

    const maxDepth = -5;
    const minDepth = -3;
    const bottom = 0;
    const top = 1;
    const left = 0;
    const right = 1;

    for (let i = maxDepth; i <= minDepth; i += 0.1) {
      for (let j = left; j <= right; j += 0.1) {
        for (let k = bottom; k <= top; k += 0.1) {
          expect(Frustum.containsVec(frustum, Vec3.create(j, k, i))).toBe(true);
        }
      }
    }
    expect(Frustum.containsVec(frustum, Vec3.create(-0.1, 0, minDepth))).toBe(false);
    expect(Frustum.containsVec(frustum, Vec3.create(0, -0.1, minDepth))).toBe(false);

    // not orthographic
    expect(Frustum.containsVec(frustum, Vec3.create(1.1, 0, minDepth))).toBe(true);
    expect(Frustum.containsVec(frustum, Vec3.create(0, 1.1, minDepth))).toBe(true);

    // but within bounds
    expect(Frustum.containsVec(frustum, Vec3.create(20, 0, minDepth))).toBe(false);
    expect(Frustum.containsVec(frustum, Vec3.create(0, 20, minDepth))).toBe(false);
  });

  it('intersectsObject', () => {
    const mat = new Matrix4().makePerspective(-1, 1, 1, -1, 1, 100);
    const frustum = Frustum.fromProjection(mat);
    const mesh = new Mesh(new BoxGeometry(1, 1, 1));

    expect(Frustum.intersectsObject(frustum, mesh)).toBe(false);

    mesh.position.set(-5, -5, -5);
    mesh.updateMatrixWorld();

    expect(Frustum.intersectsObject(frustum, mesh)).toBe(true);

    mesh.position.set(5, 5, 5);
    mesh.updateMatrixWorld();

    expect(Frustum.intersectsObject(frustum, mesh)).toBe(false);
  });

  it('intersectsSprite', () => {
    const mat = new Matrix4().makePerspective(0, 1, 1, 0, 1, 5);
    const frustum = Frustum.fromProjection(mat);
    const sprite = new Sprite();

    expect(Frustum.intersectsSprite(frustum, sprite)).toBe(false);

    sprite.position.set(1, 1, -3);

    expect(Frustum.intersectsSprite(frustum, sprite)).toBe(false);

    sprite.updateMatrixWorld();

    expect(Frustum.intersectsSprite(frustum, sprite)).toBe(true);
  });

  it('intersectsSphere', () => {
    const mat = new Matrix4().makePerspective(-1, 1, 1, -1, 1, 100);
    const frustum = Frustum.fromProjection(mat);
    const sphere = Sphere_.create(0, 0, 0, 0);

    expect(Frustum.intersectsSphere(frustum, sphere)).toBe(false);
    Sphere_.set(sphere, 0, 0, -50, 0);
    expect(Frustum.intersectsSphere(frustum, sphere)).toBe(true);
  });

  it('intersectsBox', () => {
    const mat = new Matrix4().makePerspective(-1, 1, 1, -1, 1, 100);
    const frustum = Frustum.fromProjection(mat);
    const box = Box3_.create(0, 0, 0, 1, 1, 1);

    expect(Frustum.intersectsBox(frustum, box)).toBe(false);

    Box3_.translate(box, Vec3.create(-1 - Number.EPSILON, -1 - Number.EPSILON, -1 - Number.EPSILON));

    expect(Frustum.intersectsBox(frustum, box)).toBe(false);
  });

  it('containsVec', () => {
    const mat = new Matrix4().makePerspective(-1, 1, 1, -1, 1, 100);
    const frustum = Frustum.fromProjection(mat);

    expect(Frustum.containsVec(frustum, Vec3.create(0, 0, 0))).toBe(false);
    expect(Frustum.containsVec(frustum, Vec3.create(0, 0, -50))).toBe(true);
  });
});
