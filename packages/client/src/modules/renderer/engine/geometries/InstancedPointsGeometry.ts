import {
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mat4,
  Sphere,
  Uint16BufferAttribute,
} from '../engine.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { NumberArray } from '@modules/renderer/engine/math/MathUtils.js';
import { Const } from '@modules/renderer/engine/math/types.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';

const _vector = new Vec3();

const positions = [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];
const uvs = [-1, 1, 1, 1, -1, -1, 1, -1];
const index = [0, 2, 1, 2, 3, 1];

interface Attributes extends Record<string, Attribute> {
  instancePosition: Attribute;
  instanceColor: Attribute;
  position: Attribute;
  uv: Attribute;
}

export class InstancedPointsGeometry extends InstancedBufferGeometry {
  declare isInstancedPointsGeometry: true;
  declare type: string | 'InstancedPointsGeometry';

  constructor() {
    super();

    this.index = new Uint16BufferAttribute(index, 1);
    this.attributes.uv = new Float32BufferAttribute(uvs, 2);
    this.attributes.position = new Float32BufferAttribute(positions, 3);
  }

  applyMat4(matrix: Const<Mat4>): this {
    const position = this.attributes.instancePosition;

    if (position !== undefined) {
      position.applyMat4(matrix);
      position.needsUpdate = true;
    }

    if (this.boundingBox !== null) this.computeBoundingBox();
    if (this.boundingSphere !== null) this.computeBoundingSphere();

    return this;
  }

  setPositions(array: Const<NumberArray>): this {
    const points = array instanceof Float32Array ? array : new Float32Array(array);

    this.attributes.instancePosition = new InstancedBufferAttribute(points, 3);

    this.computeBoundingBox();
    this.computeBoundingSphere();

    return this;
  }

  setColors(array: Const<NumberArray>): this {
    const colors = array instanceof Float32Array ? array : new Float32Array(array);

    this.attributes.instanceColor = new InstancedBufferAttribute(colors, 3);

    return this;
  }

  computeBoundingBox(): this {
    if (this.boundingBox === null) {
      this.boundingBox = new Box3();
    }

    const position = this.attributes.instancePosition;
    if (position) this.boundingBox.fromAttribute(position);

    return this;
  }

  computeBoundingSphere(): this {
    if (this.boundingSphere === null) this.boundingSphere = Sphere.new();
    if (this.boundingBox === null) this.computeBoundingBox();

    const position = this.attributes.instancePosition;

    if (!position) return this;
    const center = this.boundingSphere.center;
    this.boundingBox!.center(center);

    let maxRadiusSq = 0;
    for (let i = 0, it = position.count; i < it; i++) {
      _vector.fromAttribute(position, i);

      const radiusSq = center.distanceSqTo(_vector);
      if (radiusSq > maxRadiusSq) maxRadiusSq = radiusSq;
    }

    this.boundingSphere.radius = Math.sqrt(maxRadiusSq);

    return this;
  }
}

InstancedPointsGeometry.prototype.isInstancedPointsGeometry = true;
InstancedPointsGeometry.prototype.type = 'InstancedPointsGeometry';
