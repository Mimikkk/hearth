import { LatheGeometry } from './LatheGeometry.js';
import { Path } from '@modules/renderer/engine/math/curves/Path.js';

export class CapsuleGeometry extends LatheGeometry {
  declare parameters: {
    radius: number;
    length: number;
    capSegments: number;
    radialSegments: number;
  };

  constructor(radius: number = 1, length: number = 1, capSegments: number = 4, radialSegments: number = 8) {
    const path = new Path();
    path.absarc(0, -length / 2, radius, Math.PI * 1.5, 0, false);
    path.absarc(0, length / 2, radius, 0, Math.PI * 0.5, false);

    super(path.getPoints(capSegments), radialSegments);

    this.parameters = { radius, length, capSegments, radialSegments };
  }
}
