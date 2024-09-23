import { MeshToonMaterial, MeshToonMaterialParameters } from '../../entities/materials/MeshToonMaterial.js';
import { NodeMaterial } from '../../nodes/materials/NodeMaterial.js';
import { ToonLightModel } from '../../nodes/functions/ToonLightingModel.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { LightModel } from '../../nodes/functions/LightModel.js';

export class MeshToonNodeMaterial extends NodeMaterial {
  constructor(parameters?: MeshToonMaterialParameters) {
    super();

    this.lights = true;

    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }

  setupLightingModel(builder: NodeBuilder): LightModel {
    return new ToonLightModel();
  }
}

const _parameters = new MeshToonMaterial();
