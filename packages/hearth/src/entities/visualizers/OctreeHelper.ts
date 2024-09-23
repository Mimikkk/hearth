import { Octree } from '../../math/Octree.js';
import { ColorRepresentation } from '../../math/Color.js';
import { LineSegments } from '../LineSegments.js';
import { Geometry } from '../../core/Geometry.js';
import { LineBasicMaterial } from '../materials/LineBasicMaterial.js';
import { Attribute } from '../../core/Attribute.js';

export class OctreeHelper extends LineSegments {
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
        vertices.push(min.x, max.y, max.z);
        vertices.push(min.x, max.y, max.z);
        vertices.push(min.x, min.y, max.z);
        vertices.push(min.x, min.y, max.z);
        vertices.push(max.x, min.y, max.z);
        vertices.push(max.x, min.y, max.z);
        vertices.push(max.x, max.y, max.z);

        vertices.push(max.x, max.y, min.z);
        vertices.push(min.x, max.y, min.z);
        vertices.push(min.x, max.y, min.z);
        vertices.push(min.x, min.y, min.z);
        vertices.push(min.x, min.y, min.z);
        vertices.push(max.x, min.y, min.z);
        vertices.push(max.x, min.y, min.z);
        vertices.push(max.x, max.y, min.z);

        vertices.push(max.x, max.y, max.z);
        vertices.push(max.x, max.y, min.z);
        vertices.push(min.x, max.y, max.z);
        vertices.push(min.x, max.y, min.z);
        vertices.push(min.x, min.y, max.z);
        vertices.push(min.x, min.y, min.z);
        vertices.push(max.x, min.y, max.z);
        vertices.push(max.x, min.y, min.z);

        traverse(tree[i].subTrees);
      }
    }

    traverse(this.octree.subTrees);

    this.geometry = new Geometry();
    this.geometry.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
  }
}
