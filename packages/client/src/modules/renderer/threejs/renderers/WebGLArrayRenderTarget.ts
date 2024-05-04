import { WebGLRenderTarget } from './WebGLRenderTarget.js';
import { DataArrayTexture } from '../textures/DataArrayTexture.js';
import { RenderTargetOptions } from '@modules/renderer/threejs/core/RenderTarget.js';

export class WebGLArrayRenderTarget extends WebGLRenderTarget {
  declare isWebGLArrayRenderTarget: true;

  constructor(width: number = 1, height: number = 1, depth: number = 1, options: Partial<RenderTargetOptions> = {}) {
    super(width, height, options);

    this.depth = depth;

    this.texture = new DataArrayTexture(null, width, height, depth);

    this.texture.isRenderTargetTexture = true;
  }
}

WebGLArrayRenderTarget.prototype.isWebGLArrayRenderTarget = true;
