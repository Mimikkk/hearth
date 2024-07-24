import { FontManager } from '@modules/renderer/engine/loaders/fonts/FontManager.js';
import {
  ExtrudeGeometry,
  ExtrudeGeometryOptions,
} from '@modules/renderer/engine/objects/geometries/ExtrudeGeometry.js';

export interface TextGeometryParameters extends ExtrudeGeometryOptions {
  font: FontManager;
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
    parameters.size ??= 100;
    parameters.depth ??= 50;
    parameters.bevelThickness ??= 10;
    parameters.bevelSize ??= 8;
    parameters.bevelEnabled ??= false;

    const shapes = parameters.font.createShapes(text, parameters.size);
    super(shapes, parameters);
  }
}

TextGeometry.prototype.type = 'TextGeometry';
