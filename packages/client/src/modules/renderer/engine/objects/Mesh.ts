import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Sphere } from '../math/Sphere.js';
import { Ray } from '../math/Ray.js';
import { Mat4 } from '../math/Mat4.js';
import { Entity } from '../core/Entity.js';
import { Triangle } from '../math/Triangle.js';
import { Side } from '../constants.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Material } from '@modules/renderer/engine/objects/materials/Material.js';
import { Intersection, Raycaster } from '../core/Raycaster.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

export class Mesh extends Entity {
  declare isMesh: true;
  declare type: string | 'Mesh';

  geometry: Geometry;
  material: Material;
  morphTargetInfluences: number[];
  morphTargetDictionary: Record<string, number>;

  constructor(geometry: Geometry = new Geometry(), material?: Material) {
    super();

    this.geometry = geometry;
    this.material = material!;

    this.updateMorphTargets();
  }

  static is(value: any): value is Mesh {
    return value?.isMesh === true;
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

  getVertexPosition(index: number, target: Vec3): Vec3 {
    const geometry = this.geometry;
    const position = geometry.attributes.position;
    const morphPosition = geometry.morphAttributes.position as unknown as number[];
    const morphTargetsRelative = geometry.morphTargetsRelative;

    target.fromAttribute(position, index);

    const morphInfluences = this.morphTargetInfluences;

    if (morphPosition && morphInfluences) {
      _morphA.set(0, 0, 0);

      for (let i = 0, il = morphPosition.length; i < il; i++) {
        const influence = morphInfluences[i];
        const morphAttribute = morphPosition[i] as any;

        if (influence === 0) continue;

        _tempA.fromAttribute(morphAttribute, index);

        if (morphTargetsRelative) {
          _morphA.addScaled(_tempA, influence);
        } else {
          _morphA.addScaled(_tempA.sub(target), influence);
        }
      }

      target.add(_morphA);
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

    _sphere.from(geometry.boundingSphere!);
    _sphere.applyMat4(matrixWorld);

    // check distance from ray origin to bounding sphere

    _ray.from(raycaster.ray).recast(raycaster.near);

    if (_sphere.containsVec(_ray.origin) === false) {
      if (_ray.intersectSphere(_sphere, _sphereHitAt) === null) return;

      if (_ray.origin.distanceSqTo(_sphereHitAt) > (raycaster.far - raycaster.near) ** 2) return;
    }

    // convert ray to local space of mesh

    _inverseMatrix.from(matrixWorld).invert();
    _ray.from(raycaster.ray).applyMat4(_inverseMatrix);

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
    const drawRange = geometry.drawRange;

    if (index !== null) {
      // indexed buffer geometry

      if (Array.isArray(material)) {
        for (let i = 0, il = groups.length; i < il; i++) {
          const group = groups[i];
          const groupMaterial = material[group.materialIndex as any];

          const start = Math.max(group.start, drawRange.start);
          const end = Math.min(index.count, Math.min(group.start + group.count, drawRange.start + drawRange.count));

          for (let j = start, jl = end; j < jl; j += 3) {
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

            if (intersection) {
              intersection.faceIndex = Math.floor(j / 3); // triangle number in indexed buffer semantics
              intersection.face!.materialIndex = group.materialIndex!;
              intersects.push(intersection);
            }
          }
        }
      } else {
        const start = Math.max(0, drawRange.start);
        const end = Math.min(index.count, drawRange.start + drawRange.count);

        for (let i = start, il = end; i < il; i += 3) {
          const a = index.getX(i);
          const b = index.getX(i + 1);
          const c = index.getX(i + 2);

          intersection = checkGeometryIntersection(this, material, raycaster, rayLocalSpace, uv, uv1, normal, a, b, c);

          if (intersection) {
            intersection.faceIndex = Math.floor(i / 3); // triangle number in indexed buffer semantics
            intersects.push(intersection);
          }
        }
      }
    } else if (position !== undefined) {
      // non-indexed buffer geometry

      if (Array.isArray(material)) {
        for (let i = 0, il = groups.length; i < il; i++) {
          const group = groups[i];
          const groupMaterial = material[group.materialIndex!];

          const start = Math.max(group.start, drawRange.start);
          const end = Math.min(position.count, Math.min(group.start + group.count, drawRange.start + drawRange.count));

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
        const start = Math.max(0, drawRange.start);
        const end = Math.min(position.count, drawRange.start + drawRange.count);

        for (let i = start, il = end; i < il; i += 3) {
          const a = i;
          const b = i + 1;
          const c = i + 2;

          intersection = checkGeometryIntersection(this, material, raycaster, rayLocalSpace, uv, uv1, normal, a, b, c);

          if (intersection) {
            intersection.faceIndex = Math.floor(i / 3); // triangle number in non-indexed buffer semantics
            intersects.push(intersection);
          }
        }
      }
    }
  }
}

Mesh.prototype.isMesh = true;
Mesh.prototype.type = 'Mesh';

const _inverseMatrix = new Mat4();
const _ray = new Ray();
const _sphere = new Sphere();
const _sphereHitAt = Vec3.new();
const _vA = Vec3.new();
const _vB = Vec3.new();
const _vC = Vec3.new();
const _tempA = Vec3.new();
const _morphA = Vec3.new();
const _uvA = Vec2.new();
const _uvB = Vec2.new();
const _uvC = Vec2.new();
const _normalA = Vec3.new();
const _normalB = Vec3.new();
const _normalC = Vec3.new();
const _intersectionPoint = Vec3.new();
const _intersectionPointWorld = Vec3.new();
const _triangle = new Triangle();
const _triangle1 = new Triangle();
const _triangle2 = new Triangle();

function checkIntersection(
  object: Mesh,
  material: Material,
  raycaster: Raycaster,
  ray: Ray,
  pA: Vec3,
  pB: Vec3,
  pC: Vec3,
  point: Vec3,
): Intersection | null {
  let intersect;

  if (material.side === Side.Back) {
    _triangle.set(pC, pB, pA);
    intersect = ray.intersectTriangle(_triangle, true, point);
  } else {
    _triangle.set(pA, pB, pC);
    intersect = ray.intersectTriangle(_triangle, material.side === Side.Front, point);
  }

  if (intersect === null) return null;

  _intersectionPointWorld.from(point);
  _intersectionPointWorld.applyMat4(object.matrixWorld);

  const distance = raycaster.ray.origin.distanceTo(_intersectionPointWorld);

  if (distance < raycaster.near || distance > raycaster.far) return null;

  return {
    distance: distance,
    point: _intersectionPointWorld.clone(),
    object: object,
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

  const intersection = checkIntersection(object, material, raycaster, ray, _vA, _vB, _vC, _intersectionPoint);

  _triangle1.set(_vA, _vB, _vC);
  if (intersection) {
    if (uv) {
      _uvA.fromAttribute(uv, a);
      _uvB.fromAttribute(uv, b);
      _uvC.fromAttribute(uv, c);
      _triangle1.set(_uvA, _uvB, _uvC);

      const { x, y } = Triangle.interpolate(_triangle1, _triangle2, _intersectionPoint)!;
      intersection.uv = Vec2.new(x, y);
    }

    if (uv1) {
      _uvA.fromAttribute(uv1, a);
      _uvB.fromAttribute(uv1, b);
      _uvC.fromAttribute(uv1, c);
      _triangle1.set(_uvA, _uvB, _uvC);

      const { x, y } = Triangle.interpolate(_triangle1, _triangle2, _intersectionPoint)!;
      intersection.uv1 = Vec2.new(x, y);
    }

    if (normal) {
      _normalA.fromAttribute(normal, a);
      _normalB.fromAttribute(normal, b);
      _normalC.fromAttribute(normal, c);

      _triangle1.set(_vA, _vB, _vC);
      _triangle2.set(_normalA, _normalB, _normalC);

      intersection.normal = Triangle.interpolate(_triangle1, _triangle2, _intersectionPoint)!;
      if (intersection.normal.dot(ray.direction) > 0) intersection.normal.scale(-1);
    }

    _triangle2.set(_vA, _vB, _vC);
    const face = {
      a: a,
      b: b,
      c: c,
      normal: _triangle2.normal(),
      materialIndex: 0,
    };

    intersection.face = face as never;
  }

  return intersection;
}
