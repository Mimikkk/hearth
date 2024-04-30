import { Line } from './Line.js';
import { Vector3 } from '../math/Vector3.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';

const _start = /*@__PURE__*/ new Vector3();
const _end = /*@__PURE__*/ new Vector3();

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
        _start.fromBufferAttribute(positionAttribute, i);
        _end.fromBufferAttribute(positionAttribute, i + 1);

        lineDistances[i] = i === 0 ? 0 : lineDistances[i - 1];
        lineDistances[i + 1] = lineDistances[i] + _start.distanceTo(_end);
      }

      geometry.setAttribute('lineDistance', new Float32BufferAttribute(lineDistances, 1));
    } else {
      throw Error(
        'THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.',
      );
    }

    return this;
  }
}

LineSegments.prototype.isLineSegments = true;
LineSegments.prototype.type = 'LineSegments';
