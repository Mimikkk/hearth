import DataMap from './DataMap.js';

import {
  DepthTexture,
  Mapping,
  MinificationTextureFilter,
  RenderTarget,
  Texture,
  TextureDataType,
  TextureFormat,
  Vec3,
} from '@modules/renderer/engine/engine.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

const _size = new Vec3();

class Textures extends DataMap<any, any> {
  constructor(public renderer: Renderer) {
    super();
  }

  updateRenderTarget(renderTarget: RenderTarget, activeMipmapLevel: number = 0) {
    const renderTargetData = this.get(renderTarget);

    const sampleCount = renderTarget.samples === 0 ? 1 : renderTarget.samples;
    const depthTextureMips = renderTargetData.depthTextureMips || (renderTargetData.depthTextureMips = {});

    const texture = renderTarget.texture;
    const textures = renderTarget.textures;

    const size = this.getSize(texture);

    const mipWidth = size.x >> activeMipmapLevel;
    const mipHeight = size.y >> activeMipmapLevel;

    let depthTexture = renderTarget.depthTexture || depthTextureMips[activeMipmapLevel];
    let textureNeedsUpdate = false;

    if (depthTexture === undefined) {
      depthTexture = new DepthTexture();
      depthTexture.format = renderTarget.stencilBuffer ? TextureFormat.DepthStencil : TextureFormat.Depth;
      depthTexture.type = renderTarget.stencilBuffer ? TextureDataType.UnsignedInt248 : TextureDataType.UnsignedInt;
      depthTexture.image.width = mipWidth;
      depthTexture.image.height = mipHeight;

      depthTextureMips[activeMipmapLevel] = depthTexture;
    }

    if (renderTargetData.width !== size.x || size.y !== renderTargetData.height) {
      textureNeedsUpdate = true;
      depthTexture.needsUpdate = true;

      depthTexture.image.width = mipWidth;
      depthTexture.image.height = mipHeight;
    }

    renderTargetData.width = size.x;
    renderTargetData.height = size.y;
    renderTargetData.textures = textures;
    renderTargetData.depthTexture = depthTexture;
    renderTargetData.depth = renderTarget.depthBuffer;
    renderTargetData.stencil = renderTarget.stencilBuffer;
    renderTargetData.renderTarget = renderTarget;

    if (renderTargetData.sampleCount !== sampleCount) {
      textureNeedsUpdate = true;
      depthTexture.needsUpdate = true;

      renderTargetData.sampleCount = sampleCount;
    }

    //

    const options = { sampleCount };

    for (let i = 0; i < textures.length; i++) {
      const texture = textures[i];

      if (textureNeedsUpdate) texture.needsUpdate = true;

      this.updateTexture(texture, options);
    }

    this.updateTexture(depthTexture, options);

    // dispose handler

    if (renderTargetData.initialized !== true) {
      renderTargetData.initialized = true;

      // dispose

      const onDispose = () => {
        renderTarget.eventDispatcher.remove('dispose', onDispose);

        if (textures !== undefined) {
          for (let i = 0; i < textures.length; i++) {
            this._destroyTexture(textures[i]);
          }
        } else {
          this._destroyTexture(texture);
        }

        this._destroyTexture(depthTexture);
      };

      renderTarget.eventDispatcher.add('dispose', onDispose);
    }
  }

  updateTexture(texture: Texture, options: Record<string, any> = {}) {
    const data = this.get(texture);
    if (data.initialized === true && data.version === texture.version) return;
    const backend = this.renderer.backend;

    const isRenderTarget = texture.isRenderTargetTexture || texture.isDepthTexture || texture.isFramebufferTexture;
    if (isRenderTarget && data.initialized) {
      // it's an update

      backend.destroySampler(texture);
      backend.destroyTexture(texture);
    }

    //

    if (texture.isFramebufferTexture) {
      const target = this.renderer.getRenderTarget();

      if (target) {
        texture.type = target.texture.type;
      } else {
        texture.type = TextureDataType.UnsignedByte;
      }
    }

    //

    const { x: width, y: height, z: depth } = this.getSize(texture);

    options.width = width;
    options.height = height;
    options.depth = depth;
    options.needsMipmaps = this.needsMipmaps(texture);
    options.levels = options.needsMipmaps ? this.getMipLevels(texture, width, height) : 1;

    //

    if (isRenderTarget || texture.isStorageTexture === true) {
      backend.createSampler(texture);
      backend.createTexture(texture, options);
    } else {
      const needsCreate = data.initialized !== true;

      if (needsCreate) backend.createSampler(texture);

      if (texture.version > 0) {
        const image = texture.image;

        if (image === undefined) {
          console.warn('engine.Renderer: Texture marked for update but image is undefined.');
        } else if (image.complete === false) {
          console.warn('engine.Renderer: Texture marked for update but image is incomplete.');
        } else {
          if (texture.images) {
            const images = [];

            for (const image of texture.images) {
              images.push(image);
            }

            options.images = images;
          } else {
            options.image = image;
          }

          if (data.isDefaultTexture === undefined || data.isDefaultTexture === true) {
            backend.createTexture(texture, options);
            data.isDefaultTexture = false;
          }

          backend.updateTexture(texture, options);

          if (options.needsMipmaps && texture.mipmaps.length === 0) backend.generateMipmaps(texture);
        }
      } else {
        // async update

        backend.createDefaultTexture(texture);

        data.isDefaultTexture = true;
      }
    }

    // dispose handler

    if (data.initialized !== true) {
      data.initialized = true;

      //

      this.renderer.info.memory.textures++;

      // dispose

      const onDispose = () => {
        texture.eventDispatcher.remove('dispose', onDispose);

        this._destroyTexture(texture);

        this.renderer.info.memory.textures--;
      };

      texture.eventDispatcher.add('dispose', onDispose);
    }

    //

    data.version = texture.version;
  }

  getSize(texture: Texture, target = _size) {
    let image = texture.images ? texture.images[0] : texture.image;

    if (image) {
      if (image.image !== undefined) image = image.image;

      target.x = image.width;
      target.y = image.height;
      target.z = texture.isCubeTexture ? 6 : image.depth || 1;
    } else {
      target.x = target.y = target.z = 1;
    }

    return target;
  }

  getMipLevels(texture: Texture, width: number, height: number): number {
    let mipLevelCount;

    if (texture.isCompressedTexture) {
      mipLevelCount = texture.mipmaps.length;
    } else {
      mipLevelCount = Math.floor(Math.log2(Math.max(width, height))) + 1;
    }

    return mipLevelCount;
  }

  needsMipmaps(texture: Texture): boolean {
    if (this.isEnvironmentTexture(texture)) return true;

    return (
      texture.isCompressedTexture === true ||
      (texture.minFilter !== MinificationTextureFilter.Nearest &&
        texture.minFilter !== MinificationTextureFilter.Linear)
    );
  }

  isEnvironmentTexture(texture: Texture): boolean {
    const mapping = texture.mapping;

    return (
      mapping === Mapping.EquirectangularReflection ||
      mapping === Mapping.EquirectangularRefraction ||
      mapping === Mapping.CubeReflection ||
      mapping === Mapping.CubeRefraction
    );
  }

  _destroyTexture(texture: Texture): void {
    this.renderer.backend.destroySampler(texture);
    this.renderer.backend.destroyTexture(texture);

    this.delete(texture);
  }
}

export default Textures;
