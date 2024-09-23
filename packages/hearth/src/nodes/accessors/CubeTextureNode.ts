import { TextureNode } from './TextureNode.js';
import { reflectVector } from './ReflectVectorNode.js';
import { asCommand, vec3 } from '../shadernode/ShaderNode.primitves.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { UVNode } from '../../nodes/accessors/UVNode.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { CubeTexture } from '../../entities/textures/CubeTexture.js';
import { Node } from '../../nodes/core/Node.js';
import { implCommand } from '../../nodes/core/Node.commands.js';

export class CubeTextureNode extends TextureNode {
  constructor(value: CubeTexture | Node, uvNode: Node | null, levelNode: Node | null) {
    super(value, uvNode, levelNode);
  }

  getInputType(): TypeName {
    return TypeName.cubeTexture;
  }

  getDefaultUV(): Node {
    return reflectVector;
  }

  setUpdateMatrix() {
    return this;
  }

  setupUV(builder: NodeBuilder, uvNode: UVNode) {
    return vec3(uvNode.x.negate(), uvNode.yz);
  }

  generateUV(builder: NodeBuilder, cubeUV: UVNode) {
    return cubeUV.build(builder, 'vec3');
  }
}

export const cubeTexture = asCommand(CubeTextureNode);

implCommand('cubeTexture', CubeTextureNode);
