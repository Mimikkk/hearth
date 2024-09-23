import { CylinderGeometry } from './CylinderGeometry.js';

export class ConeGeometry extends CylinderGeometry {
  constructor(parameters?: ConeGeometryParameters) {
    const { radius, ...config } = configure(parameters);

    super({ ...config, radiusBottom: radius, radiusTop: 1 });
  }
}

export interface ConeGeometryParameters {
  radius?: number;
  height?: number;
  radialSegments?: number;
  heightSegments?: number;
  openEnded?: boolean;
  thetaStart?: number;
  thetaLength?: number;
}

export interface ConeGeometryConfiguration {
  radius: number;
  height: number;
  radialSegments: number;
  heightSegments: number;
  openEnded: boolean;
  thetaStart: number;
  thetaLength: number;
}

const configure = (parameters?: ConeGeometryParameters): ConeGeometryConfiguration => ({
  radius: parameters?.radius ?? 1,
  height: parameters?.height ?? 1,
  radialSegments: parameters?.radialSegments ?? 32,
  heightSegments: parameters?.heightSegments ?? 1,
  openEnded: parameters?.openEnded ?? false,
  thetaStart: parameters?.thetaStart ?? 0,
  thetaLength: parameters?.thetaLength ?? Math.PI * 2,
});
