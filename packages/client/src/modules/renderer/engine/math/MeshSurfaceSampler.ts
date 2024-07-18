import { Triangle } from './Triangle.js';
import { Vec3 } from './Vec3.js';
import { Vec2 } from './Vec2.js';
import type { Mesh } from '../objects/Mesh.js';
import type { Material } from '../materials/Material.js';
import type { Color } from './Color.js';
import { BufferGeometry } from '@modules/renderer/engine/core/BufferGeometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';

const _face = Triangle.empty();
const _color = Vec3.new();
const _uva = Vec2.new();
const _uvb = Vec2.new();
const _uvc = Vec2.new();

type Attributes = {
  position: Attribute;
  normal: Attribute;
  index: Attribute;

  weight?: Attribute;
  color?: Attribute;
  uv?: Attribute;
};

export class MeshSurfaceSampler<TGeometry extends BufferGeometry, TMaterial extends Material | Material[]> {
  random: () => number;
  geometry: BufferGeometry;
  distribution: Float32Array;
  attributes: Attributes;

  constructor(mesh: Mesh) {
    this.geometry = mesh.geometry as never;
    this.random = Math.random;

    this.attributes = this.geometry.attributes as Attributes;

    this.distribution = null!;
  }

  setWeightAttribute(name: string): this {
    this.attributes.weight = this.geometry.attributes[name];
    return this;
  }

  build(): this {
    const { index, position, weight } = this.attributes;

    const totalFaces = index ? index.count / 3 : position.count / 3;
    const faceWeights = new Float32Array(totalFaces);

    // Accumulate weights for each mesh face.
    for (let i = 0; i < totalFaces; i++) {
      let faceWeight = 1;

      let i0 = 3 * i;
      let i1 = 3 * i + 1;
      let i2 = 3 * i + 2;

      if (index) {
        i0 = index.getX(i0);
        i1 = index.getX(i1);
        i2 = index.getX(i2);
      }

      if (weight) {
        faceWeight = weight.getX(i0) + weight.getX(i1) + weight.getX(i2);
      }

      _face.fromAttribute(position, i0, i1, i2);
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

  sample(intoPosition?: Vec3, intoNormal?: Vec3, intoColor?: Color, targetUV?: Vec2): this {
    const faceIndex = this.sampleFaceIndex();

    return this.sampleFace(faceIndex, intoPosition, intoNormal, intoColor, targetUV);
  }

  sampleFaceIndex() {
    const total = this.distribution[this.distribution.length - 1];

    return this.binarySearch(this.random() * total);
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

  sampleFace(faceIndex: number, intoPosition?: Vec3, intoNormal?: Vec3, intoColor?: Color, intoUV?: Vec2): this {
    let u = this.random();
    let v = this.random();

    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }

    const { uv, color, position, normal, index } = this.attributes;

    let i0 = faceIndex * 3;
    let i1 = faceIndex * 3 + 1;
    let i2 = faceIndex * 3 + 2;
    if (index) {
      i0 = index.getX(i0);
      i1 = index.getX(i1);
      i2 = index.getX(i2);
    }

    _face.fromAttribute(position, i0, i1, i2);

    if (intoPosition) {
      intoPosition
        .set(0, 0, 0)
        .addScaled(_face.a, u)
        .addScaled(_face.b, v)
        .addScaled(_face.c, 1 - (u + v));
    }

    if (intoNormal) {
      if (normal) {
        _face.fromAttribute(normal, i0, i1, i2);
        intoNormal
          .set(0, 0, 0)
          .addScaled(_face.a, u)
          .addScaled(_face.b, v)
          .addScaled(_face.c, 1 - (u + v))
          .normalize();
      } else {
        _face.normal(intoNormal);
      }
    }

    if (intoColor && color) {
      _face.fromAttribute(color, i0, i1, i2);

      _color
        .set(0, 0, 0)
        .addScaled(_face.a, u)
        .addScaled(_face.b, v)
        .addScaled(_face.c, 1 - (u + v));

      intoColor.fromVec(_color);
    }

    if (intoUV && uv) {
      _uva.fromAttribute(uv, i0);
      _uvb.fromAttribute(uv, i1);
      _uvc.fromAttribute(uv, i2);

      intoUV
        .set(0, 0)
        .addScaled(_uva, u)
        .addScaled(_uvb, v)
        .addScaled(_uvc, 1 - (u + v));
    }

    return this;
  }
}
