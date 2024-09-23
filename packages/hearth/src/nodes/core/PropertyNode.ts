import { Node } from './Node.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';

export class PropertyNode extends Node {
  constructor(
    type: TypeName,
    public name?: string,
    public varying: boolean = false,
  ) {
    super(type);
  }

  getHash(builder: NodeBuilder): string {
    return this.name || super.getHash(builder);
  }

  isGlobal(): boolean {
    return true;
  }

  generate(builder: NodeBuilder): string {
    let node;

    if (this.varying) {
      node = builder.getVaryingFromNode(this, this.getNodeType(builder));
      node.needsInterpolation = true;
    } else {
      node = builder.getVarFromNode(this, this.name);
    }

    return builder.getPropertyName(node);
  }
}

export const property = (type: TypeName, name: string) => new PropertyNode(type, name, false);
export const varyingProperty = (type: TypeName, name: string) => new PropertyNode(type, name, true);

export const diffuseColor = new PropertyNode(TypeName.vec4, 'DiffuseColor');
export const roughness = new PropertyNode(TypeName.f32, 'Roughness');
export const metalness = new PropertyNode(TypeName.f32, 'Metalness');
export const clearcoat = new PropertyNode(TypeName.f32, 'Clearcoat');
export const clearcoatRoughness = new PropertyNode(TypeName.f32, 'ClearcoatRoughness');
export const sheen = new PropertyNode(TypeName.vec3, 'Sheen');
export const sheenRoughness = new PropertyNode(TypeName.f32, 'SheenRoughness');
export const iridescence = new PropertyNode(TypeName.f32, 'Iridescence');
export const iridescenceIOR = new PropertyNode(TypeName.f32, 'IridescenceIOR');
export const iridescenceThickness = new PropertyNode(TypeName.f32, 'IridescenceThickness');
export const specularColor = new PropertyNode(TypeName.color, 'SpecularColor');
export const shininess = new PropertyNode(TypeName.f32, 'Shininess');
export const output = new PropertyNode(TypeName.vec4, 'Output');
export const dashSize = new PropertyNode(TypeName.f32, 'dashSize');
export const gapSize = new PropertyNode(TypeName.f32, 'gapSize');
export const pointWidth = new PropertyNode(TypeName.f32, 'pointWidth');
