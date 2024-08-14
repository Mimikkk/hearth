import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';

export class TorusGeometry extends Geometry {
  constructor(parameters?: TorusGeometryParameters) {
    super();

    let { arc, radialSegments, radius, tube, tubularSegments } = configure(parameters);
    radialSegments = Math.floor(radialSegments);
    tubularSegments = Math.floor(tubularSegments);

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    const center = Vec3.new();
    const vertex = Vec3.new();
    const normal = Vec3.new();

    for (let j = 0; j <= radialSegments; j++) {
      for (let i = 0; i <= tubularSegments; i++) {
        const u = (i / tubularSegments) * arc;
        const v = (j / radialSegments) * Math.PI * 2;

        vertex.x = (radius + tube * Math.cos(v)) * Math.cos(u);
        vertex.y = (radius + tube * Math.cos(v)) * Math.sin(u);
        vertex.z = tube * Math.sin(v);

        vertices.push(vertex.x, vertex.y, vertex.z);

        center.x = radius * Math.cos(u);
        center.y = radius * Math.sin(u);
        normal.asSub(vertex, center).normalize();

        normals.push(normal.x, normal.y, normal.z);

        uvs.push(i / tubularSegments);
        uvs.push(j / radialSegments);
      }
    }

    for (let j = 1; j <= radialSegments; j++) {
      for (let i = 1; i <= tubularSegments; i++) {
        const a = (tubularSegments + 1) * j + i - 1;
        const b = (tubularSegments + 1) * (j - 1) + i - 1;
        const c = (tubularSegments + 1) * (j - 1) + i;
        const d = (tubularSegments + 1) * j + i;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    this.setIndex(indices);
    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new Attribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));
  }
}

export interface TorusGeometryParameters {
  radius?: number;
  tube?: number;
  radialSegments?: number;
  tubularSegments?: number;
  arc?: number;
}

export interface TorusGeometryConfiguration {
  radius: number;
  tube: number;
  radialSegments: number;
  tubularSegments: number;
  arc: number;
}

const configure = (parameters?: TorusGeometryParameters): TorusGeometryConfiguration => ({
  radius: parameters?.radius ?? 1,
  tube: parameters?.tube ?? 0.4,
  radialSegments: parameters?.radialSegments ?? 12,
  tubularSegments: parameters?.tubularSegments ?? 48,
  arc: parameters?.arc ?? Math.PI * 2,
});
