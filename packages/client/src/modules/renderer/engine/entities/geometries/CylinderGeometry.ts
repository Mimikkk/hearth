import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';

export class CylinderGeometry extends Geometry {
  declare parameters: {
    radiusTop: number;
    radiusBottom: number;
    height: number;
    radialSegments: number;
    heightSegments: number;
    openEnded: boolean;
    thetaStart: number;
    thetaLength: number;
  };

  constructor(
    radiusTop = 1,
    radiusBottom = 1,
    height = 1,
    radialSegments = 32,
    heightSegments = 1,
    openEnded = false,
    thetaStart = 0,
    thetaLength = Math.PI * 2,
  ) {
    super();

    this.parameters = {
      radiusTop: radiusTop,
      radiusBottom: radiusBottom,
      height: height,
      radialSegments: radialSegments,
      heightSegments: heightSegments,
      openEnded: openEnded,
      thetaStart: thetaStart,
      thetaLength: thetaLength,
    };

    const scope = this;

    radialSegments = Math.floor(radialSegments);
    heightSegments = Math.floor(heightSegments);

    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    let index = 0;
    const indexArray: number[][] = [];
    const halfHeight = height / 2;
    let groupStart = 0;

    generateTorso();

    if (openEnded === false) {
      if (radiusTop > 0) generateCap(true);
      if (radiusBottom > 0) generateCap(false);
    }

    this.setIndex(indices);
    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new Attribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));

    function generateTorso() {
      const normal = Vec3.new();
      const vertex = Vec3.new();

      let groupCount = 0;

      const slope = (radiusBottom - radiusTop) / height;

      for (let y = 0; y <= heightSegments; y++) {
        const indexRow = [];

        const v = y / heightSegments;

        const radius = v * (radiusBottom - radiusTop) + radiusTop;

        for (let x = 0; x <= radialSegments; x++) {
          const u = x / radialSegments;

          const theta = u * thetaLength + thetaStart;

          const sinTheta = Math.sin(theta);
          const cosTheta = Math.cos(theta);

          vertex.x = radius * sinTheta;
          vertex.y = -v * height + halfHeight;
          vertex.z = radius * cosTheta;
          vertices.push(vertex.x, vertex.y, vertex.z);

          normal.set(sinTheta, slope, cosTheta).normalize();
          normals.push(normal.x, normal.y, normal.z);

          uvs.push(u, 1 - v);

          indexRow.push(index++);
        }

        indexArray.push(indexRow);
      }

      for (let x = 0; x < radialSegments; x++) {
        for (let y = 0; y < heightSegments; y++) {
          const a = indexArray[y][x];
          const b = indexArray[y + 1][x];
          const c = indexArray[y + 1][x + 1];
          const d = indexArray[y][x + 1];

          indices.push(a, b, d);
          indices.push(b, c, d);

          groupCount += 6;
        }
      }

      scope.addGroup(groupStart, groupCount, 0);

      groupStart += groupCount;
    }

    function generateCap(top: boolean) {
      const centerIndexStart = index;

      const uv = Vec2.new();
      const vertex = Vec3.new();

      let groupCount = 0;

      const radius = top === true ? radiusTop : radiusBottom;
      const sign = top === true ? 1 : -1;

      for (let x = 1; x <= radialSegments; x++) {
        vertices.push(0, halfHeight * sign, 0);

        normals.push(0, sign, 0);

        uvs.push(0.5, 0.5);

        index++;
      }

      const centerIndexEnd = index;

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * thetaLength + thetaStart;

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        vertex.x = radius * sinTheta;
        vertex.y = halfHeight * sign;
        vertex.z = radius * cosTheta;
        vertices.push(vertex.x, vertex.y, vertex.z);

        normals.push(0, sign, 0);

        uv.x = cosTheta * 0.5 + 0.5;
        uv.y = sinTheta * 0.5 * sign + 0.5;
        uvs.push(uv.x, uv.y);

        index++;
      }

      for (let x = 0; x < radialSegments; x++) {
        const c = centerIndexStart + x;
        const i = centerIndexEnd + x;

        if (top === true) {
          indices.push(i, i + 1, c);
        } else {
          indices.push(i + 1, i, c);
        }

        groupCount += 3;
      }

      scope.addGroup(groupStart, groupCount, top === true ? 1 : 2);

      groupStart += groupCount;
    }
  }

  copy(source: this): this {
    super.copy(source);

    this.parameters = Object.assign({}, source.parameters);

    return this;
  }
}
