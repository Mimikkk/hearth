import TempNode from '../core/TempNode.js';
import { addNodeCommand, f32, asNode, hsl, vec2, vec3, vec4 } from '../shadernode/ShaderNodes.js';
import { loop } from '../utils/LoopNode.js';
import { uniform } from '../core/UniformNode.js';
import { NodeUpdateStage } from '../core/constants.js';
import { threshold } from './ColorAdjustmentNode.js';
import { uv } from '../accessors/UVNode.js';
import { texturePass } from './PassNode.js';
import { RenderTarget, Vec2 } from '@modules/renderer/engine/engine.js';
import { QuadMesh } from '@modules/renderer/engine/entities/QuadMesh.js';

const quadMesh = new QuadMesh();

class AnamorphicNode extends TempNode {
  constructor(textureNode, tresholdNode, scaleNode, samples) {
    super('vec4');

    this.textureNode = textureNode;
    this.tresholdNode = tresholdNode;
    this.scaleNode = scaleNode;
    this.colorNode = vec3(0.1, 0.0, 1.0);
    this.samples = samples;
    this.resolution = Vec2.new(1, 1);

    this.target = new RenderTarget();
    this.target.texture.name = 'anamorphic';

    this._invSize = uniform(Vec2.new());

    this._textureNode = texturePass(this, this.target.texture);

    this.updateBeforeType = NodeUpdateStage.Render;
  }

  getTextureNode() {
    return this._textureNode;
  }

  setSize(width, height) {
    this._invSize.value.set(1 / width, 1 / height);

    width = Math.max(Math.round(width * this.resolution.x), 1);
    height = Math.max(Math.round(height * this.resolution.y), 1);

    this.target.setSize(width, height);
  }

  updateBefore(frame) {
    const { hearth } = frame;

    const textureNode = this.textureNode;
    const map = textureNode.value;

    this.target.texture.type = map.type;

    const currentRenderTarget = hearth.target;
    const currentTexture = textureNode.value;

    quadMesh.material = this._material;

    this.setSize(map.image.width, map.image.height);

    hearth.updateRenderTarget(this.target);

    quadMesh.render(hearth);

    hearth.updateRenderTarget(currentRenderTarget);
    textureNode.value = currentTexture;
  }

  setup(builder) {
    const textureNode = this.textureNode;

    if (textureNode.isTextureNode !== true) {
      console.error('AnamorphNode requires a TextureNode.');

      return vec4();
    }

    const uvNode = textureNode.uvNode || uv();

    const sampleTexture = uv => textureNode.cache().context({ getUV: () => uv, forceUVContext: true });

    const anamorph = hsl(() => {
      const samples = this.samples;
      const halfSamples = Math.floor(samples / 2);

      const total = vec3(0).toVar();

      loop({ start: -halfSamples, end: halfSamples }, ({ i }) => {
        const softness = f32(i).abs().div(halfSamples).oneMinus();

        const uv = vec2(uvNode.x.add(this._invSize.x.mul(i).mul(this.scaleNode)), uvNode.y);
        const color = sampleTexture(uv);
        const pass = threshold(color, this.tresholdNode).mul(softness);

        total.addAssign(pass);
      });

      return total.mul(this.colorNode);
    });

    const material = this._material || (this._material = builder.createNodeMaterial());
    material.fragmentNode = anamorph();

    const properties = builder.getNodeProperties(this);
    properties.textureNode = textureNode;

    return this._textureNode;
  }
}

export const anamorphic = (node, threshold = 0.9, scale = 3, samples = 32) =>
  asNode(new AnamorphicNode(asNode(node), asNode(threshold), asNode(scale), samples));

addNodeCommand('anamorphic', anamorphic);

export default AnamorphicNode;
