import { RenderTarget } from '../core/RenderTarget.js';

export class WebGLRenderTarget extends RenderTarget {
  declare isWebGLRenderTarget: boolean;
}

WebGLRenderTarget.prototype.isWebGLRenderTarget = true;
