import {
  MeshToonMaterial,
  MeshToonMaterialParameters,
} from '@modules/renderer/engine/entities/materials/MeshToonMaterial.js';
import { NodeMaterial } from '@modules/renderer/engine/nodes/materials/NodeMaterial.js';
import { ToonLightModel } from '@modules/renderer/engine/nodes/functions/ToonLightingModel.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { LightModel } from '@modules/renderer/engine/nodes/functions/LightModel.js';

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
