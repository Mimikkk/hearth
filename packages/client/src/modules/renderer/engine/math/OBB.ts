import { clamp } from './MathUtils.js';
import { Vec3 } from './Vec3.js';
import { Mat3 } from './Mat3.js';
import { Box3 } from './Box3.js';
import { Mat4 } from './Mat4.js';
import { Ray } from './Ray.js';
import { Plane } from '@modules/renderer/engine/math/Plane.js';
import { Const } from '@modules/renderer/engine/math/types.js';

export class OBB {
  declare ['constructor']: typeof OBB;

  constructor(
    public center: Vec3 = Vec3.new(),
    public halfSize: Vec3 = Vec3.new(),
    public rotation: Mat3 = new Mat3(),
  ) {}

  static new(center: Vec3 = Vec3.new(), halfSize: Vec3 = Vec3.new(), rotation: Mat3 = new Mat3()) {
    return new OBB(center, halfSize, rotation);
  }

  set(center: Const<Vec3>, halfSize: Const<Vec3>, rotation: Const<Mat3>) {
    this.center.from(center);
    this.halfSize.from(halfSize);
    this.rotation.from(rotation);

    return this;
  }

  from({ center, halfSize, rotation }: Const<OBB>) {
    return this.set(center, halfSize, rotation);
  }

  clone() {
    return OBB.new().from(this);
  }

  fromBox3(box3: Const<Box3>) {
    box3.center(this.center);
    box3.size(this.halfSize).scale(0.5);
    this.rotation.asIdentity();

    return this;
  }

  size(into: Vec3 = Vec3.new()): Vec3 {
    return into.from(this.halfSize).scale(2);
  }

  clamp(point: Const<Vec3>, into: Vec3 = Vec3.new()): Vec3 {
    const halfSize = this.halfSize;

    v1.from(point).sub(this.center);
    this.rotation.intoBasis(xAxis, yAxis, zAxis);

    // start at the center position of the OBB

    into.from(this.center);

    // project the target onto the OBB axes and walk towards that point

    const x = clamp(v1.dot(xAxis), -halfSize.x, halfSize.x);
    into.add(xAxis.scale(x));

    const y = clamp(v1.dot(yAxis), -halfSize.y, halfSize.y);
    into.add(yAxis.scale(y));

    const z = clamp(v1.dot(zAxis), -halfSize.z, halfSize.z);
    into.add(zAxis.scale(z));

    return into;
  }

  containsVec(point: Const<Vec3>): boolean {
    v1.from(point).sub(this.center);
    this.rotation.intoBasis(xAxis, yAxis, zAxis);

    return (
      Math.abs(v1.dot(xAxis)) <= this.halfSize.x &&
      Math.abs(v1.dot(yAxis)) <= this.halfSize.y &&
      Math.abs(v1.dot(zAxis)) <= this.halfSize.z
    );
  }

  intersectsBox(box3: Box3): boolean {
    return this.intersectsOBB(obb.fromBox3(box3));
  }

  intersectsSphere(sphere: { center: Vec3; radius: number }): boolean {
    this.clamp(sphere.center, closest);

    return closest.distanceSqTo(sphere.center) <= sphere.radius * sphere.radius;
  }

