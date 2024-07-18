import { Capsule } from './Capsule.js';
import { Vec3 } from './Vec3.js';
import { Plane } from './Plane.js';
import { Line3 } from './Line3.js';
import { Sphere } from './Sphere.js';
import { Box3 } from './Box3.js';
import { Triangle } from './Triangle.js';
import type { Ray } from './Ray.js';
import type { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import type { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { clamp } from '@modules/renderer/engine/math/MathUtils.js';

interface Intersection {
  normal: Vec3;
  point?: Vec3;
  depth: number;
}

const _v1 = Vec3.new();
const _v2 = Vec3.new();
const _point1 = Vec3.new();
const _point2 = Vec3.new();
const _plane = Plane.new();
const _line1 = Line3.new();
const _line2 = Line3.new();
const _sphere = Sphere.new();
const _capsule = Capsule.new();

const _temp1 = Vec3.new();
const _temp2 = Vec3.new();
const _temp3 = Vec3.new();

const lineToLineClosestVecs = (a: Line3, b: Line3, intoA: Vec3, intoB: Vec3) => {
  const r = _temp1.from(a.end).sub(a.start);
  const s = _temp2.from(b.end).sub(b.start);
  const w = _temp3.from(b.start).sub(a.start);

  const drs = r.dot(s);
  const drr = r.dot(r);
  const dss = s.dot(s);
  const dsw = s.dot(w);
  const drw = r.dot(w);

  let t1: number;
  let t2: number;
  const divisor = drr * dss - drs * drs;
  if (Math.abs(divisor) < Number.EPSILON) {
    const d1 = -dsw / dss;
    const d2 = (drs - dsw) / dss;

    if (Math.abs(d1 - 0.5) < Math.abs(d2 - 0.5)) {
      t1 = 0;
      t2 = d1;
    } else {
      t1 = 1;
      t2 = d2;
    }
  } else {
    t1 = (dsw * drs + drw * dss) / divisor;
    t2 = (t1 * drs - dsw) / dss;
  }

  t1 = clamp(t1, 0, 1);
  t2 = clamp(t2, 0, 1);
  if (intoA) intoA.from(r).scale(t1).add(a.start);
  if (intoB) intoB.from(s).scale(t2).add(b.start);
};

export class Octree {
  bounds: Box3;
  subTrees: Octree[];
  triangles: Triangle[];

  constructor(public box: Box3 = new Box3()) {
    this.bounds = new Box3();

    this.subTrees = [];
    this.triangles = [];
  }

  addTriangle(triangle: Triangle): this {
    this.bounds.min.x = Math.min(this.bounds.min.x, triangle.a.x, triangle.b.x, triangle.c.x);
    this.bounds.min.y = Math.min(this.bounds.min.y, triangle.a.y, triangle.b.y, triangle.c.y);
    this.bounds.min.z = Math.min(this.bounds.min.z, triangle.a.z, triangle.b.z, triangle.c.z);
    this.bounds.max.x = Math.max(this.bounds.max.x, triangle.a.x, triangle.b.x, triangle.c.x);
    this.bounds.max.y = Math.max(this.bounds.max.y, triangle.a.y, triangle.b.y, triangle.c.y);
    this.bounds.max.z = Math.max(this.bounds.max.z, triangle.a.z, triangle.b.z, triangle.c.z);

    this.triangles.push(triangle);

    return this;
  }

  calcBox(): this {
    this.box = this.bounds.clone();

    // offset small amount to account for regular grid
    this.box.min.x -= 0.01;
    this.box.min.y -= 0.01;
    this.box.min.z -= 0.01;

    return this;
  }

  split(level: number): this {
    if (!this.box) return this;

    const subTrees = [];
    const halfsize = _v2.from(this.box.max).sub(this.box.min).scale(0.5);

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          const box = new Box3();
          const v = _v1.set(x, y, z);

          box.min.from(this.box.min).add(v.mul(halfsize));
          box.max.from(box.min).add(halfsize);

          subTrees.push(new Octree(box));
        }
      }
    }

    let triangle;

    while ((triangle = this.triangles.pop())) {
      for (let i = 0; i < subTrees.length; i++) {
        if (subTrees[i].box.intersectsTriangle(triangle)) {
          subTrees[i].triangles.push(triangle);
        }
      }
    }

    for (let i = 0; i < subTrees.length; i++) {
      const len = subTrees[i].triangles.length;

      if (len > 8 && level < 16) {
        subTrees[i].split(level + 1);
      }

      if (len !== 0) {
        this.subTrees.push(subTrees[i]);
      }
    }

    return this;
  }

  build(): this {
    this.calcBox();
    this.split(0);

    return this;
  }

  getRayTriangles(ray: Ray, triangles: Triangle[]): Triangle[] {
    for (let i = 0; i < this.subTrees.length; i++) {
      const subTree = this.subTrees[i];
      if (!ray.intersectsBox(subTree.box)) continue;

      if (subTree.triangles.length > 0) {
        for (let j = 0; j < subTree.triangles.length; j++) {
          if (triangles.indexOf(subTree.triangles[j]) === -1) triangles.push(subTree.triangles[j]);
        }
      } else {
        subTree.getRayTriangles(ray, triangles);
      }
    }

    return triangles;
  }

  triangleCapsuleIntersect(capsule: Capsule, triangle: Triangle): Intersection | undefined {
    triangle.plane(_plane);

    const d1 = _plane.distanceTo(capsule.start) - capsule.radius;
    const d2 = _plane.distanceTo(capsule.end) - capsule.radius;

    if ((d1 > 0 && d2 > 0) || (d1 < -capsule.radius && d2 < -capsule.radius)) return;

    const delta = Math.abs(d1 / (Math.abs(d1) + Math.abs(d2)));

    const intersect = _v1.lerp(capsule.start, capsule.end, delta);

    if (triangle.containsVec(intersect)) {
      return {
        normal: Vec3.from(_plane.normal),
        point: Vec3.from(_v1),
        depth: Math.abs(Math.min(d1, d2)),
      };
    }

    const r2 = capsule.radius * capsule.radius;

    _line1.set(capsule.start, capsule.end);

    const lines = [
      [triangle.a, triangle.b],
      [triangle.b, triangle.c],
      [triangle.c, triangle.a],
    ];

    for (let i = 0; i < lines.length; i++) {
      _line2.set(lines[i][0], lines[i][1]);

      lineToLineClosestVecs(_line1, _line2, _point1, _point2);

      const distanceSq = _point1.distanceSqTo(_point2);
      if (distanceSq < r2) {
        return {
          normal: _point1.clone().sub(_point2).normalize(),
          point: _point2.clone(),
          depth: capsule.radius - Math.sqrt(distanceSq),
        };
      }
    }
  }

  triangleSphereIntersect(sphere: Sphere, triangle: Triangle): undefined | Intersection {
    triangle.plane(_plane);

    if (!sphere.intersectsPlane(_plane)) return;

    const depth = Math.abs(_plane.distanceToSphere(sphere));
    const r2 = sphere.radius * sphere.radius - depth * depth;

    const plainPoint = _plane.project(sphere.center, _v1);

    if (triangle.containsVec(sphere.center)) {
      return {
        normal: Vec3.new(_plane.normal.x, _plane.normal.y, _plane.normal.z),
        point: Vec3.new(_v1.x, _v1.y, _v1.z),
        depth: Math.abs(_plane.distanceToSphere(sphere)),
      };
    }

    const lines = [
      [triangle.a, triangle.b],
      [triangle.b, triangle.c],
      [triangle.c, triangle.a],
    ];

    for (let i = 0; i < lines.length; i++) {
      _line1.set(lines[i][0], lines[i][1]);
      _line1.closestTo(plainPoint, _v2);

      const distance = _v2.distanceSqTo(sphere.center);

      if (distance >= r2) continue;
      const s = Vec3.from(sphere.center).sub(_v2).normalize();

      const normal = Vec3.new(s.x, s.y, s.z);

      return {
        normal,
        point: _v2.clone(),
        depth: sphere.radius - Math.sqrt(distance),
      };
    }
  }

  getSphereTriangles(sphere: Sphere, triangles: Triangle[]): void {
    for (let i = 0; i < this.subTrees.length; i++) {
      const subTree = this.subTrees[i];

      if (!sphere.intersectsBox(subTree.box)) continue;

      if (subTree.triangles.length > 0) {
        for (let j = 0; j < subTree.triangles.length; j++) {
          if (triangles.indexOf(subTree.triangles[j]) === -1) triangles.push(subTree.triangles[j]);
        }
      } else {
        subTree.getSphereTriangles(sphere, triangles);
      }
    }
  }

  getCapsuleTriangles(capsule: Capsule, triangles: Triangle[]): void {
    for (let i = 0; i < this.subTrees.length; i++) {
      const subTree = this.subTrees[i];

      if (!capsule.intersectsBox(subTree.box)) continue;

      if (subTree.triangles.length > 0) {
        for (let j = 0; j < subTree.triangles.length; j++) {
          if (triangles.indexOf(subTree.triangles[j]) === -1) triangles.push(subTree.triangles[j]);
        }
      } else {
        subTree.getCapsuleTriangles(capsule, triangles);
      }
    }
  }

  sphereIntersect(sphere: Sphere): undefined | Intersection {
    _sphere.from(sphere);

    const triangles: Triangle[] = [];
    let hit = false;

    this.getSphereTriangles(sphere, triangles);

    for (let i = 0; i < triangles.length; i++) {
      let intersect = this.triangleSphereIntersect(_sphere, triangles[i]);
      if (!intersect) continue;

      hit = true;
      intersect.normal.scale(intersect.depth);
      _sphere.center.add(intersect.normal);
    }

    if (!hit) return;
    const collision = Vec3.from(_sphere.center).sub(sphere.center);
    const depth = collision.length();
    const normal = collision.normalize();

    return { normal, depth };
  }

  capsuleIntersect(capsule: Capsule): undefined | Intersection {
    _capsule.from(capsule);

    const triangles: Triangle[] = [];
    let result,
      hit = false;

    this.getCapsuleTriangles(_capsule, triangles);

    for (let i = 0; i < triangles.length; i++) {
      if ((result = this.triangleCapsuleIntersect(_capsule, triangles[i]))) {
        hit = true;

        _capsule.translate(result.normal.scale(result.depth));
      }
    }

    if (!hit) return;
    const c1 = _capsule.center();
    const c2 = capsule.center();

    const collision = c1.sub(c2);
    const depth = collision.length();
    const normal = collision.normalize();

    return { normal, depth };
  }

  rayIntersect(ray: Ray): undefined | { distance: number; triangle: Triangle; position: Vec3 } {
    if (ray.direction.length() === 0) return;

    const triangles: Triangle[] = [];
    let triangle!: Triangle;
    let position!: Vec3;
    let distance = Infinity;

    this.getRayTriangles(ray, triangles);

    for (let i = 0; i < triangles.length; i++) {
      const intersect = ray.intersectTriangle(triangles[i], true, _v1);
      if (!intersect) continue;

      const newDistance = intersect.sub(ray.origin).length();
      if (distance <= newDistance) continue;

      position.from(intersect.add(ray.origin));
      distance = newDistance;
      triangle = triangles[i];
    }

    return distance !== Infinity ? { distance, triangle, position } : undefined;
  }

  fromGraphNode(group: Object3D): this {
    group.updateWorldMatrix(true, true);

    const isMesh = (obj: Object3D): obj is Mesh => 'isMesh' in obj;
    group.traverse(object => {
      if (isMesh(object)) {
        let geometry;
        let isTemp = false;

        if (object.geometry.index !== null) {
          isTemp = true;
          geometry = object.geometry.toNonIndexed();
        } else {
          geometry = object.geometry;
        }

        const positionAttribute = geometry.attributes.position;

        for (let i = 0; i < positionAttribute.count; i += 3) {
          const v1 = Vec3.fromAttribute(positionAttribute, i).applyMat4(object.matrixWorld);
          const v2 = Vec3.fromAttribute(positionAttribute, i + 1).applyMat4(object.matrixWorld);
          const v3 = Vec3.fromAttribute(positionAttribute, i + 2).applyMat4(object.matrixWorld);

          this.addTriangle(Triangle.new(v1, v2, v3));
        }

        if (isTemp) {
          geometry.dispose();
        }
      }
    });

    this.build();

    return this;
  }

  clear() {
    this.box = null!;
    this.bounds.clear();

    this.subTrees.length = 0;
    this.triangles.length = 0;

    return this;
  }
}
