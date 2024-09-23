import { TempNode } from '../core/TempNode.js';
import { asCommand, f32, vec2, vec4 } from '../shadernode/ShaderNode.primitves.js';
import { NodeUpdateStage } from '../core/constants.js';
import { mul } from '../math/OperatorNode.js';
import { uv, UVNode } from '../accessors/UVNode.js';
import { PassTextureNode, texturePass } from './PassNode.js';
import { uniform, UniformNode } from '../core/UniformNode.js';
import { QuadMesh } from '../../entities/QuadMesh.js';
import { implCommand } from '../../nodes/core/Node.commands.js';
import { RenderTarget } from '../../hearth/core/RenderTarget.js';
import { Vec2 } from '../../math/Vec2.js';
import { hsl } from '../../nodes/shadernode/hsl.js';
import { TextureNode } from '../../nodes/accessors/TextureNode.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import NodeFrame from '../../nodes/core/NodeFrame.js';
import { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import { Node } from '../../nodes/core/Node.js';

export class GaussianBlurNode extends TempNode {
  _invSize: UniformNode<Vec2>;
  _passDirection: UniformNode<Vec2>;
  _horizontalRT: RenderTarget;
  _verticalRT: RenderTarget;
  _textureNode: PassTextureNode;
  resolution: Vec2;
  _material: any;

  constructor(
    public textureNode: TextureNode,
    public sigma: Node = f32(2),
    public directionNode: Node = vec2(1),
  ) {
    super(TypeName.vec4);

    this.textureNode = textureNode;
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

  setSize(width: number, height: number): void {
    width = Math.max(Math.round(width * this.resolution.x), 1);
    height = Math.max(Math.round(height * this.resolution.y), 1);

    this._invSize.value.set(1 / width, 1 / height);
    this._horizontalRT.setSize(width, height);
    this._verticalRT.setSize(width, height);
  }

  updateBefore(frame: NodeFrame) {
    const { hearth } = frame;

    const textureNode = this.textureNode;
    const map = textureNode.value;

    const currentRenderTarget = hearth.target;
    const currentTexture = textureNode.value;

    quad1.material = this._material;
    quad2.material = this._material;

    this.setSize(map.image.width, map.image.height);

    const textureType = map.type;

    this._horizontalRT.texture.type = textureType;
    this._verticalRT.texture.type = textureType;

    hearth.updateRenderTarget(this._horizontalRT);

    this._passDirection.value.set(1, 0);

    quad1.render(hearth);

    textureNode.value = this._horizontalRT.texture;
    hearth.updateRenderTarget(this._verticalRT);

    this._passDirection.value.set(0, 1);

    quad2.render(hearth);

    hearth.updateRenderTarget(currentRenderTarget);
    textureNode.value = currentTexture;
  }

  getTextureNode() {
    return this._textureNode;
  }

  setup(builder: NodeBuilder) {
    const textureNode = this.textureNode;
    const uvNode = textureNode.uvNode || uv();

    const sampleTexture = (uv: UVNode) => textureNode.cache().context({ getUV: () => uv, forceUVContext: true });

    const blur = hsl(() => {
      const kernelSize = 3 + 2 * this.sigma.value;
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

    if (!this._material) this._material = builder.createNodeMaterial();
    const material = this._material;

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

const quad1 = new QuadMesh();
const quad2 = new QuadMesh();

export const gaussianBlur = asCommand(GaussianBlurNode);

implCommand('gaussianBlur', GaussianBlurNode);
