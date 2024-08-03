import { TextureNode } from './TextureNode.js';
import { reflectVector } from './ReflectVectorNode.js';
import { addNodeCommand, proxyNode, vec3 } from '../shadernode/ShaderNodes.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { UVNode } from '@modules/renderer/engine/nodes/accessors/UVNode.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { CubeTexture } from '@modules/renderer/engine/entities/textures/CubeTexture.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

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

export default CubeTextureNode;

export const cubeTexture = proxyNode(CubeTextureNode);
addNodeCommand('cubeTexture', cubeTexture);
