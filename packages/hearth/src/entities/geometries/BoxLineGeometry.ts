import { Geometry } from '../../core/Geometry.js';
import { Attribute } from '../../core/Attribute.js';

export class BoxLineGeometry extends Geometry {
  constructor(parameters?: BoxLineGeometryParameters) {
    super();
    let { width, height, depth, widthSegments, heightSegments, depthSegments } = configure(parameters);

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

    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
  }
}

export interface BoxLineGeometryParameters {
  width?: number;
  height?: number;
  depth?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
}

export interface BoxLineGeometryConfiguration {
  width: number;
  height: number;
  depth: number;
  widthSegments: number;
  heightSegments: number;
  depthSegments: number;
}

const configure = (parameters?: BoxLineGeometryParameters): BoxLineGeometryConfiguration => ({
  width: parameters?.width ?? 1,
  height: parameters?.height ?? 1,
  depth: parameters?.depth ?? 1,
  widthSegments: parameters?.widthSegments ?? 1,
  heightSegments: parameters?.heightSegments ?? 1,
  depthSegments: parameters?.depthSegments ?? 1,
});
