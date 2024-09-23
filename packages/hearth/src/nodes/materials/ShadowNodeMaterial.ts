import { NodeMaterial } from '../../nodes/materials/NodeMaterial.js';
import { ShadowMaterial, ShadowMaterialParameters } from '../../entities/materials/ShadowMaterial.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { ShadowLightModel } from '../../nodes/functions/ShadowLightModel.js';
import { LightModel } from '../../nodes/functions/LightModel.js';

export class ShadowNodeMaterial extends NodeMaterial {
  declare isShadowNodeMaterial: true;

  constructor(parameters?: ShadowMaterialParameters) {
    super();

    this.lights = true;
    this.setDefaultValues(_parameters);
    this.setValues(parameters);
  }

  setupLightingModel(builder: NodeBuilder): LightModel {
    return new ShadowLightModel();
  }
}

ShadowNodeMaterial.prototype.isShadowNodeMaterial = true;

const _parameters = new ShadowMaterial();
