import { Color, RenderTarget, Vec4 } from '@modules/renderer/engine/engine.js';
import ClippingContext from '@modules/renderer/engine/renderers/common/ClippingContext.js';

let id = 0;

export class RenderContext {
  id: number;
  color: boolean;
  clearColor: boolean;
  clearColorValue: Color;
  depth: boolean;
  clearDepth: boolean;
  clearDepthValue: number;
  stencil: boolean;
  clearStencil: boolean;
  clearStencilValue: number;
  viewport: boolean;
  viewportValue: Vec4;
  scissor: boolean;
  scissorValue: Vec4;
  textures: any;
  depthTexture: any;
  activeCubeFace: number;
  sampleCount: number;
  width: number;
  height: number;
  isRenderContext: boolean;
  stencilClearValue: number;
  depthClearValue: number;
  clippingContext: ClippingContext;
  renderTarget: RenderTarget;
  activeMipmapLevel: number;
  occlusionQueryCount: number;

  constructor() {
    this.id = id++;

    this.color = true;
    this.clearColor = true;
    this.clearColorValue = { r: 0, g: 0, b: 0, a: 1 };

    this.depth = true;
    this.clearDepth = true;
    this.clearDepthValue = 1;

    this.stencil = false;
    this.clearStencil = true;
    this.clearStencilValue = 1;

    this.viewport = false;
    this.viewportValue = new Vec4();

    this.scissor = false;
    this.scissorValue = new Vec4();

    this.textures = null;
    this.depthTexture = null;
    this.activeCubeFace = 0;
    this.sampleCount = 1;

    this.width = 0;
    this.height = 0;

    this.isRenderContext = true;
  }
}

export default RenderContext;
