import { Color, DepthTexture, RenderTarget, Texture, Vec4 } from '@modules/renderer/engine/engine.js';
import ClippingContext from '@modules/renderer/engine/hearth/core/ClippingContext.js';

let id = 0;

export class RenderContext {
  declare isRenderContext: true;
  id: number;

  useClearColor: boolean;
  clearColorValue: Color;

  useDepth: boolean;
  depthClearValue: number;

  useClearDepth: boolean;
  clearDepthValue: number;

  useClearStencil: boolean;
  stencilClearValue: number;

  useStencil: boolean;
  clearStencilValue: number;

  useUpdateViewport: boolean;
  viewport: Vec4;

  useUpdateScissor: boolean;
  scissor: Vec4;

  textures: Texture[] | null;
  depthTexture: DepthTexture | null;

  width: number;
  height: number;

  sampleCount: number;

  clip: ClippingContext;

  renderTarget: RenderTarget;
  activeCubeFace: number;
  activeMipmapLevel: number;
  occlusionQueryCount: number;

  constructor() {
    this.id = id++;

    this.useClearColor = true;
    this.clearColorValue = { r: 0, g: 0, b: 0, a: 1 };

    this.useDepth = true;
    this.useClearDepth = true;
    this.clearDepthValue = 1;

    this.useStencil = false;
    this.useClearStencil = true;
    this.clearStencilValue = 1;

    this.useUpdateViewport = false;
    this.viewport = Vec4.new();

    this.useUpdateScissor = false;
    this.scissor = Vec4.new();

    this.textures = null;
    this.depthTexture = null;
    this.activeCubeFace = 0;
    this.sampleCount = 1;

    this.width = 0;
    this.height = 0;
  }
}

export default RenderContext;

RenderContext.prototype.isRenderContext = true;
