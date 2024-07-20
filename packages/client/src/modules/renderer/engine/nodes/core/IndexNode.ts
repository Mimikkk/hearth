import Node from './Node.ts';
import { varying } from './VaryingNode.js';
import { nodeImmutable } from '../shadernode/ShaderNodes.js';

class IndexNode extends Node {
  static type = 'IndexNode';

  constructor(scope) {
    super('uint');

    this.scope = scope;

    this.isInstanceIndexNode = true;
  }

  generate(builder) {
    const nodeType = this.getNodeType(builder);
    const scope = this.scope;

    let propertyName;

    if (scope === IndexNode.VERTEX) {
      propertyName = builder.getVertexIndex();
    } else if (scope === IndexNode.INSTANCE) {
      propertyName = builder.getInstanceIndex();
    } else {
      throw new Error('engine.IndexNode: Unknown scope: ' + scope);
    }

    let output;

    if (builder.shaderStage === 'vertex' || builder.shaderStage === 'compute') {
      output = propertyName;
    } else {
      const nodeVarying = varying(this);

      output = nodeVarying.build(builder, nodeType);
    }

    return output;
  }
}

IndexNode.VERTEX = 'vertex';
IndexNode.INSTANCE = 'instance';

export default IndexNode;

export const vertexIndex = nodeImmutable(IndexNode, IndexNode.VERTEX);
export const instanceIndex = nodeImmutable(IndexNode, IndexNode.INSTANCE);
