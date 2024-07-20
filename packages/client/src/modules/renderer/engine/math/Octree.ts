import { Capsule } from './Capsule.js';
import { Vec3 } from './Vec3.js';
import { Plane } from './Plane.js';
import { Line3 } from './Line3.js';
import { Sphere } from './Sphere.js';
import { Box3 } from './Box3.js';
import { Triangle } from './Triangle.js';
import { Ray } from './Ray.js';
import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';

interface Intersection {
  normal: Vec3;
  point?: Vec3;
  depth: number;
}

const _v1 = new Vec3();
const _v2 = new Vec3();
const _point1 = new Vec3();
const _point2 = new Vec3();
const _plane = new Plane();
const _line1 = new Line3();
const _line2 = new Line3();
const _sphere = new Sphere();
const _capsule = new Capsule();

const _temp1 = new Vec3();
const _temp2 = new Vec3();
const _temp3 = new Vec3();
const EPS = 1e-10;

function lineToLineClosestPoints(line1: Line3, line2: Line3, target1: Vec3, target2: Vec3) {
  const r = _temp1.from(line1.end).sub(line1.start);
  const s = _temp2.from(line2.end).sub(line2.start);
  const w = _temp3.from(line2.start).sub(line1.start);

  const a = r.dot(s),
    b = r.dot(r),
    c = s.dot(s),
    d = s.dot(w),
    e = r.dot(w);

  let t1, t2;
  const divisor = b * c - a * a;

  if (Math.abs(divisor) < EPS) {
    const d1 = -d / c;
    const d2 = (a - d) / c;

    if (Math.abs(d1 - 0.5) < Math.abs(d2 - 0.5)) {
      t1 = 0;
      t2 = d1;
    } else {
      t1 = 1;
      t2 = d2;
    }
  } else {
    t1 = (d * a + e * c) / divisor;
    t2 = (t1 * a - d) / c;
  }

  t2 = Math.max(0, Math.min(1, t2));
  t1 = Math.max(0, Math.min(1, t1));

  if (target1) {
    target1.from(r).scale(t1).add(line1.start);
  }

  if (target2) {
    target2.from(s).scale(t2).add(line2.start);
  }
}
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

          box.min.from(this.box.min).add(v.multiply(halfsize));
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
    triangle.getPlane(_plane);

    const d1 = _plane.distanceTo(capsule.start) - capsule.radius;
    const d2 = _plane.distanceTo(capsule.end) - capsule.radius;

    if ((d1 > 0 && d2 > 0) || (d1 < -capsule.radius && d2 < -capsule.radius)) return;

    const delta = Math.abs(d1 / (Math.abs(d1) + Math.abs(d2)));
    const intersectPoint = _v1.from(capsule.start).lerp(capsule.end, delta);

    if (triangle.containsPoint(intersectPoint)) {
      return { normal: _plane.normal.clone(), point: intersectPoint.clone(), depth: Math.abs(Math.min(d1, d2)) };
    }

    const r2 = capsule.radius * capsule.radius;

    const line1 = _line1.set(capsule.start, capsule.end);

    const lines = [
      [triangle.a, triangle.b],
      [triangle.b, triangle.c],
      [triangle.c, triangle.a],
    ];

    for (let i = 0; i < lines.length; i++) {
      const line2 = _line2.set(lines[i][0], lines[i][1]);

      lineToLineClosestPoints(line1, line2, _point1, _point2);

      if (_point1.distanceSqTo(_point2) < r2) {
        return {
          normal: _point1.clone().sub(_point2).normalize(),
          point: _point2.clone(),
          depth: capsule.radius - _point1.distanceTo(_point2),
        };
      }
    }
  }

  triangleSphereIntersect(sphere: Sphere, triangle: Triangle): undefined | Intersection {
    triangle.getPlane(_plane);

    if (!sphere.intersectsPlane(_plane)) return;

    const depth = Math.abs(_plane.distanceToSphere(sphere));
    const r2 = sphere.radius * sphere.radius - depth * depth;

    const plainPoint = _plane.project(sphere.center, _v1);

    if (triangle.containsPoint(sphere.center)) {
      return {
        normal: _plane.normal.clone(),
        point: plainPoint.clone(),
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

      const d = _v2.distanceSqTo(sphere.center);

      if (d < r2) {
        return {
          normal: sphere.center.clone().sub(_v2).normalize(),
          point: _v2.clone(),
          depth: sphere.radius - Math.sqrt(d),
        };
      }
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
    _sphere.copy(sphere);

    const triangles: Triangle[] = [];
    let hit = false;

    this.getSphereTriangles(sphere, triangles);

    for (let i = 0; i < triangles.length; i++) {
      let result = this.triangleSphereIntersect(_sphere, triangles[i]);
      if (!result) continue;

      hit = true;
      _sphere.center.add(result.normal.scale(result.depth));
    }

    if (hit) {
      const collisionVector = _sphere.center.clone().sub(sphere.center);
      const depth = collisionVector.length();

      return { normal: collisionVector.normalize(), depth: depth };
    }
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

    if (hit) {
      const collisionVector = _capsule.center(new Vec3()).sub(capsule.center(_v1));
      const depth = collisionVector.length();

      return { normal: collisionVector.normalize(), depth: depth };
    }
  }

  rayIntersect(ray: Ray): undefined | { distance: number; triangle: Triangle; position: Vec3 } {
    if (ray.direction.length() === 0) return;

    const triangles: Triangle[] = [];
    let triangle!: Triangle;
    let position!: Vec3;
    let distance = Infinity;

    this.getRayTriangles(ray, triangles);

    for (let i = 0; i < triangles.length; i++) {
      const result = ray.intersectTriangle(triangles[i].a, triangles[i].b, triangles[i].c, true, _v1);

      if (!result) continue;
      const newdistance = result.sub(ray.origin).length();
      if (distance <= newdistance) continue;

      position = result.clone().add(ray.origin);
      distance = newdistance;
      triangle = triangles[i];
    }

    return distance !== Infinity ? { distance, triangle, position } : undefined;
  }

  fromGraphNode(group: Object3D): this {
    group.updateWorldMatrix(true, true);

    const isMesh = (obj: Object3D): obj is Mesh => 'isMesh' in obj;
    group.traverse(obj => {
      if (isMesh(obj)) {
        let geometry,
          isTemp = false;

        if (obj.geometry.index !== null) {
          isTemp = true;
          geometry = obj.geometry.toNonIndexed();
        } else {
          geometry = obj.geometry;
        }

        const positionAttribute = geometry.getAttribute('position');

        for (let i = 0; i < positionAttribute.count; i += 3) {
          const v1 = new Vec3().fromAttribute(positionAttribute, i);
          const v2 = new Vec3().fromAttribute(positionAttribute, i + 1);
          const v3 = new Vec3().fromAttribute(positionAttribute, i + 2);

          v1.applyMat4(obj.matrixWorld);
          v2.applyMat4(obj.matrixWorld);
          v3.applyMat4(obj.matrixWorld);

          this.addTriangle(new Triangle(v1, v2, v3));
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
