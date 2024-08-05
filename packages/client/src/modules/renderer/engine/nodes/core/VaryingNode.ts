import { Node } from './Node.js';
import { proxyNode } from '../shadernode/ShaderNodes.js';
import { ShaderStage } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

export class VaryingNode extends Node {
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
    return this.node.getNodeType(builder);
  }

  generate(builder) {
    const { name, node } = this;
    const type = this.getNodeType(builder);

    const nodeVarying = builder.getVaryingFromNode(this, name, type);

    nodeVarying.needsInterpolation || (nodeVarying.needsInterpolation = builder.shaderStage === ShaderStage.Fragment);

    const propertyName = builder.getPropertyName(nodeVarying, ShaderStage.Vertex);

    builder.flowNodeFromShaderStage(ShaderStage.Vertex, node, type, propertyName);

    return builder.getPropertyName(nodeVarying);
  }
}

export const varying = proxyNode(VaryingNode);

implCommand('varying', VaryingNode);
