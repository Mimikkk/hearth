import { LineSegmentsGeometry } from './LineSegmentsGeometry.js';
import { Line } from '@modules/renderer/engine/entities/Line.js';
import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';

export class LineGeometry extends LineSegmentsGeometry {
  setPositions(array: TypedArray): this {


    const length = array.length - 3;
    const points = new Float32Array(2 * length);

    for (let i = 0; i < length; i += 3) {
      points[2 * i] = array[i];
      points[2 * i + 1] = array[i + 1];
      points[2 * i + 2] = array[i + 2];

      points[2 * i + 3] = array[i + 3];
      points[2 * i + 4] = array[i + 4];
      points[2 * i + 5] = array[i + 5];
    }

    super.setPositions(points);

    return this;
  }

  setColors(array: TypedArray): this {


    const length = array.length - 3;
    const colors = new Float32Array(2 * length);

    for (let i = 0; i < length; i += 3) {
      colors[2 * i] = array[i];
      colors[2 * i + 1] = array[i + 1];
      colors[2 * i + 2] = array[i + 2];

      colors[2 * i + 3] = array[i + 3];
      colors[2 * i + 4] = array[i + 4];
      colors[2 * i + 5] = array[i + 5];
    }

    super.setColors(colors);

    return this;
  }

  fromLine(line: Line) {
    const geometry = line.geometry;

    this.setPositions(geometry.attributes.position.array);

    return this;
  }
}
