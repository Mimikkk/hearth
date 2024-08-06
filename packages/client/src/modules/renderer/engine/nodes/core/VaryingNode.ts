import { Node } from './Node.js';
import { asCommand } from '../shadernode/ShaderNodes.js';
import { ShaderStage, TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export class VaryingNode extends Node {
  constructor(
    public node: Node,
    public name: string | null = null,
  ) {
    super();
  }

  isGlobal(): true {
    return true;
  }

  getHash(builder: NodeBuilder): string {
    return this.name || super.getHash(builder);
  }

  getNodeType(builder: NodeBuilder): TypeName {
    return this.node.getNodeType(builder);
  }

  generate(builder: NodeBuilder): string {
    const { name, node } = this;
    const type = this.getNodeType(builder);

    const nodeVarying = builder.getVaryingFromNode(this, type);

    nodeVarying.needsInterpolation || (nodeVarying.needsInterpolation = builder.shaderStage === ShaderStage.Fragment);

    const propertyName = builder.getPropertyName(nodeVarying, ShaderStage.Vertex);

    builder.flowNodeFromShaderStage(ShaderStage.Vertex, node, type, propertyName);

    return builder.getPropertyName(nodeVarying);
  }
}

export const varying = asCommand(VaryingNode);

implCommand('varying', VaryingNode);
