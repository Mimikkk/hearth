import { LineSegments } from '../objects/LineSegments.js';
import { LineBasicMaterial } from '@modules/renderer/engine/objects/materials/LineBasicMaterial.js';
import { BufferAttribute } from '../core/attributes/BufferAttribute.js';
import { Geometry } from '../core/Geometry.js';
import { Color } from '../math/Color.js';

class AxesHelper extends LineSegments {
  constructor(size = 1) {
    const vertices = [0, 0, 0, size, 0, 0, 0, 0, 0, 0, size, 0, 0, 0, 0, 0, 0, size];

    const colors = [1, 0, 0, 1, 0.6, 0, 0, 1, 0, 0.6, 1, 0, 0, 0, 1, 0, 0.6, 1];

    const geometry = new Geometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));

    const material = new LineBasicMaterial({ vertexColors: true, toneMapped: false });

    super(geometry, material);

    this.type = 'AxesHelper';
  }

  setColors(xAxisColor, yAxisColor, zAxisColor) {
    const color = Color.new();
    const array = this.geometry.attributes.color.array;

    color.set(xAxisColor);
    color.intoArray(array, 0);
    color.intoArray(array, 3);

    color.set(yAxisColor);
    color.intoArray(array, 6);
    color.intoArray(array, 9);

    color.set(zAxisColor);
    color.intoArray(array, 12);
    color.intoArray(array, 15);

    this.geometry.attributes.color.needsUpdate = true;

    return this;
  }
}

export { AxesHelper };
