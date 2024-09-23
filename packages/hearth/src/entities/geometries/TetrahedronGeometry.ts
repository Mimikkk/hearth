import { PolyhedronGeometry } from './PolyhedronGeometry.js';

export class TetrahedronGeometry extends PolyhedronGeometry {
  constructor(parameters?: TetrahedronGeometryParameters) {
    const vertices: number[] = [1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1];
    const indices: number[] = [2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1];
    const { radius, detail } = configure(parameters);
    super({ vertices, indices, radius, detail });
  }
}

export interface TetrahedronGeometryParameters {
  radius?: number;
  detail?: number;
}

export interface TetrahedronGeometryConfiguration {
  radius: number;
  detail: number;
}

const configure = (parameters?: TetrahedronGeometryParameters): TetrahedronGeometryConfiguration => ({
  radius: parameters?.radius ?? 1,
  detail: parameters?.detail ?? 0,
});
