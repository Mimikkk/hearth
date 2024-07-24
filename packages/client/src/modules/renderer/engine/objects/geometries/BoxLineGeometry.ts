import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { BufferAttribute } from '@modules/renderer/engine/core/attributes/BufferAttribute.js';

export class BoxLineGeometry extends Geometry {
  constructor(
    width: number = 1,
    height: number = 1,
    depth: number = 1,
    widthSegments: number = 1,
    heightSegments: number = 1,
    depthSegments: number = 1,
  ) {
    super();

    widthSegments = Math.floor(widthSegments);
    heightSegments = Math.floor(heightSegments);
    depthSegments = Math.floor(depthSegments);

    const widthHalf = width / 2;
    const heightHalf = height / 2;
    const depthHalf = depth / 2;

    const segmentWidth = width / widthSegments;
    const segmentHeight = height / heightSegments;
    const segmentDepth = depth / depthSegments;

    const vertices = [];

    let x = -widthHalf;
    let y = -heightHalf;
    let z = -depthHalf;

    for (let i = 0; i <= widthSegments; i++) {
      vertices.push(x, -heightHalf, -depthHalf, x, heightHalf, -depthHalf);
      vertices.push(x, heightHalf, -depthHalf, x, heightHalf, depthHalf);
      vertices.push(x, heightHalf, depthHalf, x, -heightHalf, depthHalf);
      vertices.push(x, -heightHalf, depthHalf, x, -heightHalf, -depthHalf);

      x += segmentWidth;
    }

    for (let i = 0; i <= heightSegments; i++) {
      vertices.push(-widthHalf, y, -depthHalf, widthHalf, y, -depthHalf);
      vertices.push(widthHalf, y, -depthHalf, widthHalf, y, depthHalf);
      vertices.push(widthHalf, y, depthHalf, -widthHalf, y, depthHalf);
      vertices.push(-widthHalf, y, depthHalf, -widthHalf, y, -depthHalf);

      y += segmentHeight;
    }

    for (let i = 0; i <= depthSegments; i++) {
      vertices.push(-widthHalf, -heightHalf, z, -widthHalf, heightHalf, z);
      vertices.push(-widthHalf, heightHalf, z, widthHalf, heightHalf, z);
      vertices.push(widthHalf, heightHalf, z, widthHalf, -heightHalf, z);
      vertices.push(widthHalf, -heightHalf, z, -widthHalf, -heightHalf, z);

      z += segmentDepth;
    }

    this.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
  }
}
