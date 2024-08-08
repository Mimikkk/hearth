import { MeshPhysicalNodeMaterial } from './MeshPhysicalNodeMaterial.js';
import { f32 } from '../shadernode/ShaderNode.primitves.ts';
import { SSSLightingModel } from '@modules/renderer/engine/nodes/functions/SSSLightModel.js';
import { Node } from '../core/Node.js';
import { MeshPhysicalMaterialParameters } from '@modules/renderer/engine/entities/materials/MeshPhysicalMaterial.js';

export class MeshSSSNodeMaterial extends MeshPhysicalNodeMaterial {
  thicknessColorNode: Node | null;
  thicknessDistortionNode: Node;
  thicknessAmbientNode: Node;
  thicknessAttenuationNode: Node;
  thicknessPowerNode: Node;
  thicknessScaleNode: Node;

  constructor(parameters?: MeshPhysicalMaterialParameters) {
    super(parameters);

    this.thicknessColorNode = null;
    this.thicknessDistortionNode = f32(0.1);
    this.thicknessAmbientNode = f32(0.0);
    this.thicknessAttenuationNode = f32(0.1);
    this.thicknessPowerNode = f32(2.0);
    this.thicknessScaleNode = f32(10.0);
  }

  get useSSS() {
    return this.thicknessColorNode !== null;
  }

  setupLightingModel() {
    return new SSSLightingModel(this.useClearcoat, this.useSheen, this.useIridescence, this.useSSS);
  }
}
