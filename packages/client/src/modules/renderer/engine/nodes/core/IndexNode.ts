import Node from './Node.js';
import { varying } from './VaryingNode.js';
import { nodeImmutable } from '../shadernode/ShaderNodes.js';
import { ShaderStage } from '@modules/renderer/engine/renderers/nodes/NodeBuilder.types.js';
import { GPUVertexStepModeType } from '@modules/renderer/engine/renderers/utils/constants.js';

class IndexNode extends Node {
  static type = 'IndexNode';

  constructor(scope) {
    super('u32');

    this.scope = scope;

    this.isInstanceIndexNode = true;
  }

  generate(builder) {
    const nodeType = this.getNodeType(builder);
    const scope = this.scope;

    let propertyName;

    if (scope === IndexNode.VERTEX) {
      propertyName = builder.useVertexIndex();
    } else if (scope === IndexNode.INSTANCE) {
      propertyName = builder.UseInstanceIndex();
    } else {
      throw new Error('engine.IndexNode: Unknown scope: ' + scope);
    }

    let output;

    if (builder.shaderStage === ShaderStage.Vertex || builder.shaderStage === ShaderStage.Compute) {
      output = propertyName;
    } else {
      const nodeVarying = varying(this);

      output = nodeVarying.build(builder, nodeType);
    }

    return output;
  }
}

IndexNode.VERTEX = GPUVertexStepModeType.Vertex;
IndexNode.INSTANCE = GPUVertexStepModeType.Instance;

export default IndexNode;

export const vertexIndex = nodeImmutable(IndexNode, IndexNode.VERTEX);
export const instanceIndex = nodeImmutable(IndexNode, IndexNode.INSTANCE);
