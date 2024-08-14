import { LatheGeometry } from './LatheGeometry.js';
import { Path } from '@modules/renderer/engine/math/curves/Path.js';

export class CapsuleGeometry extends LatheGeometry {
  constructor(parameters?: CapsuleGeometryParameters) {
    const { radius, length, capSegments, radialSegments } = configure(parameters);

    const path = new Path();
    path.absarc(0, -length / 2, radius, Math.PI * 1.5, 0, false);
    path.absarc(0, length / 2, radius, 0, Math.PI * 0.5, false);

    super(path.getPoints(capSegments), radialSegments);
  }
}

export interface CapsuleGeometryParameters {
  radius?: number;
  length?: number;
  capSegments?: number;
  radialSegments?: number;
}

export interface CapsuleGeometryConfiguration {
  radius: number;
  length: number;
  capSegments: number;
  radialSegments: number;
}

const configure = (parameters?: CapsuleGeometryParameters): CapsuleGeometryConfiguration => ({
  radius: parameters?.radius ?? 1,
  length: parameters?.length ?? 1,
  capSegments: parameters?.capSegments ?? 4,
  radialSegments: parameters?.radialSegments ?? 8,
});
