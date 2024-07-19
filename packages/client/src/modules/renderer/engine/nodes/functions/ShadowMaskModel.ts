import LightingModel from '../core/LightingModel.js';
import { diffuseColor } from '../core/PropertyNode.js';
import { float } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.js';

export class ShadowMaskModel extends LightingModel {
  constructor() {
    super();

    this.shadowNode = float(1).toVar('shadowMask');
  }

  direct({ shadowMask }) {
    this.shadowNode.mulAssign(shadowMask);
  }

  finish(context) {
    diffuseColor.a.mulAssign(this.shadowNode.oneMinus());

    context.outgoingLight.rgb.assign(diffuseColor.rgb);
  }
}
