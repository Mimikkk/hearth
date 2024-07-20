import { IVec3, Vector3 } from '../math/Vector3.js';
import { Vec2 } from '../math/Vector2.js';
import { Sphere_ } from '../math/Sphere.js';
import { Ray } from '../math/Ray.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Object3D } from '../core/Object3D.js';
import { Triangle } from '../math/Triangle.js';
import { Side } from '../constants.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { Material } from '../materials/Material.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';

const _inverseMatrix = new Matrix4();
const _ray = new Ray();
const _sphere = Sphere_.empty();
const _sphereHitAt = new Vector3();

const _vA = new Vector3();
const _vB = new Vector3();
const _vC = new Vector3();

const _tempA = new Vector3();
const _morphA = new Vector3();

const _uvA = Vec2.new();
const _uvB = Vec2.new();
const _uvC = Vec2.new();

const _normalA = new Vector3();
const _normalB = new Vector3();
const _normalC = new Vector3();

const _intersectionPoint = new Vector3();
const _intersectionPointWorld = new Vector3();

const _intersect = IVec3.empty();
const _triangle1 = Triangle.empty();
const _triangle2 = Triangle.empty();

export class Mesh extends Object3D {
  declare isMesh: true;
  declare type: string | 'Mesh';

  geometry: BufferGeometry;
  material: Material;
  morphTargetInfluences: number[];
  morphTargetDictionary: Record<string, number>;

  constructor(geometry: BufferGeometry = new BufferGeometry(), material: Material = null!) {
    super();

    this.geometry = geometry;
    this.material = material;

    this.updateMorphTargets();
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    if (source.morphTargetInfluences !== undefined) {
      this.morphTargetInfluences = source.morphTargetInfluences.slice();
    }

    if (source.morphTargetDictionary !== undefined) {
      this.morphTargetDictionary = Object.assign({}, source.morphTargetDictionary);
    }

    this.material = source.material;
    this.geometry = source.geometry;

    return this;
  }

  updateMorphTargets() {
    const geometry = this.geometry;
    if (!geometry) return;

    const morphAttributes = geometry.morphAttributes;
    const keys = Object.keys(morphAttributes);

    if (keys.length > 0) {
      const morphAttribute = morphAttributes[keys[0]] as unknown as { name: string }[] | undefined;

      if (morphAttribute !== undefined) {
        this.morphTargetInfluences = [];
        this.morphTargetDictionary = {};

        for (let m = 0, ml = morphAttribute.length; m < ml; m++) {
          const name = morphAttribute[m].name || String(m);

          this.morphTargetInfluences.push(0);
          this.morphTargetDictionary[name] = m;
        }
      }
    }
  }

  getVertexPosition(index: number, target: Vector3): Vector3 {
    const geometry = this.geometry;
    const position = geometry.attributes.position;
    const morphPosition = geometry.morphAttributes.position as unknown as number[];
    const morphTargetsRelative = geometry.morphTargetsRelative;

    IVec3.fillAttribute(target, position, 0);

    const morphInfluences = this.morphTargetInfluences;

    if (morphPosition && morphInfluences) {
      _morphA.set(0, 0, 0);

      for (let i = 0, il = morphPosition.length; i < il; i++) {
        const influence = morphInfluences[i];
        const morphAttribute = morphPosition[i] as any;

        if (influence === 0) continue;

        _tempA.fromBufferAttribute(morphAttribute, index);

        if (morphTargetsRelative) {
          _morphA.addScaledVector(_tempA, influence);
        } else {
          _morphA.addScaledVector(_tempA.sub(target), influence);
        }
      }

      IVec3.add(target, _morphA);
    }

    return target;
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    const geometry = this.geometry;
    const material = this.material;
    const matrixWorld = this.matrixWorld;

    if (material === undefined) return;

    // test with bounding sphere in world space

    if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

    Sphere_.fill_(_sphere, geometry.boundingSphere!);
    Sphere_.applyMat4(_sphere, matrixWorld);

    // check distance from ray origin to bounding sphere

    _ray.copy(raycaster.ray).recast(raycaster.near);

    if (!Sphere_.containsVec(_sphere, _ray.origin)) {
      if (_ray.intersectSphere(_sphere, _sphereHitAt) === null) return;

      if (_ray.origin.distanceToSquared(_sphereHitAt) > (raycaster.far - raycaster.near) ** 2) return;
    }

    // convert ray to local space of mesh

    _inverseMatrix.copy(matrixWorld).invert();
    _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix);

