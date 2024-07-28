import { NodeMaterial } from './NodeMaterial.js';
import PhongLightModel from '../functions/PhongLightModel.js';

import { MeshLambertMaterial } from '@modules/renderer/engine/engine.js';

const defaultValues = new MeshLambertMaterial();

export class MeshLambertNodeMaterial extends NodeMaterial {
  static type = 'MeshLambertNodeMaterial';

  constructor(parameters) {
    super();

    this.isMeshLambertNodeMaterial = true;

    this.lights = true;

    this.setDefaultValues(defaultValues);

    this.setValues(parameters);
  }

  setupLightingModel() {
    return new PhongLightModel(false);
  }
}
