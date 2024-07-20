import { Sphere } from '../math/Sphere.js';
import { Ray } from '../math/Ray.js';
import { Mat4 } from '../math/Mat4.js';
import { Object3D } from '../core/Object3D.js';
import { Vec3 } from '../math/Vec3.js';
import { PointsMaterial } from '../materials/PointsMaterial.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { Intersection, Raycaster } from '@modules/renderer/engine/core/Raycaster.js';

const _inverseMatrix = /*@__PURE__*/ new Mat4();
const _ray = /*@__PURE__*/ new Ray();
const _sphere = /*@__PURE__*/ new Sphere();
const _position = /*@__PURE__*/ new Vec3();

export class Points extends Object3D {
  declare isPoints: true;
  declare type: string | 'Points';
  declare geometry: BufferGeometry;
  declare material: PointsMaterial;
  morphTargetInfluences: number[];
  morphTargetDictionary: Record<string, number>;

  constructor(geometry: BufferGeometry, material: PointsMaterial) {
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
    const threshold = raycaster.params.Points.threshold;
    const drawRange = geometry.drawRange;

    // Checking boundingSphere distance to ray

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
    const intersectPoint = new Vec3();

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
