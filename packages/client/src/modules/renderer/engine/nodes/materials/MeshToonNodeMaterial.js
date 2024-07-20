import { MeshToonMaterial } from '@modules/renderer/engine/materials/MeshToonMaterial.ts';
import { NodeMaterial } from '@modules/renderer/engine/nodes/materials/NodeMaterial.js';
import { ToonLightingModel } from '@modules/renderer/engine/nodes/functions/ToonLightingModel.js';

const defaultValues = new MeshToonMaterial();

export class MeshToonNodeMaterial extends NodeMaterial {
  constructor(parameters) {
    super();

    this.isMeshToonNodeMaterial = true;

    this.lights = true;

    this.setDefaultValues(defaultValues);

    this.setValues(parameters);
  }

  setupLightingModel(/*builder*/) {
    return new ToonLightingModel();
  }
}
