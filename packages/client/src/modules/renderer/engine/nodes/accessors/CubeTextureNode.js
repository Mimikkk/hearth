import TextureNode from './TextureNode.js';
import { reflectVector } from './ReflectVectorNode.js';
import { addNodeElement, nodeProxy, vec3 } from '../shadernode/ShaderNodes.js';
import { CoordinateSystem } from '@modules/renderer/engine/engine.ts';

class CubeTextureNode extends TextureNode {
  static type = 'CubeTextureNode';

  constructor(value, uvNode = null, levelNode = null) {
    super(value, uvNode, levelNode);

    this.isCubeTextureNode = true;
  }

  getInputType(/*builder*/) {
    return 'cubeTexture';
  }

  getDefaultUV() {
    return reflectVector;
  }

  setUpdateMatrix(/*updateMatrix*/) {} // Ignore .updateMatrix for CubeTextureNode

  setupUV(builder, uvNode) {
    const texture = this.value;

    if (builder.renderer.coordinateSystem === CoordinateSystem.WebGPU || !texture.isRenderTargetTexture) {
      return vec3(uvNode.x.negate(), uvNode.yz);
    } else {
      return uvNode;
    }
  }

  generateUV(builder, cubeUV) {
    return cubeUV.build(builder, 'vec3');
  }
}

export default CubeTextureNode;

export const cubeTexture = nodeProxy(CubeTextureNode);

addNodeElement('cubeTexture', cubeTexture);
