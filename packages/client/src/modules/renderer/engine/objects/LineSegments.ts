import { Line } from './Line.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

const _start = Vec3.new();
const _end = Vec3.new();

export class LineSegments extends Line {
  declare isLineSegments: true;
  declare type: string | 'LineSegments';

  computeLineDistances() {
    const geometry = this.geometry;

    // we assume non-indexed geometry

    if (geometry.index === null) {
      const positionAttribute = geometry.attributes.position;
      const lineDistances: number[] = [];

      for (let i = 0, l = positionAttribute.count; i < l; i += 2) {
        _start.fromAttribute(positionAttribute, i);
        _end.fromAttribute(positionAttribute, i + 1);

        lineDistances[i] = i === 0 ? 0 : lineDistances[i - 1];
        lineDistances[i + 1] = lineDistances[i] + _start.distanceTo(_end);
      }

      geometry.setAttribute('lineDistance', new BufferAttribute(new Float32Array(lineDistances), 1));
    } else {
      throw Error(
        'engine.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.',
      );
    }

    return this;
  }
}

LineSegments.prototype.isLineSegments = true;
LineSegments.prototype.type = 'LineSegments';
