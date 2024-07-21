import TempNode from '../core/TempNode.js';
import { addNodeElement, f32, nodeObject, tslFn, vec4 } from '../shadernode/ShaderNodes.js';
import { NodeUpdateType } from '../core/constants.js';
import { uv } from '../accessors/UVNode.js';
import { texture } from '../accessors/TextureNode.js';
import { texturePass } from './PassNode.js';
import { uniform } from '../core/UniformNode.js';
import { RenderTarget } from '@modules/renderer/engine/engine.js';
import { max, sign } from '../math/MathNode.js';
import { QuadMesh } from '../../objects/QuadMesh.js';
import { TextureNode } from '@modules/renderer/engine/nodes/Nodes.js';
import { NodeMaterial } from '@modules/renderer/engine/nodes/materials/NodeMaterial.js';
import NodeFrame from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import type { NodeBuilder } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.js';

const quadMeshComp = new QuadMesh(null);

class AfterImageNode extends TempNode {
  textureNode: TextureNode;
  textureNodeOld: TextureNode;
  damp: any;
  _compRT: RenderTarget;
  _oldRT: RenderTarget;
  _textureNode: TextureNode;
  _materialComposed: NodeMaterial;

  constructor(textureNode: TextureNode, damp: number = 0.96) {
    super(textureNode);

    this.textureNode = textureNode;
    this.textureNodeOld = texture();
    this.damp = uniform(damp);

    this._compRT = new RenderTarget();
    this._compRT.texture.name = 'AfterImageNode.comp';

    this._oldRT = new RenderTarget();
    this._oldRT.texture.name = 'AfterImageNode.old';

    this._textureNode = texturePass(this, this._compRT.texture);

    this.updateBeforeType = NodeUpdateType.RENDER;
  }

  getTextureNode() {
    return this._textureNode;
  }

  setSize(width: number, height: number) {
    this._compRT.setSize(width, height);
    this._oldRT.setSize(width, height);
  }

  updateBefore(frame: NodeFrame) {
    const { renderer } = frame;

    const textureNode = this.textureNode;
    const map = textureNode.value;

    const textureType = map.type;

    this._compRT.texture.type = textureType;
    this._oldRT.texture.type = textureType;

    const currentRenderTarget = renderer.getRenderTarget();
    const currentTexture = textureNode.value;

    this.textureNodeOld.value = this._oldRT.texture;

    // comp
    renderer.setRenderTarget(this._compRT);
    quadMeshComp.render(renderer);

    // Swap the textures
    const temp = this._oldRT;
    this._oldRT = this._compRT;
    this._compRT = temp;

    // set size before swapping fails
    this.setSize(map.image.width, map.image.height);

    renderer.setRenderTarget(currentRenderTarget);
    textureNode.value = currentTexture;
  }

  setup(builder: NodeBuilder): Node | null {
    const textureNode = this.textureNode;
    const textureNodeOld = this.textureNodeOld;

    if (textureNode.isTextureNode !== true) {
      console.error('AfterImageNode requires a TextureNode.');

      return vec4();
    }

    //

    const uvNode = textureNode.uvNode || uv();

    textureNodeOld.uvNode = uvNode;

    const sampleTexture = uv => textureNode.cache().context({ getUV: () => uv, forceUVContext: true });

    const when_gt = tslFn(([x_immutable, y_immutable]) => {
      const y = f32(y_immutable).toVar();
      const x = vec4(x_immutable).toVar();

      return max(sign(x.sub(y)), 0.0);
    });

    const afterImg = tslFn(() => {
      const texelOld = vec4(textureNodeOld);
      const texelNew = vec4(sampleTexture(uvNode));

      texelOld.mulAssign(this.damp.mul(when_gt(texelOld, 0.1)));
      return max(texelNew, texelOld);
    });

    //

    const materialComposed = this._materialComposed || (this._materialComposed = builder.createNodeMaterial());
    materialComposed.fragmentNode = afterImg();

    quadMeshComp.material = materialComposed;

    //

    const properties = builder.getNodeProperties(this);
    properties.textureNode = textureNode;

    //

    return this._textureNode;
  }
}

export const afterImage = (node: Node, damp: number) => nodeObject(new AfterImageNode(nodeObject(node), damp));

addNodeElement('afterImage', afterImage);

export default AfterImageNode;
