import { NodeMaterial } from './NodeMaterial.js';
import { PhongLightModel } from '../functions/PhongLightModel.js';
import { MeshLambertMaterial, MeshLambertMaterialParameters } from '../../entities/materials/MeshLambertMaterial.js';
import { LightModel } from '../../nodes/functions/LightModel.js';

export class MeshLambertNodeMaterial extends NodeMaterial {
  constructor(parameters?: MeshLambertMaterialParameters) {
    super();

    this.lights = true;

    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }

  setupLightingModel(): LightModel {
    return new PhongLightModel(false);
  }
}

const _parameters = new MeshLambertMaterial();
