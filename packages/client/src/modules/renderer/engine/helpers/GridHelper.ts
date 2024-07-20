import { LineSegments } from '../objects/LineSegments.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { Color, ColorRepresentation } from '../math/Color.js';

export class GridHelper extends LineSegments {
  declare type: string | 'GridHelper';

  constructor(
    size: number = 10,
    divisions: number = 10,
    color1: ColorRepresentation = 0x444444,
    color2: ColorRepresentation = 0x888888,
  ) {
    color1 = new Color(color1);
    color2 = new Color(color2);

    const center = divisions / 2;
    const step = size / divisions;
    const halfSize = size / 2;

    const vertices: number[] = [];
    const colors: number[] = [];

    for (let i = 0, j = 0, k = -halfSize; i <= divisions; i++, k += step) {
      vertices.push(-halfSize, 0, k, halfSize, 0, k);
      vertices.push(k, 0, -halfSize, k, 0, halfSize);

      const color = i === center ? color1 : color2;

      color.intoArray(colors, j);
      j += 3;
      color.intoArray(colors, j);
      j += 3;
      color.intoArray(colors, j);
      j += 3;
      color.intoArray(colors, j);
      j += 3;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

    const material = new LineBasicMaterial({ vertexColors: true, toneMapped: false });

    super(geometry, material);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

GridHelper.prototype.type = 'GridHelper';
