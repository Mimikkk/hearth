import { TempNode } from '../core/TempNode.js';
import { f32, hsl, proxyNode, vec2, vec4 } from '../shadernode/ShaderNodes.js';
import { NodeUpdateStage } from '../core/constants.js';
import { mul } from '../math/OperatorNode.js';
import { uv } from '../accessors/UVNode.js';
import { texturePass } from './PassNode.js';
import { uniform } from '../core/UniformNode.js';
import { RenderTarget, Vec2 } from '@modules/renderer/engine/engine.js';
import { QuadMesh } from '@modules/renderer/engine/entities/QuadMesh.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { implCommand } from '@modules/renderer/engine/nodes/core/Node.commands.js';

const quadMesh1 = new QuadMesh();
const quadMesh2 = new QuadMesh();

export class GaussianBlurNode extends TempNode {
  constructor(textureNode, sigma?: ConstNode<number>) {
    super('vec4');

    this.textureNode = textureNode;
    this.sigma = sigma?.value ?? 2;

    this.directionNode = vec2(1);

    this._invSize = uniform(Vec2.new());
    this._passDirection = uniform(Vec2.new());

    this._horizontalRT = new RenderTarget();
    this._horizontalRT.texture.name = 'GaussianBlurNode.horizontal';
    this._verticalRT = new RenderTarget();
    this._verticalRT.texture.name = 'GaussianBlurNode.vertical';

    this._textureNode = texturePass(this, this._verticalRT.texture);

    this.updateBeforeType = NodeUpdateStage.Render;

    this.resolution = Vec2.new(1, 1);
  }

  setSize(width, height) {
    width = Math.max(Math.round(width * this.resolution.x), 1);
    height = Math.max(Math.round(height * this.resolution.y), 1);

    this._invSize.value.set(1 / width, 1 / height);
    this._horizontalRT.setSize(width, height);
    this._verticalRT.setSize(width, height);
  }

  updateBefore(frame) {
    const { hearth } = frame;

    const textureNode = this.textureNode;
    const map = textureNode.value;

    const currentRenderTarget = hearth.target;
    const currentTexture = textureNode.value;

    quadMesh1.material = this._material;
    quadMesh2.material = this._material;

    this.setSize(map.image.width, map.image.height);

    const textureType = map.type;

    this._horizontalRT.texture.type = textureType;
    this._verticalRT.texture.type = textureType;

    hearth.updateRenderTarget(this._horizontalRT);

    this._passDirection.value.set(1, 0);

    quadMesh1.render(hearth);

    textureNode.value = this._horizontalRT.texture;
    hearth.updateRenderTarget(this._verticalRT);

    this._passDirection.value.set(0, 1);

    quadMesh2.render(hearth);

    hearth.updateRenderTarget(currentRenderTarget);
    textureNode.value = currentTexture;
  }

  getTextureNode() {
    return this._textureNode;
  }

  setup(builder) {
    const textureNode = this.textureNode;

    if (textureNode.isTextureNode !== true) {
      console.error('GaussianBlurNode requires a TextureNode.');

      return vec4();
    }

    const uvNode = textureNode.uvNode || uv();

    const sampleTexture = uv => textureNode.cache().context({ getUV: () => uv, forceUVContext: true });

    const blur = hsl(() => {
      const kernelSize = 3 + 2 * this.sigma;
      const gaussianCoefficients = this._getCoefficients(kernelSize);

      const invSize = this._invSize;
      const direction = vec2(this.directionNode).mul(this._passDirection);

      const weightSum = f32(gaussianCoefficients[0]).toVar();
      const diffuseSum = vec4(sampleTexture(uvNode).mul(weightSum)).toVar();

      for (let i = 1; i < kernelSize; i++) {
        const x = f32(i);
        const w = f32(gaussianCoefficients[i]);

        const uvOffset = vec2(direction.mul(invSize.mul(x))).toVar();

        const sample1 = vec4(sampleTexture(uvNode.add(uvOffset)));
        const sample2 = vec4(sampleTexture(uvNode.sub(uvOffset)));

        diffuseSum.addAssign(sample1.add(sample2).mul(w));
        weightSum.addAssign(mul(2.0, w));
      }

      return diffuseSum.div(weightSum);
    });

    const material = this._material || (this._material = builder.createNodeMaterial());
    material.fragmentNode = blur();

    const properties = builder.getNodeProperties(this);
    properties.textureNode = textureNode;

    return this._textureNode;
  }

  _getCoefficients(kernelRadius) {
    const coefficients = [];

    for (let i = 0; i < kernelRadius; i++) {
      coefficients.push((0.39894 * Math.exp((-0.5 * i * i) / (kernelRadius * kernelRadius))) / kernelRadius);
    }

    return coefficients;
  }
}

export const gaussianBlur = proxyNode(GaussianBlurNode);

implCommand('gaussianBlur', GaussianBlurNode);
