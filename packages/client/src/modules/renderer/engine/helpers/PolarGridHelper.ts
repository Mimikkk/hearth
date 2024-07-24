import { LineSegments } from '../objects/LineSegments.js';
import { LineBasicMaterial } from '@modules/renderer/engine/objects/materials/LineBasicMaterial.js';
import { BufferAttribute } from '../core/attributes/BufferAttribute.js';
import { Geometry } from '../core/Geometry.js';
import { Color, ColorRepresentation } from '../math/Color.js';

export class PolarGridHelper extends LineSegments {
  declare type: string | 'PolarGridHelper';

  constructor(
    radius: number = 10,
    sectors: number = 16,
    rings: number = 8,
    divisions: number = 64,
    color1: ColorRepresentation = 0x444444,
    color2: ColorRepresentation = 0x888888,
  ) {
    color1 = Color.new(color1);
    color2 = Color.new(color2);

    const vertices = [];
    const colors = [];

    // create the sectors

    if (sectors > 1) {
      for (let i = 0; i < sectors; i++) {
        const v = (i / sectors) * (Math.PI * 2);

        const x = Math.sin(v) * radius;
        const z = Math.cos(v) * radius;

        vertices.push(0, 0, 0);
        vertices.push(x, 0, z);

        const color = i & 1 ? color1 : color2;

        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);
      }
    }

    // create the rings

    for (let i = 0; i < rings; i++) {
      const color = i & 1 ? color1 : color2;

      const r = radius - (radius / rings) * i;

      for (let j = 0; j < divisions; j++) {
        // first vertex

        let v = (j / divisions) * (Math.PI * 2);

        let x = Math.sin(v) * r;
        let z = Math.cos(v) * r;

        vertices.push(x, 0, z);
        colors.push(color.r, color.g, color.b);

        // second vertex

        v = ((j + 1) / divisions) * (Math.PI * 2);

        x = Math.sin(v) * r;
        z = Math.cos(v) * r;

        vertices.push(x, 0, z);
        colors.push(color.r, color.g, color.b);
      }
    }

    const geometry = new Geometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));

    const material = new LineBasicMaterial({ vertexColors: true, toneMapped: false });

    super(geometry, material);
  }
}

PolarGridHelper.prototype.type = 'PolarGridHelper';
