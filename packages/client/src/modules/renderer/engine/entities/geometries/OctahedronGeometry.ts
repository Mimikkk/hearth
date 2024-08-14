import { PolyhedronGeometry } from './PolyhedronGeometry.js';

export class OctahedronGeometry extends PolyhedronGeometry {
  constructor(parameters?: OctahedronGeometryParameters) {
    const vertices = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1];
    const indices = [0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2];

    const { radius, detail } = configure(parameters);
    super({ vertices, indices, radius, detail });
  }
}

export interface OctahedronGeometryParameters {
  radius?: number;
  detail?: number;
}

export interface OctahedronGeometryConfiguration {
  radius: number;
  detail: number;
}

const configure = (parameters?: OctahedronGeometryParameters): OctahedronGeometryConfiguration => ({
  radius: parameters?.radius ?? 1,
  detail: parameters?.detail ?? 0,
});
