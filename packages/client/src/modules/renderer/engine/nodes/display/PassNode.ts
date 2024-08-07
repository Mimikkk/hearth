import { TempNode } from '../core/TempNode.js';
import { TextureNode } from '../accessors/TextureNode.js';
import { NodeUpdateStage } from '../core/constants.js';
import { asCommand } from '../shadernode/ShaderNodes.js';
import { uniform, UniformNode } from '../core/UniformNode.js';
import { perspectiveDepthToViewZ, viewZToOrthographicDepth } from './ViewportDepthNode.js';
import { ICamera } from '@modules/renderer/engine/entities/cameras/Camera.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { RenderTarget } from '@modules/renderer/engine/hearth/core/RenderTarget.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { DepthTexture } from '@modules/renderer/engine/entities/textures/DepthTexture.js';
import { TextureDataType, ToneMapping } from '@modules/renderer/engine/constants.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';

export class PassTextureNode extends TextureNode {
  constructor(pass: PassNode, texture: Texture) {
    super(texture);

    this.passNode = pass;

    this.setUpdateMatrix(false);
  }

  setup(builder) {
    this.passNode.build(builder);

    return super.setup(builder);
  }

  clone() {
    return new this.constructor(this.passNode, this.value);
  }
}

export class PassNode extends TempNode {
  scope: Variant;
  _pixelRatio: number;
  _width: number;
  _height: number;
  renderTarget: RenderTarget;
  updateBeforeType: NodeUpdateStage;
  _textureNode: PassTextureNode;
  _depthTextureNode: PassTextureNode;
  _depthNode: UniformNode<number>;
  _viewZNode: UniformNode<number>;
  _cameraNear: UniformNode<number>;
  _cameraFar: UniformNode<number>;

  constructor(
    public scene: Scene,
    public camera: ICamera,
  ) {
    super(TypeName.vec4);

    this._pixelRatio = 1;
    this._width = 1;
    this._height = 1;

    const depthTexture = new DepthTexture();
    depthTexture.isRenderTargetTexture = true;
    depthTexture.name = 'PostProcessingDepth';

    const target = new RenderTarget(this._width * this._pixelRatio, this._height * this._pixelRatio, {
      type: TextureDataType.HalfFloat,
    });
    target.texture.name = 'PostProcessing';
    target.depthTexture = depthTexture;

    this.renderTarget = target;
    this.updateBeforeType = NodeUpdateStage.Frame;

    this._textureNode = new PassTextureNode(this, target.texture);
    this._depthTextureNode = new PassTextureNode(this, depthTexture);

    this._depthNode = null!;
    this._viewZNode = null!;
    this._cameraNear = uniform(0);
    this._cameraFar = uniform(0);
  }

  isGlobal() {
    return true;
  }

  getTextureNode() {
    return this._textureNode;
  }

  getTextureDepthNode() {
    return this._depthTextureNode;
  }

  getViewZNode() {
    if (this._viewZNode === null) {
      const cameraNear = this._cameraNear;
      const cameraFar = this._cameraFar;

      this._viewZNode = perspectiveDepthToViewZ(this._depthTextureNode, cameraNear, cameraFar);
    }

    return this._viewZNode;
  }

  getDepthNode() {
    if (this._depthNode === null) {
      const cameraNear = this._cameraNear;
      const cameraFar = this._cameraFar;

      this._depthNode = viewZToOrthographicDepth(this.getViewZNode(), cameraNear, cameraFar);
    }

    return this._depthNode;
  }

  setup() {
    return this.scope === PassNode.COLOR ? this.getTextureNode() : this.getDepthNode();
  }

  updateBefore(frame) {
    const { hearth } = frame;
    const { scene, camera } = this;

    this._pixelRatio = hearth._pixelRatio;

    const size = hearth.getSize(Vec2.new());

    this.setSize(size.width, size.height);

    const currentToneMapping = hearth.parameters.toneMapping;
    const currentToneMappingNode = hearth.parameters.toneMappingNode;
    const currentRenderTarget = hearth.target;

    this._cameraNear.value = camera.near;
    this._cameraFar.value = camera.far;

    hearth.parameters.toneMapping = ToneMapping.None;
    hearth.parameters.toneMappingNode = null;
    hearth.updateRenderTarget(this.renderTarget);

    hearth.render(scene, camera);

    hearth.parameters.toneMapping = currentToneMapping;
    hearth.parameters.toneMappingNode = currentToneMappingNode;
    hearth.updateRenderTarget(currentRenderTarget);
  }

  setSize(width, height) {
    this._width = width;
    this._height = height;

    const effectiveWidth = this._width * this._pixelRatio;
    const effectiveHeight = this._height * this._pixelRatio;

    this.renderTarget.setSize(effectiveWidth, effectiveHeight);
  }

  setPixelRatio(pixelRatio) {
    this._pixelRatio = pixelRatio;

    this.setSize(this._width, this._height);
  }
}

enum Variant {
  Color = 'color',
  Depth = 'depth',
}

export class ColorPassNode extends PassNode {
  scope = Variant.Color;
}

export class DepthPassNode extends PassNode {
  scope = Variant.Depth;
}

export const pass = asCommand(ColorPassNode);
export const depthPass = asCommand(DepthPassNode);
export const texturePass = asCommand(PassTextureNode);
