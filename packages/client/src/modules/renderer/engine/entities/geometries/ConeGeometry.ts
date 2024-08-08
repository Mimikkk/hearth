import { CylinderGeometry } from './CylinderGeometry.js';

export class ConeGeometry extends CylinderGeometry {
  declare parameters: {
    radius: number;
    height: number;
    radialSegments: number;
    heightSegments: number;
    openEnded: boolean;
    thetaStart: number;
    thetaLength: number;
  };

  constructor(
    radius: number = 1,
    height: number = 1,
    radialSegments: number = 32,
    heightSegments: number = 1,
    openEnded: boolean = false,
    thetaStart: number = 0,
    thetaLength: number = Math.PI * 2,
  ) {
    super(0, radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength);

    this.parameters = { radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength };
  }
}