    // test with bounding box in local space

    if (geometry.boundingBox !== null) {
      if (_ray.intersectsBox(geometry.boundingBox) === false) return;
    }

    // test for intersections with geometry

    this._computeIntersections(raycaster, intersects, _ray);
  }

  _computeIntersections(raycaster: Raycaster, intersects: Intersection[], rayLocalSpace: Ray) {
    let intersection;

    const geometry = this.geometry;
    const material = this.material;

    const index = geometry.index;
    const position = geometry.attributes.position;
    const uv = geometry.attributes.uv as BufferAttribute<Float32Array>;
    const uv1 = geometry.attributes.uv1 as BufferAttribute<Float32Array>;
    const normal = geometry.attributes.normal as BufferAttribute<Float32Array>;
    const groups = geometry.groups;
    const range = geometry.drawRange;

    if (index) {
      if (Array.isArray(material)) {
        for (let i = 0, it = groups.length; i < it; i++) {
          const group = groups[i];
          const groupMaterial = material[group.materialIndex as any];

          const start = Math.max(group.start, range.start);
          const end = Math.min(index.count, Math.min(group.start + group.count, range.start + range.count));

          for (let j = start; j < end; j += 3) {
            const a = index.getX(j);
            const b = index.getX(j + 1);
            const c = index.getX(j + 2);

            intersection = checkGeometryIntersection(
              this,
              groupMaterial,
              raycaster,
              rayLocalSpace,
              uv,
              uv1,
              normal,
              a,
              b,
              c,
            );

            if (!intersection) continue;
            intersection.faceIndex = Math.floor(j / 3);
            intersection.face!.materialIndex = group.materialIndex!;
            intersects.push(intersection);
          }
        }
      } else {
        const start = Math.max(0, range.start);
        const end = Math.min(index.count, range.start + range.count);

        for (let i = start; i < end; i += 3) {
          const a = index.getX(i);
          const b = index.getX(i + 1);
          const c = index.getX(i + 2);

          intersection = checkGeometryIntersection(this, material, raycaster, rayLocalSpace, uv, uv1, normal, a, b, c);
          if (!intersection) continue;

          intersection.faceIndex = Math.floor(i / 3);
          intersects.push(intersection);
        }
      }
    } else if (position) {
      if (Array.isArray(material)) {
        for (let i = 0, it = groups.length; i < it; i++) {
          const group = groups[i];
          const groupMaterial = material[group.materialIndex!];

          const start = Math.max(group.start, range.start);
          const end = Math.min(position.count, Math.min(group.start + group.count, range.start + range.count));

          for (let j = start, jl = end; j < jl; j += 3) {
            const a = j;
            const b = j + 1;
            const c = j + 2;

            intersection = checkGeometryIntersection(
              this,
              groupMaterial,
              raycaster,
              rayLocalSpace,
              uv,
              uv1,
              normal,
              a,
              b,
              c,
            );

            if (intersection) {
              intersection.faceIndex = Math.floor(j / 3); // triangle number in non-indexed buffer semantics
              intersection.face!.materialIndex = group.materialIndex!;
              intersects.push(intersection);
            }
          }
        }
      } else {
        const start = Math.max(0, range.start);
        const end = Math.min(position.count, range.start + range.count);

        for (let i = start; i < end; i += 3) {
          const a = i;
          const b = i + 1;
          const c = i + 2;

          intersection = checkGeometryIntersection(this, material, raycaster, rayLocalSpace, uv, uv1, normal, a, b, c);
          if (!intersection) continue;

          intersection.faceIndex = Math.floor(i / 3);
          intersects.push(intersection);
        }
      }
    }
  }
}

