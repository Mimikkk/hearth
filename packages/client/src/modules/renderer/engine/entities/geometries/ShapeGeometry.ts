import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Shape } from '@modules/renderer/engine/math/curves/Shape.js';
import { ShapeUtils } from '@modules/renderer/engine/utils/ShapeUtils.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';

export class ShapeGeometry extends Geometry {
  declare parameters: {
    shapes: Shape | Shape[];
    curveSegments: number;
  };

  constructor(
    shapes: Shape | Shape[] = new Shape([Vec2.new(0, 0.5), Vec2.new(-0.5, -0.5), Vec2.new(0.5, -0.5)]),
    curveSegments: number = 12,
  ) {
    super();

    this.parameters = {
      shapes: shapes,
      curveSegments: curveSegments,
    };

    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    let groupStart = 0;
    let groupCount = 0;

    if (Array.isArray(shapes) === false) {
      addShape(shapes);
    } else {
      for (let i = 0; i < shapes.length; i++) {
        addShape(shapes[i]);

        this.addGroup(groupStart, groupCount, i);

        groupStart += groupCount;
        groupCount = 0;
      }
    }

    this.setIndex(indices);
    this.setAttribute('position', new Attribute(new Float32Array(vertices), 3));
    this.setAttribute('normal', new Attribute(new Float32Array(normals), 3));
    this.setAttribute('uv', new Attribute(new Float32Array(uvs), 2));

    function addShape(shape: Shape) {
      const indexOffset = vertices.length / 3;
      const points = shape.extractPoints(curveSegments);

      let shapeVertices = points.shape;
      const shapeHoles = points.holes;

      if (ShapeUtils.isClockWise(shapeVertices) === false) {
        shapeVertices = shapeVertices.reverse();
      }

      for (let i = 0, l = shapeHoles.length; i < l; i++) {
        const shapeHole = shapeHoles[i];

        if (ShapeUtils.isClockWise(shapeHole) === true) {
          shapeHoles[i] = shapeHole.reverse();
        }
      }

      const faces = ShapeUtils.triangulateShape(shapeVertices, shapeHoles);

      for (let i = 0, l = shapeHoles.length; i < l; i++) {
        const shapeHole = shapeHoles[i];
        shapeVertices = shapeVertices.concat(shapeHole);
      }

      for (let i = 0, l = shapeVertices.length; i < l; i++) {
        const vertex = shapeVertices[i];

        vertices.push(vertex.x, vertex.y, 0);
        normals.push(0, 0, 1);
        uvs.push(vertex.x, vertex.y);
      }

      for (let i = 0, l = faces.length; i < l; i++) {
        const face = faces[i];

        const a = face[0] + indexOffset;
        const b = face[1] + indexOffset;
        const c = face[2] + indexOffset;

        indices.push(a, b, c);
        groupCount += 3;
      }
    }
  }

  copy(source: this): this {
    super.copy(source);

    this.parameters = Object.assign({}, source.parameters);

    return this;
  }
}
