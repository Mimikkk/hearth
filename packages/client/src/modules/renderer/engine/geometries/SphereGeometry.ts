import { BufferGeometry } from '../core/BufferGeometry.js';
import { Float32BufferAttribute, Uint16BufferAttribute } from '../core/BufferAttribute.js';
import { Vec3 } from '../math/Vector3.js';

export class SphereGeometry extends BufferGeometry {
  declare parameters: SphereGeometryConfiguration;
  declare attributes: {
    position: Float32BufferAttribute;
    normal: Float32BufferAttribute;
    uv: Float32BufferAttribute;
  };

  constructor(parameters?: SphereGeometryParameters) {
    super();

    this.parameters = configure(parameters);
    const { uv, position, normal, index } = generateBuffers(this.parameters);

    this.index = index;
    this.attributes.position = position;
    this.attributes.normal = normal;
    this.attributes.uv = uv;
  }

  static create(parameters?: SphereGeometryParameters): SphereGeometry {
    return new SphereGeometry(parameters);
  }

  copy(source: this): this {
    super.copy(source);

    this.parameters = { ...source.parameters };

    return this;
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
  thetaEnd: number;
}

const configure = (parameters?: SphereGeometryParameters): SphereGeometryConfiguration => {
  const thetaStart = parameters?.thetaStart ?? 0;
  const thetaLength = parameters?.thetaLength ?? Math.PI;

  return {
    radius: parameters?.radius ?? 1,
    widthSegments: Math.max(3, ~~(parameters?.widthSegments ?? 32)),
    heightSegments: Math.max(2, ~~(parameters?.heightSegments ?? 16)),
    phiStart: parameters?.phiStart ?? 0,
    phiLength: parameters?.phiLength ?? Math.PI * 2,
    thetaStart,
    thetaLength,
    thetaEnd: Math.min(thetaStart + thetaLength, Math.PI),
  };
};

const _vec = Vec3.empty();
const generateBuffers = ({
  radius,
  widthSegments,
  heightSegments,
  phiStart,
  phiLength,
  thetaStart,
  thetaLength,
  thetaEnd,
}: SphereGeometryConfiguration): {
  index: Uint16BufferAttribute;
  position: Float32BufferAttribute;
  normal: Float32BufferAttribute;
  uv: Float32BufferAttribute;
} => {
  let index: number = 0;
  const grid: number[][] = [];
  const indices: number[] = [];
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  // generate vertices, normals and uvs

  const isThetaEndPi = thetaEnd === Math.PI;
  for (let y = 0; y <= heightSegments; y++) {
    const verticesRow: number[] = [];

    const v = y / heightSegments;
    const invV = 1 - v;
    // special case for the poles

    const sinTheta = Math.sin(thetaStart + v * thetaLength);
    const cosTheta = Math.cos(thetaStart + v * thetaLength);
    const vecY = radius * cosTheta;

    let uOffset = 0;
    if (y === 0 && thetaStart === 0) {
      uOffset = 0.5 / widthSegments;
    } else if (y === heightSegments && isThetaEndPi) {
      uOffset = -0.5 / widthSegments;
    }

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const phi = phiStart + u * phiLength;
      Vec3.set(_vec, -radius * Math.cos(phi) * sinTheta, vecY, radius * Math.sin(phi) * sinTheta);
      vertices.push(_vec.x, _vec.y, _vec.z);

      Vec3.normalize(_vec);
      normals.push(_vec.x, _vec.y, _vec.z);

      uvs.push(u + uOffset, invV);
      verticesRow.push(index++);
    }

    grid.push(verticesRow);
  }

  // indices

  const moreThanZeroThetaStart = thetaStart > 0;
  const lessThanThetaEnd = thetaEnd < Math.PI;
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = grid[y][x + 1];
      const b = grid[y][x];
      const c = grid[y + 1][x];
      const d = grid[y + 1][x + 1];

      if (y !== 0 || moreThanZeroThetaStart) indices.push(a, b, d);
      if (y + 1 !== heightSegments || lessThanThetaEnd) indices.push(b, c, d);
    }
  }

  return {
    index: new Uint16BufferAttribute(indices, 1),
    position: new Float32BufferAttribute(vertices, 3),
    normal: new Float32BufferAttribute(normals, 3),
    uv: new Float32BufferAttribute(uvs, 2),
  };
};
