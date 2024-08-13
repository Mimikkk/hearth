import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { BufferStep } from '@modules/renderer/engine/hearth/constants.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Sphere } from '@modules/renderer/engine/math/Sphere.js';

export class InstancedPointsGeometry extends Geometry {
  declare isInstancedPointsGeometry: true;

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

      pos.useUpdate = true;
    }

    if (this.boundBox !== null) {
      this.calcBoundBox();
    }

    if (this.boundSphere !== null) {
      this.calcBoundSphere();
    }

    return this;
  }

  setPositions(array: Float32Array | number[]): this {
    this.setAttribute('instancePosition', new Attribute(new Float32Array(array), 3, 0, BufferStep.Instance));

    this.calcBoundBox();
    this.calcBoundSphere();

    return this;
  }

  setColors(array: Float32Array | number[]): this {
    this.setAttribute('instanceColor', new Attribute(new Float32Array(array), 3, 0, BufferStep.Instance));

    return this;
  }

  calcBoundBox(): this {
    if (this.boundBox === null) {
      this.boundBox = Box3.new();
    }

    const position = this.attributes.instancePosition;

    if (position) this.boundBox.fromAttribute(position);

    return this;
  }

  calcBoundSphere(): this {
    if (this.boundBox === null) this.calcBoundBox();

    if (this.boundSphere === null) this.boundSphere = new Sphere();

    const position = this.attributes.instancePosition;

    if (position) {
      const center = this.boundSphere.center;
      this.boundBox!.center(center);

      let maxRadiusSq = 0;
      for (let i = 0, il = position.count; i < il; i++) {
        _vector.fromAttribute(position, i);
        maxRadiusSq = Math.max(maxRadiusSq, center.distanceSqTo(_vector));
      }

      this.boundSphere.radius = Math.sqrt(maxRadiusSq);
    }
    return this;
  }
}

InstancedPointsGeometry.prototype.isInstancedPointsGeometry = true;

const _vector = Vec3.new();
