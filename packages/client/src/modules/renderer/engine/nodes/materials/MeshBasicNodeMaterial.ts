import { NodeMaterial } from './NodeMaterial.js';
import { MeshBasicMaterial } from '@modules/renderer/engine/entities/materials/MeshBasicMaterial.js';

const defaultValues = new MeshBasicMaterial();

export class MeshBasicNodeMaterial extends NodeMaterial {
  static type = 'MeshBasicNodeMaterial';

  constructor(parameters) {
    super();

    this.isMeshBasicNodeMaterial = true;

    this.lights = false;
    //this.normals = false; @TODO: normals usage by context

    this.setDefaultValues(defaultValues);

    this.setValues(parameters);
  }
}
