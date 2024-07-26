import { Color, DepthTexture, RenderTarget, Texture, Vec4 } from '@modules/renderer/engine/engine.js';
import ClippingContext from '@modules/renderer/engine/renderers/ClippingContext.js';

let id = 0;

export class RenderContext {
  declare isRenderContext: true;
  id: number;

  useColor: boolean;
  useClearColor: boolean;
  clearColor: Color;

  useDepth: boolean;
  useClearDepth: boolean;
  clearDepth: number;

  useStencil: boolean;
  useClearStencil: boolean;
  clearStencil: number;

  useViewport: boolean;
  viewport: Vec4;

  useScissor: boolean;
  scissor: Vec4;

  textures: Texture[] | null;
  depthTexture: DepthTexture | null;

  width: number;
  height: number;

  sampleCount: number;

  clippingContext: ClippingContext;

  renderTarget: RenderTarget;
  activeCubeFace: number;
  activeMipmapLevel: number;
  occlusionQueryCount: number;

  constructor() {
    this.id = id++;

    this.useColor = true;
    this.useClearColor = true;
    this.clearColor = Color.new(0, 0, 0, 1);

    this.useDepth = true;
    this.useClearDepth = true;
    this.clearDepth = 1;

    this.useStencil = false;
    this.useClearStencil = true;
    this.clearStencil = 1;

    this.useViewport = false;
    this.viewport = Vec4.new();

    this.useScissor = false;
    this.scissor = Vec4.new();

    this.textures = null;
    this.depthTexture = null;

    this.activeCubeFace = 0;
    this.activeMipmapLevel = 0;
    this.sampleCount = 1;

    this.width = 0;
    this.height = 0;
  }
}

export default RenderContext;

RenderContext.prototype.isRenderContext = true;
