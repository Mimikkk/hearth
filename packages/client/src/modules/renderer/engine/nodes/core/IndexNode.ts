import { Node } from './Node.js';
import { varying } from './VaryingNode.js';
import { fixedNode } from '../shadernode/ShaderNodes.js';
import { ShaderStage } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { BufferStep } from '@modules/renderer/engine/hearth/constants.js';

class IndexNode extends Node {
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
      throw new Error('IndexNode: Unknown scope: ' + scope);
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

IndexNode.VERTEX = BufferStep.Vertex;
IndexNode.INSTANCE = BufferStep.Instance;

export default IndexNode;

export const vertexIndex = fixedNode(IndexNode, IndexNode.VERTEX);
export const instanceIndex = fixedNode(IndexNode, IndexNode.INSTANCE);
