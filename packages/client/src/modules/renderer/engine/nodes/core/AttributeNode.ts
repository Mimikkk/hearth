import { Node } from './Node.js';
import { varying } from './VaryingNode.js';
import { asCommand } from '../shadernode/ShaderNode.primitves.ts';
import { ShaderStage, TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

export class AttributeNode extends Node {
  constructor(
    public name: string,
    type: TypeName,
  ) {
    super(type);
  }

  isGlobal() {
    return true;
  }

  getHash(): string {
    return this.name;
  }

  getNodeType(builder: NodeBuilder) {
    let type = super.getNodeType(builder);

    if (!type) {
      const name = this.name;

      if (builder.hasGeometryAttribute(name)) {
        const attribute = builder.geometry!.getAttribute(name);
        type = TypeName.ofAttribute(attribute);
      } else {
        type = TypeName.vec3;
      }
    }

    return type;
  }

  generate(builder: NodeBuilder): string {
    const name = this.name;
    const type = this.getNodeType(builder);
    const hasAttribute = builder.hasGeometryAttribute(name);

    if (hasAttribute) {
      const attribute = builder.geometry!.getAttribute(name);
      const attributeType = TypeName.ofAttribute(attribute);

      const nodeAttribute = builder.getAttribute(name, attributeType);

      if (builder.shaderStage === ShaderStage.Vertex) {
        return builder.format(nodeAttribute.name, attributeType, type);
      } else {
        const nodeVarying = varying(this);

        return nodeVarying.build(builder, type);
      }
    } else {
      console.warn(`AttributeNode: Vertex attribute "${name}" not found on geometry.`);
      return builder.codeConst(type);
    }
  }
}

export const attribute = asCommand(AttributeNode);
