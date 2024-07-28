import { Sphere } from '../math/Sphere.js';
import { Ray } from '../math/Ray.js';
import { Mat4 } from '../math/Mat4.js';
import { Entity } from '../core/Entity.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { PointsMaterial } from '@modules/renderer/engine/entities/materials/PointsMaterial.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Intersection, Raycaster } from '@modules/renderer/engine/core/Raycaster.js';

const _inverseMatrix = new Mat4();
const _ray = new Ray();
const _sphere = new Sphere();
const _position = Vec3.new();

export class Points extends Entity {
  declare isPoints: true;
  declare type: string | 'Points';
  declare geometry: Geometry;
  declare material: PointsMaterial;
  morphTargetInfluences: number[];
  morphTargetDictionary: Record<string, number>;

  constructor(geometry: Geometry, material: PointsMaterial) {
    super();

    this.geometry = geometry;
    this.material = material;

    this.updateMorphTargets();
  }

  copy(source: this, recursive?: boolean): this {
    super.copy(source, recursive);

    this.material = source.material;
    this.geometry = source.geometry;

    return this;
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    const geometry = this.geometry;
    const matrixWorld = this.matrixWorld;
    const threshold = 1;
    const drawRange = geometry.drawRange;



    if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

    _sphere.from(geometry.boundingSphere!);
    _sphere.applyMat4(matrixWorld);
    _sphere.radius += threshold;

    if (raycaster.ray.intersectsSphere(_sphere) === false) return;

    //

    _inverseMatrix.from(matrixWorld).invert();
    _ray.from(raycaster.ray).applyMat4(_inverseMatrix);

    const localThreshold = threshold / ((this.scale.x + this.scale.y + this.scale.z) / 3);
    const localThresholdSq = localThreshold * localThreshold;

    const index = geometry.index;
    const attributes = geometry.attributes;
    const positionAttribute = attributes.position;

    if (index !== null) {
      const start = Math.max(0, drawRange.start);
      const end = Math.min(index.count, drawRange.start + drawRange.count);

      for (let i = start, il = end; i < il; i++) {
        const a = index.getX(i);

        _position.fromAttribute(positionAttribute, a);

        testPoint(_position, a, localThresholdSq, matrixWorld, raycaster, intersects, this);
      }
    } else {
      const start = Math.max(0, drawRange.start);
      const end = Math.min(positionAttribute.count, drawRange.start + drawRange.count);

      for (let i = start, l = end; i < l; i++) {
        _position.fromAttribute(positionAttribute, i);

        testPoint(_position, i, localThresholdSq, matrixWorld, raycaster, intersects, this);
      }
    }
  }

  updateMorphTargets() {
    const geometry = this.geometry;

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
}

Points.prototype.isPoints = true;
Points.prototype.type = 'Points';

function testPoint(
  point: Vec3,
  index: number,
  localThresholdSq: number,
  matrixWorld: Mat4,
  raycaster: Raycaster,
  intersects: Intersection[],
  object: Points,
) {
  const rayPointDistanceSq = _ray.distanceSqTo(point);

  if (rayPointDistanceSq < localThresholdSq) {
    const intersectPoint = Vec3.new();

    _ray.closestTo(point, intersectPoint);
    intersectPoint.applyMat4(matrixWorld);

    const distance = raycaster.ray.origin.distanceTo(intersectPoint);

    if (distance < raycaster.near || distance > raycaster.far) return;

    intersects.push({
      distance: distance,
      distanceToRay: Math.sqrt(rayPointDistanceSq),
      point: intersectPoint,
      index: index,
      face: null,
      object: object,
    });
  }
}
