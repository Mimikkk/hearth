import { LineSegments } from '../LineSegments.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { Attribute } from '../../core/Attribute.js';
import { Geometry } from '../../core/Geometry.js';
import { Color } from '../../math/Color.js';

class AxesHelper extends LineSegments {
  constructor(size = 1) {
    const vertices = [0, 0, 0, size, 0, 0, 0, 0, 0, 0, size, 0, 0, 0, 0, 0, 0, size];

    const colors = [1, 0, 0, 1, 0.6, 0, 0, 1, 0, 0.6, 1, 0, 0, 0, 1, 0, 0.6, 1];

    const geometry = new Geometry();
    geometry.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new Attribute(new Float32Array(colors), 3));

    const material = new LineBasicMaterial({ vertexColors: true, toneMapped: false });

    super(geometry, material);
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

    this.geometry.attributes.color.useUpdate = true;

    return this;
  }
}

export { AxesHelper };
