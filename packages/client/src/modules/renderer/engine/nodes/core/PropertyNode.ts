import { Node } from './Node.js';
import { asNode, fixedNode } from '../shadernode/ShaderNodes.js';

export class PropertyNode extends Node {
  constructor(nodeType, name = null, varying = false) {
    super(nodeType);

    this.name = name;
    this.varying = varying;

    this.isPropertyNode = true;
  }

  getHash(builder) {
    return this.name || super.getHash(builder);
  }

  isGlobal() {
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

export const property = (type, name) => asNode(new PropertyNode(type, name));
export const varyingProperty = (type, name) => asNode(new PropertyNode(type, name, true));

export const diffuseColor = fixedNode(PropertyNode, 'vec4', 'DiffuseColor');
export const roughness = fixedNode(PropertyNode, 'f32', 'Roughness');
export const metalness = fixedNode(PropertyNode, 'f32', 'Metalness');
export const clearcoat = fixedNode(PropertyNode, 'f32', 'Clearcoat');
export const clearcoatRoughness = fixedNode(PropertyNode, 'f32', 'ClearcoatRoughness');
export const sheen = fixedNode(PropertyNode, 'vec3', 'Sheen');
export const sheenRoughness = fixedNode(PropertyNode, 'f32', 'SheenRoughness');
export const iridescence = fixedNode(PropertyNode, 'f32', 'Iridescence');
export const iridescenceIOR = fixedNode(PropertyNode, 'f32', 'IridescenceIOR');
export const iridescenceThickness = fixedNode(PropertyNode, 'f32', 'IridescenceThickness');
export const specularColor = fixedNode(PropertyNode, 'color', 'SpecularColor');
export const shininess = fixedNode(PropertyNode, 'f32', 'Shininess');
export const output = fixedNode(PropertyNode, 'vec4', 'Output');
export const dashSize = fixedNode(PropertyNode, 'f32', 'dashSize');
export const gapSize = fixedNode(PropertyNode, 'f32', 'gapSize');
export const pointWidth = fixedNode(PropertyNode, 'f32', 'pointWidth');
