import { BufferAttribute, Euler, Geometry, Mat4, Mesh, Vec3 } from '../engine.js';

/**
 * You can use this geometry to create a decal mesh, that serves different kinds of purposes.
 * e.g. adding unique details to models, performing dynamic visual environmental changes or covering seams.
 *
 * Constructor parameter:
 *
 * mesh — Any mesh object
 * position — Position of the decal projector
 * orientation — Orientation of the decal projector
 * size — Size of the decal projector
 *
 * reference: http://blog.wolfire.com/2009/06/how-to-project-decals/
 *
 */

export class DecalGeometry extends Geometry {
  constructor(mesh: Mesh, position: Vec3, orientation: Euler, size: Vec3) {
    super();

    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const plane = Vec3.new();

    const projectorMatrix = new Mat4();
    projectorMatrix.asRotationFromEuler(orientation);
    projectorMatrix.setPosition(position);

    const projectorMatrixInverse = new Mat4();
    projectorMatrixInverse.from(projectorMatrix).invert();

    generate();

    this.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));

    function generate() {
      let decalVertices: DecalVertex[] = [];

      const vertex = Vec3.new();
      const normal = Vec3.new();

      const geometry = mesh.geometry;

      const positionAttribute = geometry.attributes.position;
      const normalAttribute = geometry.attributes.normal;

      if (geometry.index !== null) {
        const index = geometry.index;

        for (let i = 0; i < index.count; i++) {
          vertex.fromAttribute(positionAttribute, index.getX(i));
          normal.fromAttribute(normalAttribute, index.getX(i));

          pushDecalVertex(decalVertices, vertex, normal);
        }
      } else {
        for (let i = 0; i < positionAttribute.count; i++) {
          vertex.fromAttribute(positionAttribute, i);
          normal.fromAttribute(normalAttribute, i);

          pushDecalVertex(decalVertices, vertex, normal);
        }
      }

      decalVertices = clipGeometry(decalVertices, plane.set(1, 0, 0));
      decalVertices = clipGeometry(decalVertices, plane.set(-1, 0, 0));
      decalVertices = clipGeometry(decalVertices, plane.set(0, 1, 0));
      decalVertices = clipGeometry(decalVertices, plane.set(0, -1, 0));
      decalVertices = clipGeometry(decalVertices, plane.set(0, 0, 1));
      decalVertices = clipGeometry(decalVertices, plane.set(0, 0, -1));

      for (let i = 0; i < decalVertices.length; i++) {
        const decalVertex = decalVertices[i];

        uvs.push(0.5 + decalVertex.position.x / size.x, 0.5 + decalVertex.position.y / size.y);

        decalVertex.position.applyMat4(projectorMatrix);

        vertices.push(decalVertex.position.x, decalVertex.position.y, decalVertex.position.z);
        normals.push(decalVertex.normal.x, decalVertex.normal.y, decalVertex.normal.z);
      }
    }

    function pushDecalVertex(decalVertices: DecalVertex[], vertex: Vec3, normal: Vec3) {
      vertex.applyMat4(mesh.matrixWorld);
      vertex.applyMat4(projectorMatrixInverse);

      normal.transformDirection(mesh.matrixWorld);

      decalVertices.push(new DecalVertex(vertex.clone(), normal.clone()));
    }

    function clipGeometry(inVertices: DecalVertex[], plane: Vec3): DecalVertex[] {
      const outVertices = [];

      const s = 0.5 * Math.abs(size.dot(plane));

      for (let i = 0; i < inVertices.length; i += 3) {
        let total = 0;
        let nV1!: DecalVertex;
        let nV2!: DecalVertex;
        let nV3!: DecalVertex;
        let nV4!: DecalVertex;

        const d1 = inVertices[i + 0].position.dot(plane) - s;
        const d2 = inVertices[i + 1].position.dot(plane) - s;
        const d3 = inVertices[i + 2].position.dot(plane) - s;

        const v1Out = d1 > 0;
        const v2Out = d2 > 0;
        const v3Out = d3 > 0;

        total = (v1Out ? 1 : 0) + (v2Out ? 1 : 0) + (v3Out ? 1 : 0);

        switch (total) {
          case 0: {
            outVertices.push(inVertices[i]);
            outVertices.push(inVertices[i + 1]);
            outVertices.push(inVertices[i + 2]);
            break;
          }

          case 1: {
            if (v1Out) {
              nV1 = inVertices[i + 1];
              nV2 = inVertices[i + 2];
              nV3 = clip(inVertices[i], nV1, plane, s);
              nV4 = clip(inVertices[i], nV2, plane, s);
            }

            if (v2Out) {
              nV1 = inVertices[i];
              nV2 = inVertices[i + 2];
              nV3 = clip(inVertices[i + 1], nV1, plane, s);
              nV4 = clip(inVertices[i + 1], nV2, plane, s);

              outVertices.push(nV3);
              outVertices.push(nV2.clone());
              outVertices.push(nV1.clone());

              outVertices.push(nV2.clone());
              outVertices.push(nV3.clone());
              outVertices.push(nV4);
              break;
            }

            if (v3Out) {
              nV1 = inVertices[i];
              nV2 = inVertices[i + 1];
              nV3 = clip(inVertices[i + 2], nV1, plane, s);
              nV4 = clip(inVertices[i + 2], nV2, plane, s);
            }

            outVertices.push(nV1.clone());
            outVertices.push(nV2.clone());
            outVertices.push(nV3);

            outVertices.push(nV4);
            outVertices.push(nV3.clone());
            outVertices.push(nV2.clone());

            break;
          }

          case 2: {
            if (!v1Out) {
              nV1 = inVertices[i].clone();
              nV2 = clip(nV1, inVertices[i + 1], plane, s);
              nV3 = clip(nV1, inVertices[i + 2], plane, s);
              outVertices.push(nV1);
              outVertices.push(nV2);
              outVertices.push(nV3);
            }

            if (!v2Out) {
              nV1 = inVertices[i + 1].clone();
              nV2 = clip(nV1, inVertices[i + 2], plane, s);
              nV3 = clip(nV1, inVertices[i], plane, s);
              outVertices.push(nV1);
              outVertices.push(nV2);
              outVertices.push(nV3);
            }

            if (!v3Out) {
              nV1 = inVertices[i + 2].clone();
              nV2 = clip(nV1, inVertices[i], plane, s);
              nV3 = clip(nV1, inVertices[i + 1], plane, s);
              outVertices.push(nV1);
              outVertices.push(nV2);
              outVertices.push(nV3);
            }

            break;
          }

          case 3: {
            break;
          }
        }
      }

      return outVertices;
    }

    function clip(v0: DecalVertex, v1: DecalVertex, p: Vec3, s: number): DecalVertex {
      const d0 = v0.position.dot(p) - s;
      const d1 = v1.position.dot(p) - s;

      const s0 = d0 / (d0 - d1);

      const v = new DecalVertex(
        Vec3.new(
          v0.position.x + s0 * (v1.position.x - v0.position.x),
          v0.position.y + s0 * (v1.position.y - v0.position.y),
          v0.position.z + s0 * (v1.position.z - v0.position.z),
        ),
        Vec3.new(
          v0.normal.x + s0 * (v1.normal.x - v0.normal.x),
          v0.normal.y + s0 * (v1.normal.y - v0.normal.y),
          v0.normal.z + s0 * (v1.normal.z - v0.normal.z),
        ),
      );

      return v;
    }
  }
}

export class DecalVertex {
  constructor(
    public position: Vec3,
    public normal: Vec3,
  ) {}

  clone(): DecalVertex {
    return new DecalVertex(this.position.clone(), this.normal.clone());
  }
}
