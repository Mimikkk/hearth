import { BufferStep } from '@modules/renderer/engine/hearth/constants.js';
import { Box3 } from '@modules/renderer/engine/math/Box3.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { WireframeGeometry } from '@modules/renderer/engine/entities/geometries/WireframeGeometry.js';
import { EdgesGeometry } from '@modules/renderer/engine/entities/geometries/EdgesGeometry.js';
import { Mesh } from '@modules/renderer/engine/entities/Mesh.js';
import { LineSegments } from '@modules/renderer/engine/entities/LineSegments.js';
import { Sphere } from '@modules/renderer/engine/math/Sphere.js';
import { Buffer } from '@modules/renderer/engine/core/Buffer.js';

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

      start.useUpdate = true;
    }

    if (this.boundBox !== null) {
      this.calcBoundBox();
    }

    if (this.boundSphere !== null) {
      this.calcBoundSphere();
    }

    return this;
  }

  setPositions(array: Float32Array): this {
    const instanceBuffer = Buffer.f32(array, 6);

    this.setAttribute('instanceStart', new Attribute(instanceBuffer, 3, 0, BufferStep.Instance));
    this.setAttribute('instanceEnd', new Attribute(instanceBuffer, 3, 3, BufferStep.Instance));

    this.calcBoundBox();
    this.calcBoundSphere();

    return this;
  }

  setColors(array: Float32Array): this {
    const instanceColorBuffer = Buffer.f32(array, 6);

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

    return this;
  }

  calcBoundBox(): this {
    if (this.boundBox === null) {
      this.boundBox = Box3.new();
    }

    const start = this.attributes.instanceStart;
    const end = this.attributes.instanceEnd;

    if (start !== undefined && end !== undefined) {
      this.boundBox.fromAttribute(start);

      _box.fromAttribute(end);

      this.boundBox.union(_box);
    }
    return this;
  }

  calcBoundSphere(): this {
    if (this.boundSphere === null) {
      this.boundSphere = new Sphere();
    }

    if (this.boundBox === null) this.calcBoundBox();

    const start = this.attributes.instanceStart;
    const end = this.attributes.instanceEnd;

    if (start !== undefined && end !== undefined) {
      const center = this.boundSphere.center;

      this.boundBox!.center(center);

      let maxRadiusSq = 0;

      for (let i = 0, il = start.count; i < il; i++) {
        _vector.fromAttribute(start, i);
        maxRadiusSq = Math.max(maxRadiusSq, center.distanceSqTo(_vector));

        _vector.fromAttribute(end, i);
        maxRadiusSq = Math.max(maxRadiusSq, center.distanceSqTo(_vector));
      }

      this.boundSphere.radius = Math.sqrt(maxRadiusSq);

      if (isNaN(this.boundSphere.radius)) {
        console.error(
          'LineSegmentsGeometry.calcBoundSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.',
          this,
        );
      }
    }
    return this;
  }
}
