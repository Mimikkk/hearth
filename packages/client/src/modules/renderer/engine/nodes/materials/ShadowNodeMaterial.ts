import { NodeMaterial } from '@modules/renderer/engine/nodes/materials/NodeMaterial.js';
import {
  ShadowMaterial,
  ShadowMaterialParameters,
} from '@modules/renderer/engine/entities/materials/ShadowMaterial.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { ShadowLightModel } from '@modules/renderer/engine/nodes/functions/ShadowLightModel.ts';
import { LightModel } from '@modules/renderer/engine/nodes/functions/LightModel.js';

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
