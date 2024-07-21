import TempNode from '../core/TempNode.js';
import { cameraProjectionMatrix } from './CameraNode.js';
import { modelViewMatrix } from './ModelNode.js';
import { positionLocal } from './PositionNode.js';
import { nodeProxy } from '../shadernode/ShaderNodes.js';
import { varying } from '../core/VaryingNode.js';
import { ShaderStage } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.types.js';

class ModelViewProjectionNode extends TempNode {
  static type = 'ModelViewProjectionNode';

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

export default ModelViewProjectionNode;

export const modelViewProjection = nodeProxy(ModelViewProjectionNode);
