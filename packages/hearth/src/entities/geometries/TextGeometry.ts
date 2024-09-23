import { FontManager } from '../../loaders/fonts/FontManager.js';
import { ExtrudeGeometry, ExtrudeGeometryParameters } from './ExtrudeGeometry.js';

export class TextGeometry extends ExtrudeGeometry {
  constructor(text: string, parameters: TextGeometryParameters) {
    const configuration = configure(parameters);
    const shapes = configuration.font.createShapes(text, configuration.size);
    super({ ...parameters, ...configuration, shapes });
  }
}

export interface TextGeometryParameters extends ExtrudeGeometryParameters {
  font: FontManager;
  size?: number;
}

export interface TextGeometryConfiguration {
  font: FontManager;
  size: number;
  depth: number;
  bevelEnabled: boolean;
  curveSegments: number;
  bevelThickness: number;
  bevelSize: number;
  bevelOffset: number;
  bevelSegments: number;
}

const configure = (parameters: TextGeometryParameters): TextGeometryConfiguration => ({
  font: parameters.font,
  size: parameters.size ?? 100,
  depth: parameters.depth ?? 50,
  bevelEnabled: parameters.bevelEnabled ?? false,
  curveSegments: parameters.curveSegments ?? 12,
  bevelThickness: parameters.bevelThickness ?? 10,
  bevelSize: parameters.bevelSize ?? 8,
  bevelOffset: parameters.bevelOffset ?? 0,
  bevelSegments: parameters.bevelSegments ?? 3,
});
