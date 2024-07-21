import Node from './Node.ts';
import { nodeImmutable, nodeObject } from '../shadernode/ShaderNodes.js';

class PropertyNode extends Node {
  static type = 'PropertyNode';

  constructor(nodeType, name = null, varying = false) {
    super(nodeType);

    this.name = name;
    this.varying = varying;

    this.isPropertyNode = true;
  }

  getHash(builder) {
    return this.name || super.getHash(builder);
  }

  isGlobal(/*builder*/) {
    return true;
  }

  generate(builder) {
    let nodeVar;

    if (this.varying === true) {
      nodeVar = builder.getVaryingFromNode(this, this.name);
      nodeVar.needsInterpolation = true;
    } else {
      nodeVar = builder.getVarFromNode(this, this.name);
    }

    return builder.getPropertyName(nodeVar);
  }
}

export default PropertyNode;

export const property = (type, name) => nodeObject(new PropertyNode(type, name));
export const varyingProperty = (type, name) => nodeObject(new PropertyNode(type, name, true));

export const diffuseColor = nodeImmutable(PropertyNode, 'vec4', 'DiffuseColor');
export const roughness = nodeImmutable(PropertyNode, 'f32', 'Roughness');
export const metalness = nodeImmutable(PropertyNode, 'f32', 'Metalness');
export const clearcoat = nodeImmutable(PropertyNode, 'f32', 'Clearcoat');
export const clearcoatRoughness = nodeImmutable(PropertyNode, 'f32', 'ClearcoatRoughness');
export const sheen = nodeImmutable(PropertyNode, 'vec3', 'Sheen');
export const sheenRoughness = nodeImmutable(PropertyNode, 'f32', 'SheenRoughness');
export const iridescence = nodeImmutable(PropertyNode, 'f32', 'Iridescence');
export const iridescenceIOR = nodeImmutable(PropertyNode, 'f32', 'IridescenceIOR');
export const iridescenceThickness = nodeImmutable(PropertyNode, 'f32', 'IridescenceThickness');
export const specularColor = nodeImmutable(PropertyNode, 'color', 'SpecularColor');
export const shininess = nodeImmutable(PropertyNode, 'f32', 'Shininess');
export const output = nodeImmutable(PropertyNode, 'vec4', 'Output');
export const dashSize = nodeImmutable(PropertyNode, 'f32', 'dashSize');
export const gapSize = nodeImmutable(PropertyNode, 'f32', 'gapSize');
export const pointWidth = nodeImmutable(PropertyNode, 'f32', 'pointWidth');
