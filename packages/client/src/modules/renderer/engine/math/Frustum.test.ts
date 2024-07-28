import { describe, expect, it } from 'vitest';
import { Frustum } from './Frustum.js';
import { Plane } from './Plane.js';
import { Vec3 } from './Vec3.js';
import { Mat4 } from './Mat4.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Sphere } from './Sphere.js';
import { Sprite } from '@modules/renderer/engine/entities/Sprite.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { BoxGeometry } from '@modules/renderer/engine/entities/geometries/BoxGeometry.js';

describe('Math - Frustum', () => {
  it('Instancing', () => {
    let a = Frustum.empty();

    expect(a.planes).toBeDefined();
    expect(a.planes.length).toBe(6);

    const plane = Plane.empty();
    for (let i = 0; i < 6; i++) {
      expect(a.planes[i]).toEqual(plane);
    }

    const p6 = Plane.fromParams(1, 0, 0, -1);
    const p7 = Plane.fromParams(1, 0, 0, 1);
    const p8 = Plane.fromParams(1, 0, 0, 2);
    const p9 = Plane.fromParams(1, 0, 0, 3);
    const pa = Plane.fromParams(1, 0, 0, 4);
    const pb = Plane.fromParams(1, 0, 0, 5);

    a.set(p6, p7, p8, p9, pa, pb);
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
    const mat = new Mat4().asOrthographic(0, 1, 1, 0, 1, 5);
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
          expect(frustum.contains(Vec3.new(j, k, i))).toBe(true);
        }
      }
    }


    expect(frustum.contains(Vec3.new(-0.1, 0, minDepth))).toBe(false);
    expect(frustum.contains(Vec3.new(0, -0.1, minDepth))).toBe(false);
    expect(frustum.contains(Vec3.new(1.1, 0, minDepth))).toBe(false);
    expect(frustum.contains(Vec3.new(0, 1.1, minDepth))).toBe(false);
  });

  it('fromProjection/containsVec', () => {
    const mat = new Mat4().asPerspective(0, 1, 1, 0, 1, 5);
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
          expect(frustum.contains(Vec3.new(j, k, i))).toBe(true);
        }
      }
    }
    expect(frustum.contains(Vec3.new(-0.1, 0, minDepth))).toBe(false);
    expect(frustum.contains(Vec3.new(0, -0.1, minDepth))).toBe(false);


    expect(frustum.contains(Vec3.new(1.1, 0, minDepth))).toBe(true);
    expect(frustum.contains(Vec3.new(0, 1.1, minDepth))).toBe(true);


    expect(frustum.contains(Vec3.new(20, 0, minDepth))).toBe(false);
    expect(frustum.contains(Vec3.new(0, 20, minDepth))).toBe(false);
  });

  it('intersectsObject', () => {
    const mat = new Mat4().asPerspective(-1, 1, 1, -1, 1, 100);
    const frustum = Frustum.fromProjection(mat);
    const mesh = new Mesh(new BoxGeometry(1, 1, 1));

    expect(frustum.intersectsObject(mesh)).toBe(false);

    mesh.position.set(-5, -5, -5);
    mesh.updateMatrixWorld();

    expect(frustum.intersectsObject(mesh)).toBe(true);

    mesh.position.set(5, 5, 5);
    mesh.updateMatrixWorld();

    expect(frustum.intersectsObject(mesh)).toBe(false);
  });

  it('intersectsSprite', () => {
    const mat = new Mat4().asPerspective(0, 1, 1, 0, 1, 5);
    const frustum = Frustum.fromProjection(mat);
    const sprite = new Sprite();

    expect(frustum.intersectsSprite(sprite)).toBe(false);

    sprite.position.set(1, 1, -3);

    expect(frustum.intersectsSprite(sprite)).toBe(false);

    sprite.updateMatrixWorld();

    expect(frustum.intersectsSprite(sprite)).toBe(true);
  });

  it('intersectsSphere', () => {
    const mat = new Mat4().asPerspective(-1, 1, 1, -1, 1, 100);
    const frustum = Frustum.fromProjection(mat);
    const sphere = Sphere.fromParams(0, 0, 0, 0);

    expect(frustum.intersectsSphere(sphere)).toBe(false);
    sphere.setParams(0, 0, -50, 0);
    expect(frustum.intersectsSphere(sphere)).toBe(true);
  });

  it('intersectsBox', () => {
    const mat = new Mat4().asPerspective(-1, 1, 1, -1, 1, 100);
    const frustum = Frustum.fromProjection(mat);
    const box = Box3.fromParams(0, 0, 0, 1, 1, 1);

    expect(frustum.intersectsBox(box)).toBe(false);

    box.translate(Vec3.new(-1 - Number.EPSILON, -1 - Number.EPSILON, -1 - Number.EPSILON));

    expect(frustum.intersectsBox(box)).toBe(true);
  });

  it('containsVec', () => {
    const mat = new Mat4().asPerspective(-1, 1, 1, -1, 1, 100);
    const frustum = Frustum.fromProjection(mat);

    expect(frustum.contains(Vec3.new(0, 0, 0))).toBe(false);
    expect(frustum.contains(Vec3.new(0, 0, -50))).toBe(true);
  });
});
