import { LineSegments, Geometry, Float32BufferAttribute, LineBasicMaterial } from '../engine.js';
import { Octree } from '@modules/renderer/engine/math/Octree.js';
import { ColorRepresentation } from '@modules/renderer/engine/math/Color.js';

export class OctreeHelper extends LineSegments {
  declare type: string | 'OctreeHelper';
  octree: Octree;
  color: ColorRepresentation;

  constructor(octree: Octree, color: ColorRepresentation = 0xffff00) {
    super(new Geometry(), new LineBasicMaterial({ color: color, toneMapped: false }));

    this.octree = octree;
    this.color = color;

    this.update();
  }

  update() {
    const vertices: number[] = [];

    function traverse(tree: Octree[]) {
      for (let i = 0; i < tree.length; i++) {
        const min = tree[i].box.min;
        const max = tree[i].box.max;

        vertices.push(max.x, max.y, max.z);
        vertices.push(min.x, max.y, max.z); // 0, 1
        vertices.push(min.x, max.y, max.z);
        vertices.push(min.x, min.y, max.z); // 1, 2
        vertices.push(min.x, min.y, max.z);
        vertices.push(max.x, min.y, max.z); // 2, 3
        vertices.push(max.x, min.y, max.z);
        vertices.push(max.x, max.y, max.z); // 3, 0

        vertices.push(max.x, max.y, min.z);
        vertices.push(min.x, max.y, min.z); // 4, 5
        vertices.push(min.x, max.y, min.z);
        vertices.push(min.x, min.y, min.z); // 5, 6
        vertices.push(min.x, min.y, min.z);
        vertices.push(max.x, min.y, min.z); // 6, 7
        vertices.push(max.x, min.y, min.z);
        vertices.push(max.x, max.y, min.z); // 7, 4

        vertices.push(max.x, max.y, max.z);
        vertices.push(max.x, max.y, min.z); // 0, 4
        vertices.push(min.x, max.y, max.z);
        vertices.push(min.x, max.y, min.z); // 1, 5
        vertices.push(min.x, min.y, max.z);
        vertices.push(min.x, min.y, min.z); // 2, 6
        vertices.push(max.x, min.y, max.z);
        vertices.push(max.x, min.y, min.z); // 3, 7

        traverse(tree[i].subTrees);
      }
    }

    traverse(this.octree.subTrees);

    this.geometry = new Geometry();
    this.geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  }
}
OctreeHelper.prototype.type = 'OctreeHelper';
