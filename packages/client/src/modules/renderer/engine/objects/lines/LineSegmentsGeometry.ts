import {
  Box3,
  Buffer,
  Attribute,
  EdgesGeometry,
  Geometry,
  LineSegments,
  Mat4,
  Mesh,
  Sphere,
  Vec3,
  WireframeGeometry,
} from '../../engine.js';
import { BufferStep } from '@modules/renderer/engine/renderers/constants.js';

const _box = Box3.new();
const _vector = Vec3.new();

export class LineSegmentsGeometry extends Geometry {
  constructor() {
    super();

    const positions = [-1, 2, 0, 1, 2, 0, -1, 1, 0, 1, 1, 0, -1, 0, 0, 1, 0, 0, -1, -1, 0, 1, -1, 0];
    const uvs = [-1, 2, 1, 2, -1, 1, 1, 1, -1, -1, 1, -1, -1, -2, 1, -2];
    const index = [0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5];

    this.setIndex(index);
    this.setAttribute('position', new Attribute(new Float32Array(positions), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));
  }

  applyMat4(matrix: Mat4): this {
    const start = this.attributes.instanceStart;
    const end = this.attributes.instanceEnd;

    if (start !== undefined) {
      start.applyMat4(matrix);

      end.applyMat4(matrix);

      start.needsUpdate = true;
    }

    if (this.boundingBox !== null) {
      this.computeBoundingBox();
    }

    if (this.boundingSphere !== null) {
      this.computeBoundingSphere();
    }

    return this;
  }

  setPositions(array: Float32Array): this {
    const instanceBuffer = new Buffer(array, 6);

    this.setAttribute('instanceStart', new Attribute(instanceBuffer, 3, 0, BufferStep.Instance));
    this.setAttribute('instanceEnd', new Attribute(instanceBuffer, 3, 3, BufferStep.Instance));
    this.instanceCount = this.attributes.instanceStart.count;

    this.computeBoundingBox();
    this.computeBoundingSphere();

    return this;
  }

  setColors(array: Float32Array): this {
    const instanceColorBuffer = new Buffer(array, 6);

    this.setAttribute('instanceColorStart', new Attribute(instanceColorBuffer, 3, 0, BufferStep.Instance));
    this.setAttribute('instanceColorEnd', new Attribute(instanceColorBuffer, 3, 3, BufferStep.Instance));

    return this;
  }

  fromWireframeGeometry(geometry: WireframeGeometry): this {
    this.setPositions(geometry.attributes.position.array as Float32Array);

    return this;
  }

  fromEdgesGeometry(geometry: EdgesGeometry): this {
    this.setPositions(geometry.attributes.position.array as Float32Array);

    return this;
  }

  fromMesh(mesh: Mesh): this {
    this.fromWireframeGeometry(new WireframeGeometry(mesh.geometry));

    return this;
  }

  fromLineSegments(lineSegments: LineSegments): this {
    const geometry = lineSegments.geometry;

    this.setPositions(geometry.attributes.position.array as Float32Array);

    // set colors, maybe

    return this;
  }

  computeBoundingBox(): this {
    if (this.boundingBox === null) {
      this.boundingBox = Box3.new();
    }

    const start = this.attributes.instanceStart;
    const end = this.attributes.instanceEnd;

    if (start !== undefined && end !== undefined) {
      this.boundingBox.fromAttribute(start);

      _box.fromAttribute(end);

      this.boundingBox.union(_box);
    }
    return this;
  }

  computeBoundingSphere(): this {
    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    if (this.boundingBox === null) this.computeBoundingBox();

    const start = this.attributes.instanceStart;
    const end = this.attributes.instanceEnd;

    if (start !== undefined && end !== undefined) {
      const center = this.boundingSphere.center;

      this.boundingBox!.center(center);

      let maxRadiusSq = 0;

      for (let i = 0, il = start.count; i < il; i++) {
        _vector.fromAttribute(start, i);
        maxRadiusSq = Math.max(maxRadiusSq, center.distanceSqTo(_vector));

        _vector.fromAttribute(end, i);
        maxRadiusSq = Math.max(maxRadiusSq, center.distanceSqTo(_vector));
      }

      this.boundingSphere.radius = Math.sqrt(maxRadiusSq);

      if (isNaN(this.boundingSphere.radius)) {
        console.error(
          'engine.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.',
          this,
        );
      }
    }
    return this;
  }
}
