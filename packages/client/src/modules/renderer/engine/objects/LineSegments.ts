import { Line } from './Line.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { LineMaterial } from '@modules/renderer/engine/lines/LineMaterial.js';
import { Line3 } from '../math/Line3.ts';

export class LineSegments extends Line {
  declare isLineSegments: true;
  declare type: string | 'LineSegments';
  declare material: LineMaterial;

  computeLineDistances() {
    const geometry = this.geometry;

    if (geometry.index === null) {
      const positionAttribute = geometry.attributes.position;
      const lineDistances: number[] = [];

      for (let i = 0, l = positionAttribute.count; i < l; i += 2) {
        _line.fromAttribute(positionAttribute, i, i + 1);

        lineDistances[i] = i === 0 ? 0 : lineDistances[i - 1];
        lineDistances[i + 1] = lineDistances[i] + _line.distance();
      }

      geometry.attributes.lineDistance = new Float32BufferAttribute(lineDistances, 1);
    } else {
      throw Error('Available for non-indexed BufferGeometry only.');
    }

    return this;
  }

  static is(object: any): object is LineSegments {
    return object?.isLineSegments === true;
  }
}

const _line = Line3.new();

LineSegments.prototype.isLineSegments = true;
LineSegments.prototype.type = 'LineSegments';
