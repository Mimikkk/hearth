import { Sphere_ } from '../math/Sphere.js';
import { Ray } from '../math/Ray.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Object3D } from '../core/Object3D.js';
import { Vector3 } from '../math/Vector3.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { Material } from '@modules/renderer/engine/materials/Material.js';
import { Intersection, Raycaster } from '@modules/renderer/engine/core/Raycaster.js';
import { LineSegments } from '@modules/renderer/engine/objects/LineSegments.js';

const _start = new Vector3();
const _end = new Vector3();
const _inverseMatrix = new Matrix4();
const _ray = new Ray();
const _sphere = Sphere_.empty();

export class Line extends Object3D {
  declare isLine: true;
  declare type: string | 'Line';

  material: Material;
  geometry: BufferGeometry;

  constructor(geometry: BufferGeometry, material: LineBasicMaterial) {
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

  computeLineDistances() {
    const geometry = this.geometry;

    // we assume non-indexed geometry

    if (geometry.index === null) {
      const positionAttribute = geometry.attributes.position;
      const lineDistances = [0];

      for (let i = 1, l = positionAttribute.count; i < l; i++) {
        _start.fromBufferAttribute(positionAttribute, i - 1);
        _end.fromBufferAttribute(positionAttribute, i);

        lineDistances[i] = lineDistances[i - 1];
        lineDistances[i] += _start.distanceTo(_end);
      }

      geometry.setAttribute('lineDistance', new Float32BufferAttribute(lineDistances, 1));
    } else {
      throw Error('engine.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.');
    }

    return this;
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    const geometry = this.geometry;
    const matrixWorld = this.matrixWorld;
    const threshold = raycaster.params.Line.threshold;
    const drawRange = geometry.drawRange;

    // Checking boundingSphere distance to ray

    if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

    Sphere_.fill_(_sphere, geometry.boundingSphere!);
    Sphere_.applyMat4(_sphere, matrixWorld);
    _sphere.radius += threshold;

    if (raycaster.ray.intersectsSphere(_sphere) === false) return;

    //

    _inverseMatrix.copy(matrixWorld).invert();
    _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix);

    const localThreshold = threshold / ((this.scale.x + this.scale.y + this.scale.z) / 3);
    const localThresholdSq = localThreshold * localThreshold;

    const vStart = new Vector3();
    const vEnd = new Vector3();
    const interSegment = new Vector3();
    const interRay = new Vector3();

    const isLineSegments = (object: any): object is LineSegments => object.isLineSegments;
    const step = isLineSegments(this) ? 2 : 1;

    const index = geometry.index;
    const attributes = geometry.attributes;
    const positionAttribute = attributes.position;

    if (index !== null) {
      const start = Math.max(0, drawRange.start);
      const end = Math.min(index.count, drawRange.start + drawRange.count);

      for (let i = start, l = end - 1; i < l; i += step) {
        const a = index.getX(i);
        const b = index.getX(i + 1);

        vStart.fromBufferAttribute(positionAttribute, a);
        vEnd.fromBufferAttribute(positionAttribute, b);

        const distSq = _ray.distanceSqToSegment(vStart, vEnd, interRay, interSegment);

        if (distSq > localThresholdSq) continue;

        interRay.applyMatrix4(this.matrixWorld); //Move back to world space for distance calculation

        const distance = raycaster.ray.origin.distanceTo(interRay);

        if (distance < raycaster.near || distance > raycaster.far) continue;

        intersects.push({
          distance: distance,
          // What do we want? intersection point on the ray or on the segment??
          // point: raycaster.ray.at( distance ),
          point: interSegment.clone().applyMatrix4(this.matrixWorld),
          index: i,
          object: this,
        });
      }
    } else {
      const start = Math.max(0, drawRange.start);
      const end = Math.min(positionAttribute.count, drawRange.start + drawRange.count);

      for (let i = start, l = end - 1; i < l; i += step) {
        vStart.fromBufferAttribute(positionAttribute, i);
        vEnd.fromBufferAttribute(positionAttribute, i + 1);

        const distSq = _ray.distanceSqToSegment(vStart, vEnd, interRay, interSegment);

        if (distSq > localThresholdSq) continue;

        interRay.applyMatrix4(this.matrixWorld); //Move back to world space for distance calculation

        const distance = raycaster.ray.origin.distanceTo(interRay);

        if (distance < raycaster.near || distance > raycaster.far) continue;

        intersects.push({
          distance: distance,
          // What do we want? intersection point on the ray or on the segment??
          // point: raycaster.ray.at( distance ),
          point: interSegment.clone().applyMatrix4(this.matrixWorld),
          index: i,
          object: this,
        });
      }
    }
  }

  morphTargetInfluences: number[] = [];
  morphTargetDictionary: Record<string, number> = {};

  updateMorphTargets() {
    const geometry = this.geometry;

    const morphAttributes = geometry.morphAttributes;
    const keys = Object.keys(morphAttributes);

    if (keys.length > 0) {
      const morphAttribute = morphAttributes[keys[0]] as unknown as { name: string }[];

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

Line.prototype.isLine = true;
Line.prototype.type = 'Line';
