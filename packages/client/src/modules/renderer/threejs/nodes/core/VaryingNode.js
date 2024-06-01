import Node from './Node.ts';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNodes.js';

class VaryingNode extends Node {
  static type = 'VaryingNode';

  constructor(node, name = null) {
    super();

    this.node = node;
    this.name = name;

    this.isVaryingNode = true;
  }

  isGlobal() {
    return true;
  }

  getHash(builder) {
    return this.name || super.getHash(builder);
  }

  getNodeType(builder) {
    // VaryingNode is auto type

    return this.node.getNodeType(builder);
  }

  generate(builder) {
    const { name, node } = this;
    const type = this.getNodeType(builder);

    const nodeVarying = builder.getVaryingFromNode(this, name, type);

    // this property can be used to check if the varying can be optimized for a var
    nodeVarying.needsInterpolation || (nodeVarying.needsInterpolation = builder.shaderStage === 'fragment');

    const propertyName = builder.getPropertyName(nodeVarying, 'vertex');

    // force node run in vertex stage
    builder.flowNodeFromShaderStage('vertex', node, type, propertyName);

    return builder.getPropertyName(nodeVarying);
  }
}

export default VaryingNode;

export const varying = nodeProxy(VaryingNode);

addNodeElement('varying', varying);
