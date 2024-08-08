import { NodeMaterial } from './NodeMaterial.js';
import { LineBasicMaterial } from '@modules/renderer/engine/entities/materials/LineBasicMaterial.js';
import { LineMaterialParameters } from '@modules/renderer/engine/entities/lines/LineMaterial.js';

export class LineBasicNodeMaterial extends NodeMaterial {
  constructor(parameters?: LineMaterialParameters) {
    super();

    this.lights = false;
    this.normals = false;

    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }
}

const _parameters = new LineBasicMaterial();
