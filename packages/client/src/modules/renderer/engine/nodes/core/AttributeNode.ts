import { Node } from './Node.js';
import { varying } from './VaryingNode.js';
import { asNode } from '../shadernode/ShaderNodes.js';
import { ShaderStage } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

class AttributeNode extends Node {
  static type = 'AttributeNode';

  constructor(attributeName, nodeType = null) {
    super(nodeType);

    this._attributeName = attributeName;
  }

  isGlobal() {
    return true;
  }

  getHash(builder) {
    return this.getAttributeName(builder);
  }

  getNodeType(builder) {
    let nodeType = super.getNodeType(builder);

    if (nodeType === null) {
      const attributeName = this.getAttributeName(builder);

      if (builder.hasGeometryAttribute(attributeName)) {
        const attribute = builder.geometry.getAttribute(attributeName);

        nodeType = builder.getTypeFromAttribute(attribute);
      } else {
        nodeType = 'f32';
      }
    }

    return nodeType;
  }

  setAttributeName(attributeName) {
    this._attributeName = attributeName;

    return this;
  }

  getAttributeName(/*builder*/) {
    return this._attributeName;
  }

  generate(builder) {
    const attributeName = this.getAttributeName(builder);
    const nodeType = this.getNodeType(builder);
    const geometryAttribute = builder.hasGeometryAttribute(attributeName);

    if (geometryAttribute === true) {
      const attribute = builder.geometry.getAttribute(attributeName);
      const attributeType = builder.getTypeFromAttribute(attribute);

      const nodeAttribute = builder.getAttribute(attributeName, attributeType);

      if (builder.shaderStage === ShaderStage.Vertex) {
        return builder.format(nodeAttribute.name, attributeType, nodeType);
      } else {
        const nodeVarying = varying(this);

        return nodeVarying.build(builder, nodeType);
      }
    } else {
      console.warn(`AttributeNode: Vertex attribute "${attributeName}" not found on geometry.`);

      return builder.generateConst(nodeType);
    }
  }
}

export default AttributeNode;

export const attribute = (name, nodeType) => asNode(new AttributeNode(name, nodeType));
