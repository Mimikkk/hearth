import { TempNode } from '../core/TempNode.js';
import { cameraProjectionMatrix } from './CameraNode.js';
import { modelViewMatrix } from './ModelNode.js';
import { positionLocal } from './PositionNode.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { varying } from '../core/VaryingNode.js';
import { ShaderStage } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class ModelViewProjectionNode extends TempNode {
  constructor(positionNode = null) {
    super('vec4');

    this.positionNode = positionNode;
  }

  setup(builder) {
    if (builder.shaderStage === ShaderStage.Fragment) {
      return varying(builder.context.mvp);
    }

    const position = this.positionNode || positionLocal;

    return cameraProjectionMatrix.mul(modelViewMatrix).mul(position);
  }
}

export const modelViewProjection = asCommand(ModelViewProjectionNode);
