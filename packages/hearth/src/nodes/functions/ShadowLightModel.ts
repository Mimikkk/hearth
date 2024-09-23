import { LightModel } from '../../nodes/functions/LightModel.js';
import { diffuseColor } from '../../nodes/core/PropertyNode.js';
import { f32 } from '../../nodes/shadernode/ShaderNode.primitves.js';

export class ShadowLightModel extends LightModel {
  constructor() {
    super();

    this.shadowNode = f32(1).toVar('shadowMask');
  }

  direct({ shadowMask }) {
    this.shadowNode.mulAssign(shadowMask);
  }

  finish(context) {
    diffuseColor.a.mulAssign(this.shadowNode.oneMinus());

    context.outgoingLight.rgb.assign(diffuseColor.rgb);
  }
}
