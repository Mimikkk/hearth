import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Box3, Sphere, Vec3 } from '@modules/renderer/engine/engine.js';
import { BufferStep } from '@modules/renderer/engine/hearth/constants.js';

export class InstancedPointsGeometry extends Geometry {
  declare isInstancedPointsGeometry: true;
  declare type: string | 'InstancedPointsGeometry';

  constructor() {
    super();

    const positions = [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];
    const uvs = [-1, 1, 1, 1, -1, -1, 1, -1];
    const index = [0, 2, 1, 2, 3, 1];

    this.setIndex(index);
    this.setAttribute('position', new Attribute(new Float32Array(positions), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));
  }

  applyMat4(matrix: Mat4): this {
    const pos = this.attributes.instancePosition;

    if (pos !== undefined) {
      pos.applyMat4(matrix);

      pos.needsUpdate = true;
    }

    if (this.boundingBox !== null) {
      this.computeBoundingBox();
    }

    if (this.boundingSphere !== null) {
      this.computeBoundingSphere();
    }

    return this;
  }

  setPositions(array: Float32Array | number[]): this {
    this.setAttribute('instancePosition', new Attribute(new Float32Array(array), 3, 0, BufferStep.Instance));

    this.computeBoundingBox();
    this.computeBoundingSphere();
    this.instanceCount = this.attributes.instancePosition.count;

    return this;
  }

  setColors(array: Float32Array | number[]): this {
    this.setAttribute('instanceColor', new Attribute(new Float32Array(array), 3, 0, BufferStep.Instance));

    return this;
  }

  computeBoundingBox(): this {
    if (this.boundingBox === null) {
      this.boundingBox = Box3.new();
    }

    const position = this.attributes.instancePosition;

    if (position) this.boundingBox.fromAttribute(position);

    return this;
  }

  computeBoundingSphere(): this {
    if (this.boundingBox === null) this.computeBoundingBox();

    if (this.boundingSphere === null) this.boundingSphere = new Sphere();

    const position = this.attributes.instancePosition;

    if (position) {
      const center = this.boundingSphere.center;
      this.boundingBox!.center(center);

      let maxRadiusSq = 0;
      for (let i = 0, il = position.count; i < il; i++) {
        _vector.fromAttribute(position, i);
        maxRadiusSq = Math.max(maxRadiusSq, center.distanceSqTo(_vector));
      }

      this.boundingSphere.radius = Math.sqrt(maxRadiusSq);
    }
    return this;
  }
}

InstancedPointsGeometry.prototype.isInstancedPointsGeometry = true;
InstancedPointsGeometry.prototype.type = 'InstancedPointsGeometry';

const _vector = Vec3.new();
