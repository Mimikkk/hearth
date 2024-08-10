import { LineSegments } from '../LineSegments.js';
import { LineBasicMaterial } from '@modules/renderer/engine/entities/materials/LineBasicMaterial.js';
import { Attribute } from '@modules/renderer/engine/core/Attribute.js';
import { Geometry } from '@modules/renderer/engine/core/Geometry.js';
import { Color, ColorRepresentation } from '../../math/Color.js';
import { Buffer } from '@modules/renderer/engine/core/Buffer.js';

export class GridVisualizer extends LineSegments {
  constructor(parameters?: GridVisualizerParameters) {
    super(createGeometry(configure(parameters)), createMaterial());
  }
}

interface GridVisualizerParameters {
  size?: number;
  divisions?: number;
  centerColor?: ColorRepresentation;
  lineColor?: ColorRepresentation;
}

interface GridVisualizerConfiguration {
  size: number;
  divisions: number;
  centerColor: Color;
  lineColor: Color;
}

const configure = (parameters?: GridVisualizerParameters): GridVisualizerConfiguration => ({
  size: parameters?.size ?? 10,
  divisions: parameters?.divisions ?? 10,
  centerColor: Color.new(parameters?.centerColor ?? 0x444444),
  lineColor: Color.new(parameters?.lineColor ?? 0x888888),
});

const createGeometry = ({ centerColor, lineColor, divisions, size }: GridVisualizerConfiguration) => {
  const centerIndex = divisions / 2;
  const step = size / divisions;
  const halfSize = size / 2;

  const vertices: number[] = [];
  const colors: number[] = new Array((divisions + 1) * 4 * 3);

  for (let i = 0, j = 0, k = -halfSize; i <= divisions; i++, k += step, j += 12) {
    vertices.push(-halfSize, 0, k, halfSize, 0, k, k, 0, -halfSize, k, 0, halfSize);

    const color = i === centerIndex ? centerColor : lineColor;
    color.intoArray(colors, j);
    color.intoArray(colors, j + 3);
    color.intoArray(colors, j + 6);
    color.intoArray(colors, j + 9);
  }

  return Geometry.withAttributes({
    position: Attribute.use(Buffer.f32(vertices, 3)),
    color: Attribute.use(Buffer.f32(colors, 3)),
  });
};
const createMaterial = () => new LineBasicMaterial({ vertexColors: true, toneMapped: false });