Mesh.prototype.isMesh = true;
Mesh.prototype.type = 'Mesh';

function checkIntersection(
  object: Mesh,
  material: Material,
  raycaster: Raycaster,
  ray: Ray,
  pA: Vector3,
  pB: Vector3,
  pC: Vector3,
  point: Vector3,
): Intersection | null {
  let intersect;

  if (material.side === Side.Back) {
    intersect = ray.intersectTriangle(pC, pB, pA, true, point);
  } else {
    intersect = ray.intersectTriangle(pA, pB, pC, material.side === Side.Front, point);
  }

  if (intersect === null) return null;

  IVec3.fill(_intersectionPointWorld, point);
  IVec3.applyMat4(_intersectionPointWorld, object.matrixWorld);

  const distance = raycaster.ray.origin.distanceTo(_intersectionPointWorld);

  if (distance < raycaster.near || distance > raycaster.far) return null;

  return {
    distance,
    point: _intersectionPointWorld.clone(),
    object,
  };
}

function checkGeometryIntersection(
  object: Mesh,
  material: Material,
  raycaster: Raycaster,
  ray: Ray,
  uv: BufferAttribute<Float32Array>,
  uv1: BufferAttribute<Float32Array>,
  normal: BufferAttribute<Float32Array>,
  a: number,
  b: number,
  c: number,
): Intersection | null {
  object.getVertexPosition(a, _vA);
  object.getVertexPosition(b, _vB);
  object.getVertexPosition(c, _vC);
  Triangle.set(_triangle1, _vA, _vB, _vC);

  const intersection = checkIntersection(object, material, raycaster, ray, _vA, _vB, _vC, _intersectionPoint);

  if (intersection) {
    if (uv) {
      _uvA.fromAttribute(uv, a);
      _uvB.fromAttribute(uv, b);
      _uvC.fromAttribute(uv, c);

      Triangle.set(_triangle2, _uvA, _uvB, _uvC);
      Triangle.interpolate_(_triangle1, _triangle2, _intersectionPoint, _intersect);

      intersection.uv = new Vec2(_intersect.x, _intersect.y);
    }

    if (uv1) {
      _uvA.fromAttribute(uv, a);
      _uvB.fromAttribute(uv, b);
      _uvC.fromAttribute(uv, c);

      Triangle.set(_triangle2, _uvA, _uvB, _uvC);
      Triangle.interpolate_(_triangle1, _triangle2, _intersectionPoint, _intersect);
      Triangle.interpolate_(_triangle1, _triangle2, _intersectionPoint, _intersect);

      intersection.uv1 = new Vec2(_intersect.x, _intersect.y);
    }

    if (normal) {
      IVec3.fillAttribute(_normalA, normal, a);
      IVec3.fillAttribute(_normalB, normal, b);
      IVec3.fillAttribute(_normalC, normal, c);

      Triangle.set(_triangle2, _normalA, _normalB, _normalC);
      Triangle.interpolate_(_triangle1, _triangle2, _intersectionPoint, _intersect);

      intersection.normal = new Vector3(_intersect.x, _intersect.y, _intersect.z);

      if (IVec3.dot(intersection.normal, ray.direction) > 0) {
        IVec3.negate(intersection.normal);
      }
    }

    const face = {
      a: a,
      b: b,
      c: c,
      normal: new Vector3(),
      materialIndex: 0,
    };

    Triangle.normal_(_triangle1, face.normal);

    intersection.face = face as never;
  }

  return intersection;
}