  intersectsOBB(obb: Const<OBB>): boolean {
    // prepare data structures (the code uses the same nomenclature like the reference)

    a.c = this.center;
    a.e[0] = this.halfSize.x;
    a.e[1] = this.halfSize.y;
    a.e[2] = this.halfSize.z;
    this.rotation.intoBasis(a.u[0], a.u[1], a.u[2]);

    b.c = obb.center;
    b.e[0] = obb.halfSize.x;
    b.e[1] = obb.halfSize.y;
    b.e[2] = obb.halfSize.z;
    obb.rotation.extractBasis(b.u[0], b.u[1], b.u[2]);

    // compute rotation matrix expressing b in a's coordinate frame
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        R[i][j] = a.u[i].dot(b.u[j]);
      }
    }

    // compute translation vector
    v1.from(b.c).sub(a.c);

    // bring translation into a's coordinate frame
    t[0] = v1.dot(a.u[0]);
    t[1] = v1.dot(a.u[1]);
    t[2] = v1.dot(a.u[2]);

    // compute common subexpressions. Add in an epsilon term to
    // counteract arithmetic errors when two edges are parallel and
    // their cross product is (near) null

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        AbsR[i][j] = Math.abs(R[i][j]) + Number.EPSILON;
      }
    }

    let ra, rb;

    // test axes L = A0, L = A1, L = A2

    for (let i = 0; i < 3; i++) {
      ra = a.e[i];
      rb = b.e[0] * AbsR[i][0] + b.e[1] * AbsR[i][1] + b.e[2] * AbsR[i][2];
      if (Math.abs(t[i]) > ra + rb) return false;
    }

    // test axes L = B0, L = B1, L = B2

    for (let i = 0; i < 3; i++) {
      ra = a.e[0] * AbsR[0][i] + a.e[1] * AbsR[1][i] + a.e[2] * AbsR[2][i];
      rb = b.e[i];
      if (Math.abs(t[0] * R[0][i] + t[1] * R[1][i] + t[2] * R[2][i]) > ra + rb) return false;
    }

    // test axis L = A0 x B0

    ra = a.e[1] * AbsR[2][0] + a.e[2] * AbsR[1][0];
    rb = b.e[1] * AbsR[0][2] + b.e[2] * AbsR[0][1];
    if (Math.abs(t[2] * R[1][0] - t[1] * R[2][0]) > ra + rb) return false;

    // test axis L = A0 x B1

    ra = a.e[1] * AbsR[2][1] + a.e[2] * AbsR[1][1];
    rb = b.e[0] * AbsR[0][2] + b.e[2] * AbsR[0][0];
    if (Math.abs(t[2] * R[1][1] - t[1] * R[2][1]) > ra + rb) return false;

    // test axis L = A0 x B2

    ra = a.e[1] * AbsR[2][2] + a.e[2] * AbsR[1][2];
    rb = b.e[0] * AbsR[0][1] + b.e[1] * AbsR[0][0];
    if (Math.abs(t[2] * R[1][2] - t[1] * R[2][2]) > ra + rb) return false;

    // test axis L = A1 x B0

    ra = a.e[0] * AbsR[2][0] + a.e[2] * AbsR[0][0];
    rb = b.e[1] * AbsR[1][2] + b.e[2] * AbsR[1][1];
    if (Math.abs(t[0] * R[2][0] - t[2] * R[0][0]) > ra + rb) return false;

    // test axis L = A1 x B1

    ra = a.e[0] * AbsR[2][1] + a.e[2] * AbsR[0][1];
    rb = b.e[0] * AbsR[1][2] + b.e[2] * AbsR[1][0];
    if (Math.abs(t[0] * R[2][1] - t[2] * R[0][1]) > ra + rb) return false;

    // test axis L = A1 x B2

    ra = a.e[0] * AbsR[2][2] + a.e[2] * AbsR[0][2];
    rb = b.e[0] * AbsR[1][1] + b.e[1] * AbsR[1][0];
    if (Math.abs(t[0] * R[2][2] - t[2] * R[0][2]) > ra + rb) return false;

    // test axis L = A2 x B0

    ra = a.e[0] * AbsR[1][0] + a.e[1] * AbsR[0][0];
    rb = b.e[1] * AbsR[2][2] + b.e[2] * AbsR[2][1];
    if (Math.abs(t[1] * R[0][0] - t[0] * R[1][0]) > ra + rb) return false;

    // test axis L = A2 x B1

    ra = a.e[0] * AbsR[1][1] + a.e[1] * AbsR[0][1];
    rb = b.e[0] * AbsR[2][2] + b.e[2] * AbsR[2][0];
    if (Math.abs(t[1] * R[0][1] - t[0] * R[1][1]) > ra + rb) return false;

    // test axis L = A2 x B2

    ra = a.e[0] * AbsR[1][2] + a.e[1] * AbsR[0][2];
    rb = b.e[0] * AbsR[2][1] + b.e[1] * AbsR[2][0];
    if (Math.abs(t[1] * R[0][2] - t[0] * R[1][2]) > ra + rb) return false;

    // since no separating axis is found, the OBBs must be intersecting

    return true;
  }

  intersectsPlane(plane: Const<Plane>): boolean {
    this.rotation.intoBasis(xAxis, yAxis, zAxis);

    // compute the projection interval radius of this OBB onto L(t) = this->center + t * p.normal;

    const r =
      this.halfSize.x * Math.abs(plane.normal.dot(xAxis)) +
      this.halfSize.y * Math.abs(plane.normal.dot(yAxis)) +
      this.halfSize.z * Math.abs(plane.normal.dot(zAxis));

    // compute distance of the OBB's center from the plane

    const d = plane.normal.dot(this.center) - plane.constant;

    // Intersection occurs when distance d falls within [-r,+r] interval

    return Math.abs(d) <= r;
  }

  intersectsRay(ray: Const<Ray>): boolean {
    return this.intersectRay(ray, v1) !== null;
  }

  intersectRay(ray: Const<Ray>, into: Vec3 = Vec3.new()): Vec3 | null {
    this.size(size);
    aabb.fromCenterAndSize(v1.set(0, 0, 0), size);

    // create a 4x4 transformation matrix

    matrix.fromMat3(this.rotation);
    matrix.setPosition(this.center);

    // transform ray to the local space of the OBB

    inverse.from(matrix).invert();
    localRay.clone(ray).applyMat4(inverse);

    // perform ray <-> AABB intersection test

    // transform the intersection point back to world space
    if (localRay.intersectBox(aabb, into)) return into.applyMat4(matrix);
    return null;
  }

  applyMat4(matrix: Const<Mat4>): this {
    const e = matrix.elements;

    let sx = v1.set(e[0], e[1], e[2]).length();
    const sy = v1.set(e[4], e[5], e[6]).length();
    const sz = v1.set(e[8], e[9], e[10]).length();

    const det = matrix.determinant();
    if (det < 0) sx = -sx;

    rotationMatrix.fromMat4(matrix);

    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;

    rotationMatrix.elements[0] *= invSX;
    rotationMatrix.elements[1] *= invSX;
    rotationMatrix.elements[2] *= invSX;

    rotationMatrix.elements[3] *= invSY;
    rotationMatrix.elements[4] *= invSY;
    rotationMatrix.elements[5] *= invSY;

    rotationMatrix.elements[6] *= invSZ;
    rotationMatrix.elements[7] *= invSZ;
    rotationMatrix.elements[8] *= invSZ;

    this.rotation.mul(rotationMatrix);

    this.halfSize.x *= sx;
    this.halfSize.y *= sy;
    this.halfSize.z *= sz;

    v1.fromMat4Position(matrix);
    this.center.add(v1);

    return this;
  }

  equals(obb: Const<OBB>): boolean {
    return obb.center.equals(this.center) && obb.halfSize.equals(this.halfSize) && obb.rotation.equals(this.rotation);
  }
}

const a = {
  // center
  c: null,
  // basis vectors
  u: [Vec3.new(), Vec3.new(), Vec3.new()],
  // half width
  e: [],
} as {
  c: Vec3 | null;
  u: Vec3[];
  e: number[];
};

const b = {
  // center
  c: null,
  // basis vectors
  u: [Vec3.new(), Vec3.new(), Vec3.new()],
  // half width
  e: [],
} as {
  c: Vec3 | null;
  u: Vec3[];
  e: number[];
};

const R: number[][] = [[], [], []];
const AbsR: number[][] = [[], [], []];
const t: number[] = [];

const xAxis = Vec3.new();
const yAxis = Vec3.new();
const zAxis = Vec3.new();
const v1 = Vec3.new();
const size = Vec3.new();
const closest = Vec3.new();
const rotationMatrix = new Mat3();
const aabb = new Box3();
const matrix = new Mat4();
const inverse = new Mat4();
const localRay = new Ray();
const obb = OBB.new();
