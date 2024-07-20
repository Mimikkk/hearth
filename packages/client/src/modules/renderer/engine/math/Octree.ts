import { Capsule } from './Capsule.js';
import { IVec3, Vector3 } from './Vector3.js';
import { Plane_ } from './Plane.js';
import { Line3 } from './Line3.js';
import { Sphere_ } from './Sphere.js';
import { Box3 } from './Box3.js';
import { Triangle } from './Triangle.js';
import { Ray } from './Ray.js';
import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { Mesh } from '@modules/renderer/engine/objects/Mesh.js';
import { clamp } from '@modules/renderer/engine/math/MathUtils.js';

interface Intersection {
  normal: IVec3;
  point?: IVec3;
  depth: number;
}

const _v1 = new Vector3();
const _v2 = new Vector3();
const _point1 = new Vector3();
const _point2 = new Vector3();
const _plane = Plane_.empty();
const _line1 = Line3.empty();
const _line2 = Line3.empty();
const _sphere = Sphere_.empty();
const _capsule = Capsule.empty();

const _temp1 = new Vector3();
const _temp2 = new Vector3();
const _temp3 = new Vector3();

const lineToLineClosestPoints = (line1: Line3, line2: Line3, target1: Vector3, target2: Vector3) => {
  const r = IVec3.sub_(line1.end, line1.start, _temp1);
  const s = IVec3.sub_(line2.end, line2.start, _temp2);
  const w = IVec3.sub_(line2.start, line1.start, _temp3);

  const drs = IVec3.dot(r, s);
  const drr = IVec3.dot(r, r);
  const dss = IVec3.dot(s, s);
  const dsw = IVec3.dot(s, w);
  const drw = IVec3.dot(r, w);

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

  if (target1) {
    IVec3.scale_(r, t1, target1);
    IVec3.add(target1, line1.start);
  }
  if (target2) {
    IVec3.scale_(s, t2, target2);
    IVec3.add(target2, line2.start);
  }
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
    const halfsize = _v2.copy(this.box.max).sub(this.box.min).multiplyScalar(0.5);

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          const box = new Box3();
          const v = _v1.set(x, y, z);

          box.min.copy(this.box.min).add(v.multiply(halfsize));
          box.max.copy(box.min).add(halfsize);

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
    Triangle.plane_(triangle, _plane);

    const d1 = Plane_.distanceToVec(_plane, capsule.start) - capsule.radius;
    const d2 = Plane_.distanceToVec(_plane, capsule.end) - capsule.radius;

    if ((d1 > 0 && d2 > 0) || (d1 < -capsule.radius && d2 < -capsule.radius)) return;

    const delta = Math.abs(d1 / (Math.abs(d1) + Math.abs(d2)));

    const intersectPoint = IVec3.lerp_(capsule.start, capsule.end, delta, _v1);

    if (Triangle.containsVec(triangle, intersectPoint)) {
      return {
        normal: new Vector3(_plane.normal.x, _plane.normal.y, _plane.normal.z),
        point: IVec3.clone(_v1),
        depth: Math.abs(Math.min(d1, d2)),
      };
    }

    const r2 = capsule.radius * capsule.radius;

    Line3.fillEnds(_line1, capsule.start, capsule.end);

    const lines = [
      [triangle.a, triangle.b],
      [triangle.b, triangle.c],
      [triangle.c, triangle.a],
    ];

    for (let i = 0; i < lines.length; i++) {
      Line3.fillEnds(_line2, lines[i][0], lines[i][1]);

      lineToLineClosestPoints(_line1, _line2, _point1, _point2);

      const distanceSq = IVec3.distanceSqTo(_point1, _point2);
      if (distanceSq < r2) {
        return {
          normal: _point1.clone().sub(_point2).normalize(),
          point: _point2.clone(),
          depth: capsule.radius - Math.sqrt(distanceSq),
        };
      }
    }
  }

  triangleSphereIntersect(sphere: Sphere_, triangle: Triangle): undefined | Intersection {
    Triangle.plane_(triangle, _plane);

    if (!Sphere_.intersectsPlane(sphere, _plane)) return;

    const depth = Math.abs(Plane_.distanceToSphere(_plane, sphere));
    const r2 = sphere.radius * sphere.radius - depth * depth;

    const plainPoint = Plane_.project_(_plane, sphere.center, _v1);

    if (Triangle.containsVec(triangle, sphere.center)) {
      return {
        normal: new Vector3(_plane.normal.x, _plane.normal.y, _plane.normal.z),
        point: new Vector3(_v1.x, _v1.y, _v1.z),
        depth: Math.abs(Plane_.distanceToSphere(_plane, sphere)),
      };
    }

    const lines = [
      [triangle.a, triangle.b],
      [triangle.b, triangle.c],
      [triangle.c, triangle.a],
    ];

    for (let i = 0; i < lines.length; i++) {
      Line3.fillEnds(_line1, lines[i][0], lines[i][1]);
      Line3.closestTo_(_line1, plainPoint, _v2);

      const distance = IVec3.distanceSqTo(_v2, sphere.center);

      if (distance >= r2) continue;
      const s = IVec3.subbed(sphere.center, _v2);
      IVec3.normalize(s);

      const normal = new Vector3(s.x, s.y, s.z);

      return {
        normal,
        point: _v2.clone(),
        depth: sphere.radius - Math.sqrt(distance),
      };
    }
  }

  getSphereTriangles(sphere: Sphere_, triangles: Triangle[]): void {
    for (let i = 0; i < this.subTrees.length; i++) {
      const subTree = this.subTrees[i];

      if (!Sphere_.intersectsBox(sphere, subTree.box)) continue;

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

  sphereIntersect(sphere: Sphere_): undefined | Intersection {
    Sphere_.fill_(_sphere, sphere);

    const triangles: Triangle[] = [];
    let hit = false;

    this.getSphereTriangles(sphere, triangles);

    for (let i = 0; i < triangles.length; i++) {
      let result = this.triangleSphereIntersect(_sphere, triangles[i]);
      if (!result) continue;

      hit = true;
      IVec3.add(_sphere.center, IVec3.scale(result.normal, result.depth));
    }

    if (!hit) return;
    const collision = IVec3.subbed(_sphere.center, sphere.center);
    const depth = IVec3.length(collision);
    const normal = IVec3.normalize(collision);

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

        _capsule.translate(IVec3.scale(result.normal, result.depth));
      }
    }

    if (!hit) return;
    _capsule.center(IVec3.temp0);
    capsule.center(IVec3.temp1);
    const collision = IVec3.subbed(IVec3.temp0, IVec3.temp1);
    const depth = IVec3.length(collision);
    const normal = IVec3.normalize(collision);

    return { normal, depth };
  }

  rayIntersect(ray: Ray): undefined | { distance: number; triangle: Triangle; position: Vector3 } {
    if (ray.direction.length() === 0) return;

    const triangles: Triangle[] = [];
    let triangle!: Triangle;
    let position!: Vector3;
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
          const v1 = new Vector3().fromBufferAttribute(positionAttribute, i);
          const v2 = new Vector3().fromBufferAttribute(positionAttribute, i + 1);
          const v3 = new Vector3().fromBufferAttribute(positionAttribute, i + 2);

          v1.applyMatrix4(obj.matrixWorld);
          v2.applyMatrix4(obj.matrixWorld);
          v3.applyMatrix4(obj.matrixWorld);

          this.addTriangle(Triangle.create(v1, v2, v3));
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
    this.bounds.makeEmpty();

    this.subTrees.length = 0;
    this.triangles.length = 0;

    return this;
  }
}
