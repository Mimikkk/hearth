import { Vector4 } from '../../../threejs/Three.js';
import { RGBA } from '@modules/renderer/threejs/renderers/common/Color4.js';

let id = 0;

export class RenderContext {
  id: number;
  color: boolean;
  clearColor: boolean;
  clearColorValue: RGBA;
  depth: boolean;
  clearDepth: boolean;
  clearDepthValue: number;
  stencil: boolean;
  clearStencil: boolean;
  clearStencilValue: number;
  viewport: boolean;
  viewportValue: Vector4;
  scissor: boolean;
  scissorValue: Vector4;
  textures: any;
  depthTexture: any;
  activeCubeFace: number;
  sampleCount: number;
  width: number;
  height: number;
  isRenderContext: boolean;
  stencilClearValue: number;
  depthClearValue: number;

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
    this.viewportValue = new Vector4();

    this.scissor = false;
    this.scissorValue = new Vector4();

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
