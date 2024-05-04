import { WebGLRenderTarget } from './WebGLRenderTarget.js';
import { Data3DTexture } from '../textures/Data3DTexture.js';
import { RenderTargetOptions } from '@modules/renderer/threejs/core/RenderTarget.js';

export class WebGL3DRenderTarget extends WebGLRenderTarget {
  declare texture: Data3DTexture;
  declare isWebGL3DRenderTarget: true;

  constructor(width: number = 1, height: number = 1, depth: number = 1, options: Partial<RenderTargetOptions> = {}) {
    super(width, height, options);

    this.depth = depth;

    this.texture = new Data3DTexture(null, width, height, depth);

    this.texture.isRenderTargetTexture = true;
  }
}

WebGL3DRenderTarget.prototype.isWebGL3DRenderTarget = true;
