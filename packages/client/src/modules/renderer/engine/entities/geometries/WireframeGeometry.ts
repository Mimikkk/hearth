import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';

export class WireframeGeometry extends Geometry {
  constructor(geometry: Geometry) {
    super();

    const vertices = [];
    const edges = new Set<string>();

    const start = Vec3.new();
    const end = Vec3.new();

    if (geometry.index !== null) {
      const position = geometry.attributes.position;
      const indices = geometry.index;
      let groups = geometry.groups;

      if (groups.length === 0) {
        groups = [{ start: 0, count: indices.count, materialIndex: 0 }];
      }

      for (let o = 0, ol = groups.length; o < ol; ++o) {
        const group = groups[o];

        const groupStart = group.start;
        const groupCount = group.count;

        for (let i = groupStart, l = groupStart + groupCount; i < l; i += 3) {
          for (let j = 0; j < 3; j++) {
            const index1 = indices.getX(i + j);
            const index2 = indices.getX(i + ((j + 1) % 3));

            start.fromAttribute(position, index1);
            end.fromAttribute(position, index2);

            if (isUniqueEdge(start, end, edges) === true) {
              vertices.push(start.x, start.y, start.z);
              vertices.push(end.x, end.y, end.z);
            }
          }
        }
      }
    } else {
      const position = geometry.attributes.position;

      for (let i = 0, l = position.count / 3; i < l; i++) {
        for (let j = 0; j < 3; j++) {
          const index1 = 3 * i + j;
          const index2 = 3 * i + ((j + 1) % 3);

          start.fromAttribute(position, index1);
          end.fromAttribute(position, index2);

          if (isUniqueEdge(start, end, edges) === true) {
            vertices.push(start.x, start.y, start.z);
            vertices.push(end.x, end.y, end.z);
          }
        }
      }
    }

    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
  }
}

function isUniqueEdge(start: Vec3, end: Vec3, edges: Set<string>) {
  const hash1 = `${start.x},${start.y},${start.z}-${end.x},${end.y},${end.z}`;
  const hash2 = `${end.x},${end.y},${end.z}-${start.x},${start.y},${start.z}`;

  if (edges.has(hash1) === true || edges.has(hash2) === true) {
    return false;
  } else {
    edges.add(hash1);
    edges.add(hash2);
    return true;
  }
}
