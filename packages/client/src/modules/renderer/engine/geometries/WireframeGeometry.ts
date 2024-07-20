import { BufferGeometry } from '../core/BufferGeometry.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { Vec3 } from '../math/Vec3.js';

export class WireframeGeometry extends BufferGeometry {
  declare type: string | 'WireframeGeometry';
  declare parameters: {
    geometry: BufferGeometry;
  };

  constructor(geometry: BufferGeometry) {
    super();

    this.type = 'WireframeGeometry';

    this.parameters = {
      geometry: geometry,
    };

    if (geometry !== null) {
      // buffer

      const vertices = [];
      const edges = new Set<string>();

      // helper variables

      const start = new Vec3();
      const end = new Vec3();

      if (geometry.index !== null) {
        // indexed BufferGeometry

        const position = geometry.attributes.position;
        const indices = geometry.index;
        let groups = geometry.groups;

        if (groups.length === 0) {
          groups = [{ start: 0, count: indices.count, materialIndex: 0 }];
        }

        // create a data structure that contains all edges without duplicates

        for (let o = 0, ol = groups.length; o < ol; ++o) {
          const group = groups[o];

          const groupStart = group.start;
          const groupCount = group.count;

          for (let i = groupStart, l = groupStart + groupCount; i < l; i += 3) {
            for (let j = 0; j < 3; j++) {
              const index1 = indices.getX(i + j);
              const index2 = indices.getX(i + ((j + 1) % 3));

              start.fromBufferAttribute(position, index1);
              end.fromBufferAttribute(position, index2);

              if (isUniqueEdge(start, end, edges) === true) {
                vertices.push(start.x, start.y, start.z);
                vertices.push(end.x, end.y, end.z);
              }
            }
          }
        }
      } else {
        // non-indexed BufferGeometry

        const position = geometry.attributes.position;

        for (let i = 0, l = position.count / 3; i < l; i++) {
          for (let j = 0; j < 3; j++) {
            // three edges per triangle, an edge is represented as (index1, index2)
            // e.g. the first triangle has the following edges: (0,1),(1,2),(2,0)

            const index1 = 3 * i + j;
            const index2 = 3 * i + ((j + 1) % 3);

            start.fromBufferAttribute(position, index1);
            end.fromBufferAttribute(position, index2);

            if (isUniqueEdge(start, end, edges) === true) {
              vertices.push(start.x, start.y, start.z);
              vertices.push(end.x, end.y, end.z);
            }
          }
        }
      }

      // build geometry

      this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    }
  }

  copy(source: this): this {
    super.copy(source);

    this.parameters = Object.assign({}, source.parameters);

    return this;
  }
}
WireframeGeometry.prototype.type = 'WireframeGeometry';

function isUniqueEdge(start: Vec3, end: Vec3, edges: Set<string>) {
  const hash1 = `${start.x},${start.y},${start.z}-${end.x},${end.y},${end.z}`;
  const hash2 = `${end.x},${end.y},${end.z}-${start.x},${start.y},${start.z}`; // coincident edge

  if (edges.has(hash1) === true || edges.has(hash2) === true) {
    return false;
  } else {
    edges.add(hash1);
    edges.add(hash2);
    return true;
  }
}
