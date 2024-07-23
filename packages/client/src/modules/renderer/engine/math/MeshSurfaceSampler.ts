import { Triangle } from './Triangle.js';
import { Vec3 } from './Vec3.js';
import { Vec2 } from './Vec2.js';
import type { Mesh } from '../objects/Mesh.js';
import type { Material } from '../materials/Material.js';
import type { BufferAttribute } from '../core/attributes/BufferAttribute.js';
import type { Color } from './Color.js';
import { Geometry } from '@modules/renderer/engine/core/geometry/Geometry.js';

const _face = new Triangle();
const _color = Vec3.new();
const _uva = Vec2.new();
const _uvb = Vec2.new();
const _uvc = Vec2.new();

export class MeshSurfaceSampler<TGeometry extends Geometry, TMaterial extends Material | Material[]> {
  geometry: Geometry;
  randomFunction: () => number;
  indexAttribute: BufferAttribute<Uint32Array | Uint16Array>;
  positionAttribute: BufferAttribute<Float32Array>;
  normalAttribute: BufferAttribute<Float32Array>;
  colorAttribute: BufferAttribute<Float32Array>;
  uvAttribute: BufferAttribute<Float32Array>;
  weightAttribute: BufferAttribute<Float32Array>;
  distribution: Float32Array;

  constructor(mesh: Mesh) {
    this.geometry = mesh.geometry as never;
    this.randomFunction = Math.random;

    this.indexAttribute = this.geometry.index! as never as BufferAttribute<Uint32Array | Uint16Array>;
    this.positionAttribute = this.geometry.attributes.position! as never as BufferAttribute<Float32Array>;
    this.normalAttribute = this.geometry.attributes.normal! as never as BufferAttribute<Float32Array>;
    this.colorAttribute = this.geometry.attributes.color! as never as BufferAttribute<Float32Array>;
    this.uvAttribute = this.geometry.attributes.uv! as never as BufferAttribute<Float32Array>;

    this.weightAttribute = null!;
    this.distribution = null!;
  }

  setWeightAttribute(name: string): this {
    //@ts-expect-error
    this.weightAttribute = name ? this.geometry.getAttribute(name) : null;

    return this;
  }

  build(): this {
    const indexAttribute = this.indexAttribute;
    const positionAttribute = this.positionAttribute;
    const weightAttribute = this.weightAttribute;

    const totalFaces = indexAttribute ? indexAttribute.count / 3 : positionAttribute.count / 3;
    const faceWeights = new Float32Array(totalFaces);

    // Accumulate weights for each mesh face.

    for (let i = 0; i < totalFaces; i++) {
      let faceWeight = 1;

      let i0 = 3 * i;
      let i1 = 3 * i + 1;
      let i2 = 3 * i + 2;

      if (indexAttribute) {
        i0 = indexAttribute.getX(i0);
        i1 = indexAttribute.getX(i1);
        i2 = indexAttribute.getX(i2);
      }

      if (weightAttribute) {
        faceWeight = weightAttribute.getX(i0) + weightAttribute.getX(i1) + weightAttribute.getX(i2);
      }

      _face.a.fromAttribute(positionAttribute, i0);
      _face.b.fromAttribute(positionAttribute, i1);
      _face.c.fromAttribute(positionAttribute, i2);
      faceWeight *= _face.area();

      faceWeights[i] = faceWeight;
    }

    // Store cumulative total face weights in an array, where weight index
    // corresponds to face index.

    const distribution = new Float32Array(totalFaces);
    let cumulativeTotal = 0;

    for (let i = 0; i < totalFaces; i++) {
      cumulativeTotal += faceWeights[i];
      distribution[i] = cumulativeTotal;
    }

    this.distribution = distribution;
    return this;
  }

  setRandomGenerator(randomFunction: () => number): this {
    this.randomFunction = randomFunction;
    return this;
  }

  sample(targetPosition: Vec3, targetNormal?: Vec3, targetColor?: Color, targetUV?: Vec2): this {
    const faceIndex = this.sampleFaceIndex();
    return this.sampleFace(faceIndex, targetPosition, targetNormal, targetColor, targetUV);
  }

  sampleFaceIndex() {
    const cumulativeTotal = this.distribution[this.distribution.length - 1];

    return this.binarySearch(this.randomFunction() * cumulativeTotal);
  }

  binarySearch(x: number): number {
    const dist = this.distribution;
    let start = 0;
    let end = dist.length - 1;

    let index = -1;

    while (start <= end) {
      const mid = Math.ceil((start + end) / 2);

      if (mid === 0 || (dist[mid - 1] <= x && dist[mid] > x)) {
        index = mid;

        break;
      } else if (x < dist[mid]) {
        end = mid - 1;
      } else {
        start = mid + 1;
      }
    }

    return index;
  }

  sampleFace(faceIndex: number, targetPosition: Vec3, targetNormal?: Vec3, targetColor?: Color, targetUV?: Vec2): this {
    let u = this.randomFunction();
    let v = this.randomFunction();

    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }

    // get the vertex attribute indices
    const indexAttribute = this.indexAttribute;
    let i0 = faceIndex * 3;
    let i1 = faceIndex * 3 + 1;
    let i2 = faceIndex * 3 + 2;
    if (indexAttribute) {
      i0 = indexAttribute.getX(i0);
      i1 = indexAttribute.getX(i1);
      i2 = indexAttribute.getX(i2);
    }

    _face.a.fromAttribute(this.positionAttribute, i0);
    _face.b.fromAttribute(this.positionAttribute, i1);
    _face.c.fromAttribute(this.positionAttribute, i2);

    targetPosition
      .set(0, 0, 0)
      .addScaled(_face.a, u)
      .addScaled(_face.b, v)
      .addScaled(_face.c, 1 - (u + v));

    if (targetNormal !== undefined) {
      if (this.normalAttribute !== undefined) {
        _face.a.fromAttribute(this.normalAttribute, i0);
        _face.b.fromAttribute(this.normalAttribute, i1);
        _face.c.fromAttribute(this.normalAttribute, i2);
        targetNormal
          .set(0, 0, 0)
          .addScaled(_face.a, u)
          .addScaled(_face.b, v)
          .addScaled(_face.c, 1 - (u + v))
          .normalize();
      } else {
        _face.normal(targetNormal);
      }
    }

    if (targetColor !== undefined && this.colorAttribute !== undefined) {
      _face.a.fromAttribute(this.colorAttribute, i0);
      _face.b.fromAttribute(this.colorAttribute, i1);
      _face.c.fromAttribute(this.colorAttribute, i2);

      _color
        .set(0, 0, 0)
        .addScaled(_face.a, u)
        .addScaled(_face.b, v)
        .addScaled(_face.c, 1 - (u + v));

      targetColor.r = _color.x;
      targetColor.g = _color.y;
      targetColor.b = _color.z;
    }

    if (targetUV !== undefined && this.uvAttribute !== undefined) {
      _uva.fromAttribute(this.uvAttribute, i0);
      _uvb.fromAttribute(this.uvAttribute, i1);
      _uvc.fromAttribute(this.uvAttribute, i2);
      targetUV
        .set(0, 0)
        .addScaled(_uva, u)
        .addScaled(_uvb, v)
        .addScaled(_uvc, 1 - (u + v));
    }

    return this;
  }
}
