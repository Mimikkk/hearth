import {
  Box3,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mat4,
  Sphere,
  Uint16BufferAttribute,
  Vec3,
} from '../engine.js';
import { Box3_ } from '@modules/renderer/engine/math/Box3.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';

const _vector = new Vec3();

const positions = [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];
const uvs = [-1, 1, 1, 1, -1, -1, 1, -1];
const index = [0, 2, 1, 2, 3, 1];

export class InstancedPointsGeometry extends InstancedBufferGeometry {
  declare isInstancedPointsGeometry: true;
  declare type: string | 'InstancedPointsGeometry';

  constructor() {
    super();

    this.index = new Uint16BufferAttribute(index, 1);
    this.attributes.uv = new Float32BufferAttribute(uvs, 2);
    this.attributes.position = new Float32BufferAttribute(positions, 3);
  }

  applyMat4(matrix: Mat4): this {
    const position = this.attributes.instancePosition;

    if (position !== undefined) {
      position.applyMat4(matrix);

      position.needsUpdate = true;
    }

    if (this.boundingBox !== null) this.computeBoundingBox();
    if (this.boundingSphere !== null) this.computeBoundingSphere();

    return this;
  }

  setPositions(array: Float32Array | number[]): this {
    const points = array instanceof Float32Array ? array : new Float32Array(array);

    this.attributes.instancePosition = new InstancedBufferAttribute(points, 3);

    this.computeBoundingBox();
    this.computeBoundingSphere();

    return this;
  }

  setColors(array: Float32Array | number[]): this {
    const colors = array instanceof Float32Array ? array : new Float32Array(array);

    this.attributes.instanceColor = new InstancedBufferAttribute(colors, 3);

    return this;
  }

  computeBoundingBox(): this {
    if (this.boundingBox === null) {
      this.boundingBox = new Box3();
    }

    const position = this.attributes.instancePosition;
    if (position) Box3_.fillAttribute(this.boundingBox, position);

    return this;
  }

  computeBoundingSphere(): this {
    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    if (this.boundingBox === null) this.computeBoundingBox();

    const position = this.attributes.instancePosition;

    if (!position) return this;
    const center = this.boundingSphere.center;
    Box3_.center_(this.boundingBox!, center);

    let maxRadiusSq = 0;
    for (let i = 0, il = position.count; i < il; i++) {
      Vec3.fillAttribute(_vector, position, i);
      const radiusSq = Vec3.distanceSqTo(center, _vector);
      if (radiusSq > maxRadiusSq) maxRadiusSq = radiusSq;
    }

    this.boundingSphere.radius = Math.sqrt(maxRadiusSq);

    return this;
  }
}

InstancedPointsGeometry.prototype.isInstancedPointsGeometry = true;
InstancedPointsGeometry.prototype.type = 'InstancedPointsGeometry';
