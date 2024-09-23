import { Geometry } from '../../core/Geometry.js';
import { Attribute } from '../../core/Attribute.js';
import { Vec3 } from '../../math/Vec3.js';
import { Buffer } from '../../core/Buffer.js';

export class SphereGeometry extends Geometry {
  constructor(parameters?: SphereGeometryParameters) {
    super();

    let { radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength } = configure(parameters);
    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);

    let index = 0;
    const grid = [];

    const vertex = Vec3.new();
    const normal = Vec3.new();

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    for (let iy = 0; iy <= heightSegments; iy++) {
      const verticesRow = [];

      const v = iy / heightSegments;

      let uOffset = 0;

      if (iy === 0 && thetaStart === 0) {
        uOffset = 0.5 / widthSegments;
      } else if (iy === heightSegments && thetaEnd === Math.PI) {
        uOffset = -0.5 / widthSegments;
      }

      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;

        vertex.x = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
        vertex.y = radius * Math.cos(thetaStart + v * thetaLength);
        vertex.z = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);

        vertices.push(vertex.x, vertex.y, vertex.z);

        normal.from(vertex).normalize();
        normals.push(normal.x, normal.y, normal.z);

        uvs.push(u + uOffset, 1 - v);

        verticesRow.push(index++);
      }

      grid.push(verticesRow);
    }
    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];

        if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
        if (iy !== heightSegments - 1 || thetaEnd < Math.PI) indices.push(b, c, d);
      }
    }

    this.setIndex(indices);
    this.setAttribute('position', Attribute.use(Buffer.f32(vertices, 3)));
    this.setAttribute('normal', Attribute.use(Buffer.f32(normals, 3)));
    this.setAttribute('uv', Attribute.use(Buffer.f32(uvs, 2)));
  }
}

export interface SphereGeometryParameters {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  phiStart?: number;
  phiLength?: number;
  thetaStart?: number;
  thetaLength?: number;
}

export interface SphereGeometryConfiguration {
  radius: number;
  widthSegments: number;
  heightSegments: number;
  phiStart: number;
  phiLength: number;
  thetaStart: number;
  thetaLength: number;
}

const configure = (parameters?: SphereGeometryParameters): SphereGeometryConfiguration => ({
  radius: parameters?.radius ?? 1,
  widthSegments: parameters?.widthSegments ?? 32,
  heightSegments: parameters?.heightSegments ?? 16,
  phiStart: parameters?.phiStart ?? 0,
  phiLength: parameters?.phiLength ?? Math.PI * 2,
  thetaStart: parameters?.thetaStart ?? 0,
  thetaLength: parameters?.thetaLength ?? Math.PI,
});
