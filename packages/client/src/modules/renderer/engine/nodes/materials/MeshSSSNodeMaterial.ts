import { MeshPhysicalNodeMaterial } from './MeshPhysicalNodeMaterial.js';
import { f32 } from '../shadernode/ShaderNode.primitves.ts';
import { SSSLightingModel } from '@modules/renderer/engine/nodes/functions/SSSLightModel.js';

export class MeshSSSNodeMaterial extends MeshPhysicalNodeMaterial {
  static type = 'MeshSSSNodeMaterial';

  constructor(parameters) {
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

  copy(source) {
    this.thicknessColorNode = source.thicknessColorNode;
    this.thicknessDistortionNode = source.thicknessDistortionNode;
    this.thicknessAmbientNode = source.thicknessAmbientNode;
    this.thicknessAttenuationNode = source.thicknessAttenuationNode;
    this.thicknessPowerNode = source.thicknessPowerNode;
    this.thicknessScaleNode = source.thicknessScaleNode;

    return super.copy(source);
  }
}
