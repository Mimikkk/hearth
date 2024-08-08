import { PolyhedronGeometry } from './PolyhedronGeometry.js';

export class TetrahedronGeometry extends PolyhedronGeometry {
  declare parameters: {
    radius: number;
    detail: number;
  };

  constructor(radius: number = 1, detail: number = 0) {
    const vertices: number[] = [1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1];
    const indices: number[] = [2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1];

    super(vertices, indices, radius, detail);

    this.parameters = {
      radius: radius,
      detail: detail,
    };
  }
}
