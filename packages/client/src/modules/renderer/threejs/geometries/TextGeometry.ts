import { ExtrudeGeometry, ExtrudeGeometryOptions } from '../Three.js';
import { Font } from '../loaders/FontLoader.js';

export interface TextGeometryParameters extends ExtrudeGeometryOptions {
  font?: Font;
  size?: number;
  height?: number;
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

    if (font === undefined) {
      super(); // generate default extrude geometry
    } else {
      const shapes = font.generateShapes(text, parameters.size);

      parameters.depth = parameters.height !== undefined ? parameters.height : 50;

      if (parameters.bevelThickness === undefined) parameters.bevelThickness = 10;
      if (parameters.bevelSize === undefined) parameters.bevelSize = 8;
      if (parameters.bevelEnabled === undefined) parameters.bevelEnabled = false;

      super(shapes, parameters);
    }
  }
}

TextGeometry.prototype.type = 'TextGeometry';
