import { NodeMaterial } from './NodeMaterial.js';
import PhongLightingModel from '../functions/PhongLightingModel.js';

import { MeshLambertMaterial } from '../../../threejs/Three.js';

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

  setupLightingModel(/*builder*/) {
    return new PhongLightingModel(false); // ( specular ) -> force lambert
  }
}
