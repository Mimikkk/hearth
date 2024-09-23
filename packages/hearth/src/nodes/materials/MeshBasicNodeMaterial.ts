import { NodeMaterial } from './NodeMaterial.js';
import { MeshBasicMaterial, MeshBasicMaterialParameters } from '../../entities/materials/MeshBasicMaterial.js';

export class MeshBasicNodeMaterial extends NodeMaterial {
  constructor(parameters?: MeshBasicMaterialParameters) {
    super();

    this.lights = false;
    this.normals = false;

    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }
}

const _parameters = new MeshBasicMaterial();
