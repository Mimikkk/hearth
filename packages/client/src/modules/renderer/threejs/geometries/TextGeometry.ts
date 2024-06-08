import { ExtrudeGeometry, ExtrudeGeometryOptions } from '../Three.js';
import { Font } from '../loaders/FontLoader.js';

export interface TextGeometryParameters extends ExtrudeGeometryOptions {
  font: Font;
  size?: number;
  depth?: number;
  bevelEnabled?: boolean;
  curveSegments?: number;
  bevelThickness?: number;
  bevelSize?: number;
  bevelOffset?: number;
  bevelSegments?: number;
}

export class TextGeometry extends ExtrudeGeometry {
  declare type: string | 'TextGeometry';

  constructor(text: string, parameters: TextGeometryParameters) {
    const font = parameters.font;

    const shapes = font.generateShapes(text, parameters.size);

    parameters.depth ??= 50;
    parameters.bevelThickness ??= 10;
    parameters.bevelSize ??= 8;
    parameters.bevelEnabled ??= false;

    super(shapes, parameters);
  }
}

TextGeometry.prototype.type = 'TextGeometry';
