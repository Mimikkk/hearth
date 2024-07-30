import DataMap from './memo/DataMap.js';

import {
  ColorSpace,
  CompressedPixelFormat,
  CompressedTexture,
  CubeTexture,
  Data3DTexture,
  DataArrayTexture,
  DataTexture,
  DepthComparison,
  DepthTexture,
  Filter,
  FramebufferTexture,
  MagnificationTextureFilter,
  Mapping,
  MinificationTextureFilter,
  RenderTarget,
  Texture,
  TextureDataType,
  TextureFormat,
  Vec3,
  VideoTexture,
  Wrapping,
} from '@modules/renderer/engine/engine.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { HearthTexturesTexturePass } from '@modules/renderer/engine/hearth/Hearth.Textures.TexturePass.js';
import {
  GPUAddressModeType,
  GPUFeature,
  GPUFilterModeType,
  GPUTextureDimensionType,
  GPUTextureFormatType,
} from '@modules/renderer/engine/hearth/constants.js';
import { TypedArrayConstructor } from '@modules/renderer/engine/math/MathUtils.js';
import StorageTexture from '@modules/renderer/engine/entities/textures/StorageTexture.js';

export class HearthTextures extends DataMap<any, any> {
  constructor(public hearth: Hearth) {
    super();

    this._passUtils = null;
    this.defaultTexture = null;
    this.defaultCubeTexture = null;

    this.colorBuffer = null;

    this.depthTexture = new DepthTexture();
    this.depthTexture.name = 'depthBuffer';
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
      //@ts-expect-error
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

    const options = { sampleCount };

    for (let i = 0; i < textures.length; i++) {
      const texture = textures[i];

      if (textureNeedsUpdate) texture.needsUpdate = true;

      this.updateTexture(texture, options);
    }

    this.updateTexture(depthTexture, options);

    if (renderTargetData.initialized !== true) {
      renderTargetData.initialized = true;
    }
  }

  updateTexture(texture: Texture, options: Record<string, any> = {}) {
    const textureData = this.get(texture);
    if (textureData.initialized === true && textureData.version === texture.version) return;

    const isRenderTarget = texture.isRenderTargetTexture || texture.isDepthTexture || texture.isFramebufferTexture;

    if (isRenderTarget && textureData.initialized === true) {
      this.hearth.destroySampler(texture);
      this.hearth.destroyTexture(texture);
    }

    if (texture.isFramebufferTexture) {
      const hearth = this.hearth;
      const renderTarget = hearth.target;

      if (renderTarget) {
        texture.type = renderTarget.texture.type;
      } else {
        texture.type = TextureDataType.UnsignedByte;
      }
    }

    const { x: width, y: height, z: depth } = this.getSize(texture);

    options.width = width;
    options.height = height;
    options.depth = depth;
    options.needsMipmaps = this.needsMipmaps(texture);
    options.levels = options.needsMipmaps ? this.getMipLevels(texture, width, height) : 1;

    if (isRenderTarget || texture.isStorageTexture === true) {
      this.hearth.createSampler(texture);
      this.hearth.createTexture(texture, options);
    } else {
      const needsCreate = textureData.initialized !== true;

      if (needsCreate) this.hearth.createSampler(texture);

      if (texture.version > 0) {
        const image = texture.image;

        if (image === undefined) {
          console.warn('Hearth: Texture marked for update but image is undefined.');
        } else if (image.complete === false) {
          console.warn('Hearth: Texture marked for update but image is incomplete.');
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

          if (textureData.isDefaultTexture === undefined || textureData.isDefaultTexture === true) {
            this.hearth.createTexture(texture, options);

            textureData.isDefaultTexture = false;
          }

          if (texture.source.dataReady === true) this.hearth.updateTexture(texture, options);

          if (options.needsMipmaps && texture.mipmaps.length === 0) this.hearth.generateMipmaps(texture);
        }
      } else {
        this.hearth.createDefaultTexture(texture);

        textureData.isDefaultTexture = true;
      }
    }

    if (textureData.initialized !== true) {
      textureData.initialized = true;

      this.hearth.stats.memory.textures++;
    }

    textureData.version = texture.version;
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
    this.hearth.destroySampler(texture);
    this.hearth.destroyTexture(texture);

    this.delete(texture);
  }

  _passUtils: HearthTexturesTexturePass | null;
  defaultTexture: Texture | null;
  defaultCubeTexture: CubeTexture | null;
  colorBuffer: GPUTexture | null;
  depthTexture: DepthTexture;

  createSampler(texture: Texture) {
    const { device, memo } = this.hearth;

    const textureGPU = memo.get(texture);

    const samplerDescriptorGPU: GPUSamplerDescriptor = {
      addressModeU: this._convertAddressMode(texture.wrapS),
      addressModeV: this._convertAddressMode(texture.wrapT),
      addressModeW: this._convertAddressMode(texture.wrapR),
      magFilter: this._convertFilterMode(texture.magFilter),
      minFilter: this._convertFilterMode(texture.minFilter),
      mipmapFilter: this._convertFilterMode(texture.minFilter),
      maxAnisotropy: texture.anisotropy,
    };

    if (isDepthTexture(texture) && texture.compare !== null) {
      samplerDescriptorGPU.compare = _compareToWebGPU[texture.compare];
    }

    textureGPU.sampler = device.createSampler(samplerDescriptorGPU);
  }

  createDefaultTexture(texture: Texture) {
    let textureGPU;

    if (isCubeTexture(texture)) {
      textureGPU = this._getDefaultCubeTextureGPU();
    } else {
      textureGPU = this._getDefaultTextureGPU();
    }

    this.hearth.memo.get(texture).texture = textureGPU;
  }

  createTexture(
    texture: Texture,
    options: {
      needsMipmaps?: boolean;
      levels?: number;
      depth?: number;
      sampleCount?: number;
      width: number;
      height: number;
    },
  ) {
    const { memo, device } = this.hearth;
    const textureData = memo.get(texture);

    if (textureData.initialized) {
      throw new Error('WebGPUTextureUtils: Texture already initialized.');
    }

    if (options.needsMipmaps === undefined) options.needsMipmaps = false;
    if (options.levels === undefined) options.levels = 1;
    if (options.depth === undefined) options.depth = 1;

    const { width, height, depth, levels } = options;

    const dimension = this._getDimension(texture);
    const format = (texture.internalFormat || getFormat(texture, device)) as GPUTextureFormat;

    let sampleCount = options.sampleCount !== undefined ? options.sampleCount : 1;

    if (sampleCount > 1) {
      sampleCount = Math.pow(2, Math.floor(Math.log2(sampleCount)));

      if (sampleCount === 2) {
        sampleCount = 4;
      }
    }

    const primarySampleCount = texture.isRenderTargetTexture ? 1 : sampleCount;

    let usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC;

    if (isStorageTexture(texture)) {
      usage |= GPUTextureUsage.STORAGE_BINDING;
    }

    if (isCompressedTexture(texture) !== true) {
      usage |= GPUTextureUsage.RENDER_ATTACHMENT;
    }

    const textureDescriptorGPU: GPUTextureDescriptor = {
      label: texture.name,
      size: {
        width: width,
        height: height,
        depthOrArrayLayers: depth,
      },
      mipLevelCount: levels,
      sampleCount: primarySampleCount,
      dimension: dimension,
      format: format,
      usage: usage,
    };

    if (isVideoTexture(texture)) {
      const video = texture.source.data;
      const videoFrame = new VideoFrame(video);

      (textureDescriptorGPU.size as GPUExtent3DDictStrict).width = videoFrame.displayWidth;
      (textureDescriptorGPU.size as GPUExtent3DDictStrict).height = videoFrame.displayHeight;

      videoFrame.close();

      textureData.externalTexture = video;
    } else {
      if (format === undefined) {
        console.warn('WebGPURenderer: Texture format not supported.');

        return this.createDefaultTexture(texture);
      }

      textureData.texture = device.createTexture(textureDescriptorGPU);
    }

    if (isRenderTargetTexture(texture) && sampleCount > 1) {
      const msaaTextureDescriptorGPU = {
        ...textureDescriptorGPU,
        label: textureDescriptorGPU.label + '-msaa',
        sampleCount: sampleCount,
      };

      textureData.msaaTexture = device.createTexture(msaaTextureDescriptorGPU);
    }

    textureData.initialized = true;

    textureData.textureDescriptorGPU = textureDescriptorGPU;
  }

  destroyTexture(texture: Texture) {
    const { memo } = this.hearth;
    const textureData = memo.get(texture);

    textureData.texture.destroy();

    if (textureData.msaaTexture !== undefined) textureData.msaaTexture.destroy();

    memo.delete(texture);
  }

  destroySampler(texture: Texture) {
    const textureData = this.hearth.memo.get(texture);

    delete textureData.sampler;
  }

  generateMipmaps(texture: Texture) {
    const textureData = this.hearth.memo.get(texture);

    if (isCubeTexture(texture)) {
      for (let i = 0; i < 6; i++) {
        this._generateMipmaps(textureData.texture, textureData.textureDescriptorGPU, i);
      }
    } else {
      this._generateMipmaps(textureData.texture, textureData.textureDescriptorGPU);
    }
  }

  getColorBuffer() {
    if (this.colorBuffer) this.colorBuffer.destroy();

    const { width, height } = this.hearth.getDrawSize();
    this.colorBuffer = this.hearth.device.createTexture({
      label: 'colorBuffer',
      size: { width, height, depthOrArrayLayers: 1 },
      sampleCount: this.hearth.parameters.sampleCount,
      format: GPUTextureFormatType.BGRA8Unorm,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    return this.colorBuffer;
  }

  getDepthBuffer(depth: boolean = true, stencil: boolean = false) {
    const { memo } = this.hearth;
    const { width, height } = this.hearth.getDrawSize();

    const depthTexture = this.depthTexture;
    const depthTextureGPU = memo.get(depthTexture).texture;

    let format!: TextureFormat;
    let type!: TextureDataType;

    if (stencil) {
      format = TextureFormat.DepthStencil;
      type = TextureDataType.UnsignedInt248;
    } else if (depth) {
      format = TextureFormat.Depth;
      type = TextureDataType.UnsignedInt;
    }

    if (depthTextureGPU !== undefined) {
      if (
        depthTexture.image.width === width &&
        depthTexture.image.height === height &&
        depthTexture.format === format &&
        depthTexture.type === type
      ) {
        return depthTextureGPU;
      }

      this.destroyTexture(depthTexture);
    }

    depthTexture.name = 'depthBuffer';
    depthTexture.format = format;
    depthTexture.type = type;
    depthTexture.image.width = width;
    depthTexture.image.height = height;

    this.createTexture(depthTexture, { sampleCount: this.hearth.parameters.sampleCount, width, height });

    return memo.get(depthTexture).texture;
  }

  updateTextureTex(
    texture: Texture,
    options:
      | {
          image: ImageData;
          images: ImageData[];
        }
      | any,
  ) {
    const textureData = this.hearth.memo.get(texture);

    const { textureDescriptorGPU } = textureData;

    if (texture.isRenderTargetTexture || textureDescriptorGPU === undefined) return;

    if (isDataTexture(texture) || isData3DTexture(texture)) {
      this._copyBufferToTexture(options.image, textureData.texture, textureDescriptorGPU, 0, texture.flipY);
    } else if (isDataArrayTexture(texture)) {
      for (let i = 0; i < options.image.depth; i++) {
        this._copyBufferToTexture(options.image, textureData.texture, textureDescriptorGPU, i, texture.flipY, i);
      }
    } else if (isCompressedTexture(texture)) {
      this._copyCompressedBufferToTexture(texture.mipmaps as ImageData[], textureData.texture, textureDescriptorGPU);
    } else if (isCubeTexture(texture)) {
      this._copyCubeMapToTexture(options.images, textureData.texture, textureDescriptorGPU, texture.flipY);
    } else if (isVideoTexture(texture)) {
      const video = texture.source.data;

      textureData.externalTexture = video;
    } else {
      this._copyImageToTexture(options.image, textureData.texture, textureDescriptorGPU, 0, texture.flipY);
    }

    textureData.version = texture.version;

    if (texture.onUpdate) texture.onUpdate(texture);
  }

  async copyTextureToBuffer(texture: Texture, x: number, y: number, width: number, height: number) {
    const device = this.hearth.device;

    const textureData = this.hearth.memo.get(texture);
    const textureGPU = textureData.texture;
    const format = textureData.textureDescriptorGPU.format;
    const bytesPerTexel = this._getBytesPerTexel(format);

    let bytesPerRow = width * bytesPerTexel;
    bytesPerRow = Math.ceil(bytesPerRow / 256) * 256;

    const readBuffer = device.createBuffer({
      size: width * height * bytesPerTexel,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const encoder = device.createCommandEncoder();

    encoder.copyTextureToBuffer(
      {
        texture: textureGPU,
        origin: { x, y },
      },
      {
        buffer: readBuffer,
        bytesPerRow: bytesPerRow,
      },
      {
        width: width,
        height: height,
      },
    );

    const typedArrayType = this._getTypedArrayType(format);

    device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);

    const buffer = readBuffer.getMappedRange();

    return new typedArrayType(buffer);
  }

  _getDefaultTextureGPU() {
    let defaultTexture = this.defaultTexture;

    if (defaultTexture === null) {
      //@ts-expect-error
      const texture = new Texture();
      texture.minFilter = MinificationTextureFilter.Nearest;
      texture.magFilter = MagnificationTextureFilter.Nearest;

      this.createTexture(texture, { width: 1, height: 1 });

      this.defaultTexture = defaultTexture = texture;
    }

    return this.hearth.memo.get(defaultTexture).texture;
  }

  _getDefaultCubeTextureGPU() {
    let defaultCubeTexture = this.defaultTexture;

    if (defaultCubeTexture === null) {
      //@ts-expect-error
      const texture = new CubeTexture();
      texture.minFilter = MinificationTextureFilter.Nearest;
      texture.magFilter = MagnificationTextureFilter.Nearest;

      this.createTexture(texture, { width: 1, height: 1, depth: 6 });

      this.defaultCubeTexture = defaultCubeTexture = texture;
    }

    return this.hearth.memo.get(defaultCubeTexture).texture;
  }

  _copyCubeMapToTexture(
    images: ImageData[],
    textureGPU: GPUTexture,
    textureDescriptorGPU: GPUTextureDescriptor,
    flipY: boolean,
  ) {
    for (let i = 0; i < 6; i++) {
      const image = images[i];

      const flipIndex = flipY === true ? _flipMap[i] : i;

      if (isDataTexture(image)) {
        //@ts-expect-error
        this._copyBufferToTexture(image.image, textureGPU, textureDescriptorGPU, flipIndex, flipY);
      } else {
        this._copyImageToTexture(image, textureGPU, textureDescriptorGPU, flipIndex, flipY);
      }
    }
  }

  _copyImageToTexture(
    image: ImageData,
    textureGPU: GPUTexture,
    textureDescriptorGPU: GPUTextureDescriptor,
    originDepth: number,
    flipY: boolean,
  ) {
    const device = this.hearth.device;

    device.queue.copyExternalImageToTexture(
      {
        source: image,
      },
      {
        texture: textureGPU,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: originDepth },
      },
      {
        width: image.width,
        height: image.height,
        depthOrArrayLayers: 1,
      },
    );

    if (flipY === true) {
      this._flipY(textureGPU, textureDescriptorGPU, originDepth);
    }
  }

  _getPassUtils() {
    let passUtils = this._passUtils;

    if (passUtils === null) {
      this._passUtils = passUtils = new HearthTexturesTexturePass(this.hearth);
    }

    return passUtils;
  }

  _generateMipmaps(textureGPU: GPUTexture, textureDescriptorGPU: GPUTextureDescriptor, baseArrayLayer = 0) {
    this._getPassUtils().generateMipmaps(textureGPU, textureDescriptorGPU, baseArrayLayer);
  }

  _flipY(textureGPU: GPUTexture, textureDescriptorGPU: GPUTextureDescriptor, originDepth = 0) {
    this._getPassUtils().flipY(textureGPU, textureDescriptorGPU, originDepth);
  }

  _copyBufferToTexture(
    image: ImageData,
    textureGPU: GPUTexture,
    textureDescriptorGPU: GPUTextureDescriptor,
    originDepth: number,
    flipY: boolean,
    depth: number = 0,
  ) {
    const device = this.hearth.device;

    const data = image.data;

    const bytesPerTexel = this._getBytesPerTexel(textureDescriptorGPU.format);
    const bytesPerRow = image.width * bytesPerTexel;

    device.queue.writeTexture(
      {
        texture: textureGPU,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: originDepth },
      },
      data,
      {
        offset: image.width * image.height * bytesPerTexel * depth,
        bytesPerRow,
      },
      {
        width: image.width,
        height: image.height,
        depthOrArrayLayers: 1,
      },
    );

    if (flipY === true) {
      this._flipY(textureGPU, textureDescriptorGPU, originDepth);
    }
  }

  _copyCompressedBufferToTexture(
    mipmaps: ImageData[],
    textureGPU: GPUTexture,
    textureDescriptorGPU: GPUTextureDescriptor,
  ) {
    const device = this.hearth.device;

    const blockData = this._getBlockData(textureDescriptorGPU.format);

    for (let i = 0; i < mipmaps.length; i++) {
      const mipmap = mipmaps[i];

      const width = mipmap.width;
      const height = mipmap.height;

      const bytesPerRow = Math.ceil(width / blockData.width) * blockData.byteLength;

      device.queue.writeTexture(
        {
          texture: textureGPU,
          mipLevel: i,
        },
        mipmap.data,
        {
          offset: 0,
          bytesPerRow,
        },
        {
          width: Math.ceil(width / blockData.width) * blockData.width,
          height: Math.ceil(height / blockData.width) * blockData.width,
          depthOrArrayLayers: 1,
        },
      );
    }
  }

  _getBlockData(format: GPUTextureFormat): { byteLength: number; width: number; height: number } {
    if (format === GPUTextureFormatType.BC1RGBAUnorm || format === GPUTextureFormatType.BC1RGBAUnormSRGB)
      return { byteLength: 8, width: 4, height: 4 };
    if (format === GPUTextureFormatType.BC2RGBAUnorm || format === GPUTextureFormatType.BC2RGBAUnormSRGB)
      return { byteLength: 16, width: 4, height: 4 };
    if (format === GPUTextureFormatType.BC3RGBAUnorm || format === GPUTextureFormatType.BC3RGBAUnormSRGB)
      return { byteLength: 16, width: 4, height: 4 };
    if (format === GPUTextureFormatType.BC4RUnorm || format === GPUTextureFormatType.BC4RSnorm)
      return { byteLength: 8, width: 4, height: 4 };
    if (format === GPUTextureFormatType.BC5RGUnorm || format === GPUTextureFormatType.BC5RGSnorm)
      return { byteLength: 16, width: 4, height: 4 };
    if (format === GPUTextureFormatType.BC6HRGBUFloat || format === GPUTextureFormatType.BC6HRGBFloat)
      return { byteLength: 16, width: 4, height: 4 };
    //@ts-expect-error
    if (format === GPUTextureFormatType.BC7RGBAUnorm || format === GPUTextureFormatType.BC7RGBAUnormSRGB)
      return { byteLength: 16, width: 4, height: 4 };

    if (format === GPUTextureFormatType.ETC2RGB8Unorm || format === GPUTextureFormatType.ETC2RGB8UnormSRGB)
      return { byteLength: 8, width: 4, height: 4 };
    if (format === GPUTextureFormatType.ETC2RGB8A1Unorm || format === GPUTextureFormatType.ETC2RGB8A1UnormSRGB)
      return { byteLength: 8, width: 4, height: 4 };
    if (format === GPUTextureFormatType.ETC2RGBA8Unorm || format === GPUTextureFormatType.ETC2RGBA8UnormSRGB)
      return { byteLength: 16, width: 4, height: 4 };
    if (format === GPUTextureFormatType.EACR11Unorm) return { byteLength: 8, width: 4, height: 4 };
    if (format === GPUTextureFormatType.EACR11Snorm) return { byteLength: 8, width: 4, height: 4 };
    if (format === GPUTextureFormatType.EACRG11Unorm) return { byteLength: 16, width: 4, height: 4 };
    if (format === GPUTextureFormatType.EACRG11Snorm) return { byteLength: 16, width: 4, height: 4 };

    if (format === GPUTextureFormatType.ASTC4x4Unorm || format === GPUTextureFormatType.ASTC4x4UnormSRGB)
      return { byteLength: 16, width: 4, height: 4 };
    if (format === GPUTextureFormatType.ASTC5x4Unorm || format === GPUTextureFormatType.ASTC5x4UnormSRGB)
      return { byteLength: 16, width: 5, height: 4 };
    if (format === GPUTextureFormatType.ASTC5x5Unorm || format === GPUTextureFormatType.ASTC5x5UnormSRGB)
      return { byteLength: 16, width: 5, height: 5 };
    if (format === GPUTextureFormatType.ASTC6x5Unorm || format === GPUTextureFormatType.ASTC6x5UnormSRGB)
      return { byteLength: 16, width: 6, height: 5 };
    if (format === GPUTextureFormatType.ASTC6x6Unorm || format === GPUTextureFormatType.ASTC6x6UnormSRGB)
      return { byteLength: 16, width: 6, height: 6 };
    if (format === GPUTextureFormatType.ASTC8x5Unorm || format === GPUTextureFormatType.ASTC8x5UnormSRGB)
      return { byteLength: 16, width: 8, height: 5 };
    if (format === GPUTextureFormatType.ASTC8x6Unorm || format === GPUTextureFormatType.ASTC8x6UnormSRGB)
      return { byteLength: 16, width: 8, height: 6 };
    if (format === GPUTextureFormatType.ASTC8x8Unorm || format === GPUTextureFormatType.ASTC8x8UnormSRGB)
      return { byteLength: 16, width: 8, height: 8 };
    if (format === GPUTextureFormatType.ASTC10x5Unorm || format === GPUTextureFormatType.ASTC10x5UnormSRGB)
      return { byteLength: 16, width: 10, height: 5 };
    if (format === GPUTextureFormatType.ASTC10x6Unorm || format === GPUTextureFormatType.ASTC10x6UnormSRGB)
      return { byteLength: 16, width: 10, height: 6 };
    if (format === GPUTextureFormatType.ASTC10x8Unorm || format === GPUTextureFormatType.ASTC10x8UnormSRGB)
      return { byteLength: 16, width: 10, height: 8 };
    if (format === GPUTextureFormatType.ASTC10x10Unorm || format === GPUTextureFormatType.ASTC10x10UnormSRGB)
      return { byteLength: 16, width: 10, height: 10 };
    if (format === GPUTextureFormatType.ASTC12x10Unorm || format === GPUTextureFormatType.ASTC12x10UnormSRGB)
      return { byteLength: 16, width: 12, height: 10 };
    if (format === GPUTextureFormatType.ASTC12x12Unorm || format === GPUTextureFormatType.ASTC12x12UnormSRGB)
      return { byteLength: 16, width: 12, height: 12 };
    throw new Error('WebGPUTextureUtils: Unsupported compressed texture format.');
  }

  _convertAddressMode(value: Wrapping): GPUAddressMode {
    if (value === Wrapping.Repeat) return GPUAddressModeType.Repeat;
    if (value === Wrapping.MirroredRepeat) return GPUAddressModeType.MirrorRepeat;
    return GPUAddressModeType.ClampToEdge;
  }

  _convertFilterMode(value: Filter | MagnificationTextureFilter | MinificationTextureFilter): GPUFilterMode {
    if (value === Filter.Nearest || value === Filter.NearestMipmapNearest || value === Filter.NearestMipmapLinear) {
      return GPUFilterModeType.Nearest;
    }

    return GPUFilterModeType.Linear;
  }

  _getBytesPerTexel(format: GPUTextureFormat): 1 | 2 | 4 | 8 | 16 {
    if (
      format === GPUTextureFormatType.R8Unorm ||
      format === GPUTextureFormatType.R8Snorm ||
      format === GPUTextureFormatType.R8Uint ||
      format === GPUTextureFormatType.R8Sint
    )
      return 1;

    if (
      format === GPUTextureFormatType.R16Uint ||
      format === GPUTextureFormatType.R16Sint ||
      format === GPUTextureFormatType.R16Float ||
      format === GPUTextureFormatType.RG8Unorm ||
      format === GPUTextureFormatType.RG8Snorm ||
      format === GPUTextureFormatType.RG8Uint ||
      format === GPUTextureFormatType.RG8Sint
    )
      return 2;

    if (
      format === GPUTextureFormatType.R32Uint ||
      format === GPUTextureFormatType.R32Sint ||
      format === GPUTextureFormatType.R32Float ||
      format === GPUTextureFormatType.RG16Uint ||
      format === GPUTextureFormatType.RG16Sint ||
      format === GPUTextureFormatType.RG16Float ||
      format === GPUTextureFormatType.RGBA8Unorm ||
      format === GPUTextureFormatType.RGBA8UnormSRGB ||
      format === GPUTextureFormatType.RGBA8Snorm ||
      format === GPUTextureFormatType.RGBA8Uint ||
      format === GPUTextureFormatType.RGBA8Sint ||
      format === GPUTextureFormatType.BGRA8Unorm ||
      format === GPUTextureFormatType.BGRA8UnormSRGB ||
      format === GPUTextureFormatType.RGB9E5UFloat ||
      format === GPUTextureFormatType.RGB10A2Unorm ||
      //@ts-expect-error
      format === GPUTextureFormatType.RG11B10uFloat ||
      format === GPUTextureFormatType.Depth32Float ||
      format === GPUTextureFormatType.Depth24Plus ||
      format === GPUTextureFormatType.Depth24PlusStencil8 ||
      format === GPUTextureFormatType.Depth32FloatStencil8
    )
      return 4;

    if (
      format === GPUTextureFormatType.RG32Uint ||
      format === GPUTextureFormatType.RG32Sint ||
      format === GPUTextureFormatType.RG32Float ||
      format === GPUTextureFormatType.RGBA16Uint ||
      format === GPUTextureFormatType.RGBA16Sint ||
      format === GPUTextureFormatType.RGBA16Float
    )
      return 8;

    if (
      format === GPUTextureFormatType.RGBA32Uint ||
      format === GPUTextureFormatType.RGBA32Sint ||
      format === GPUTextureFormatType.RGBA32Float
    )
      return 16;
    throw new Error('WebGPUTextureUtils: Unsupported texture format.');
  }

  _getTypedArrayType(format: GPUTextureFormat): TypedArrayConstructor {
    if (format === GPUTextureFormatType.R8Uint) return Uint8Array;
    if (format === GPUTextureFormatType.R8Sint) return Int8Array;
    if (format === GPUTextureFormatType.R8Unorm) return Uint8Array;
    if (format === GPUTextureFormatType.R8Snorm) return Int8Array;
    if (format === GPUTextureFormatType.RG8Uint) return Uint8Array;
    if (format === GPUTextureFormatType.RG8Sint) return Int8Array;
    if (format === GPUTextureFormatType.RG8Unorm) return Uint8Array;
    if (format === GPUTextureFormatType.RG8Snorm) return Int8Array;
    if (format === GPUTextureFormatType.RGBA8Uint) return Uint8Array;
    if (format === GPUTextureFormatType.RGBA8Sint) return Int8Array;
    if (format === GPUTextureFormatType.RGBA8Unorm) return Uint8Array;
    if (format === GPUTextureFormatType.RGBA8Snorm) return Int8Array;

    if (format === GPUTextureFormatType.R16Uint) return Uint16Array;
    if (format === GPUTextureFormatType.R16Sint) return Int16Array;
    if (format === GPUTextureFormatType.RG16Uint) return Uint16Array;
    if (format === GPUTextureFormatType.RG16Sint) return Int16Array;
    if (format === GPUTextureFormatType.RGBA16Uint) return Uint16Array;
    if (format === GPUTextureFormatType.RGBA16Sint) return Int16Array;
    if (format === GPUTextureFormatType.R16Float) return Float32Array;
    if (format === GPUTextureFormatType.RG16Float) return Float32Array;
    if (format === GPUTextureFormatType.RGBA16Float) return Float32Array;

    if (format === GPUTextureFormatType.R32Uint) return Uint32Array;
    if (format === GPUTextureFormatType.R32Sint) return Int32Array;
    if (format === GPUTextureFormatType.R32Float) return Float32Array;
    if (format === GPUTextureFormatType.RG32Uint) return Uint32Array;
    if (format === GPUTextureFormatType.RG32Sint) return Int32Array;
    if (format === GPUTextureFormatType.RG32Float) return Float32Array;
    if (format === GPUTextureFormatType.RGBA32Uint) return Uint32Array;
    if (format === GPUTextureFormatType.RGBA32Sint) return Int32Array;
    if (format === GPUTextureFormatType.RGBA32Float) return Float32Array;

    if (format === GPUTextureFormatType.BGRA8Unorm) return Uint8Array;
    if (format === GPUTextureFormatType.BGRA8UnormSRGB) return Uint8Array;
    if (format === GPUTextureFormatType.RGB10A2Unorm) return Uint32Array;
    if (format === GPUTextureFormatType.RGB9E5UFloat) return Uint32Array;
    //@ts-expect-error
    if (format === GPUTextureFormatType.RG11B10uFloat) return Uint32Array;

    if (format === GPUTextureFormatType.Depth32Float) return Float32Array;
    if (format === GPUTextureFormatType.Depth24Plus) return Uint32Array;
    if (format === GPUTextureFormatType.Depth24PlusStencil8) return Uint32Array;
    if (format === GPUTextureFormatType.Depth32FloatStencil8) return Float32Array;
    throw new Error('WebGPUTextureUtils: Unsupported texture format.');
  }

  _getDimension(texture: Texture): GPUTextureDimension {
    if (isData3DTexture(texture)) return GPUTextureDimensionType.ThreeD;
    return GPUTextureDimensionType.TwoD;
  }
}

const _size = Vec3.new();
const _compareToWebGPU = {
  [DepthComparison.Never]: 'never',
  [DepthComparison.Less]: 'less',
  [DepthComparison.Equal]: 'equal',
  [DepthComparison.LessEqual]: 'less-equal',
  [DepthComparison.Greater]: 'greater',
  [DepthComparison.GreaterEqual]: 'greater-equal',
  [DepthComparison.Always]: 'always',
  [DepthComparison.NotEqual]: 'not-equal',
} as const;
const _flipMap = [0, 1, 3, 2, 4, 5] as const;

export function getFormat(texture: Texture, device: GPUDevice | null = null) {
  const format = texture.format;
  const type = texture.type;
  const colorSpace = texture.colorSpace;

  let formatGPU;

  if (isFramebufferTexture(texture) === true && texture.type === TextureDataType.UnsignedByte) {
    formatGPU = GPUTextureFormatType.BGRA8Unorm;
  } else if (isCompressedTexture(texture)) {
    switch (format as unknown as CompressedPixelFormat) {
      case CompressedPixelFormat.RGBA_S3TC_DXT1:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.BC1RGBAUnormSRGB : GPUTextureFormatType.BC1RGBAUnorm;
        break;

      case CompressedPixelFormat.RGBA_S3TC_DXT3:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.BC2RGBAUnormSRGB : GPUTextureFormatType.BC2RGBAUnorm;
        break;

      case CompressedPixelFormat.RGBA_S3TC_DXT5:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.BC3RGBAUnormSRGB : GPUTextureFormatType.BC3RGBAUnorm;
        break;

      case CompressedPixelFormat.RGB_ETC2:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ETC2RGB8UnormSRGB : GPUTextureFormatType.ETC2RGB8Unorm;
        break;

      case CompressedPixelFormat.RGBA_ETC2_EAC:
        formatGPU =
          colorSpace === ColorSpace.SRGB
            ? GPUTextureFormatType.ETC2RGBA8UnormSRGB
            : GPUTextureFormatType.ETC2RGBA8Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_4x4:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC4x4UnormSRGB : GPUTextureFormatType.ASTC4x4Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_5x4:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC5x4UnormSRGB : GPUTextureFormatType.ASTC5x4Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_5x5:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC5x5UnormSRGB : GPUTextureFormatType.ASTC5x5Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_6x5:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC6x5UnormSRGB : GPUTextureFormatType.ASTC6x5Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_6x6:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC6x6UnormSRGB : GPUTextureFormatType.ASTC6x6Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_8x5:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC8x5UnormSRGB : GPUTextureFormatType.ASTC8x5Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_8x6:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC8x6UnormSRGB : GPUTextureFormatType.ASTC8x6Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_8x8:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC8x8UnormSRGB : GPUTextureFormatType.ASTC8x8Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_10x5:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC10x5UnormSRGB : GPUTextureFormatType.ASTC10x5Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_10x6:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC10x6UnormSRGB : GPUTextureFormatType.ASTC10x6Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_10x8:
        formatGPU =
          colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.ASTC10x8UnormSRGB : GPUTextureFormatType.ASTC10x8Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_10x10:
        formatGPU =
          colorSpace === ColorSpace.SRGB
            ? GPUTextureFormatType.ASTC10x10UnormSRGB
            : GPUTextureFormatType.ASTC10x10Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_12x10:
        formatGPU =
          colorSpace === ColorSpace.SRGB
            ? GPUTextureFormatType.ASTC12x10UnormSRGB
            : GPUTextureFormatType.ASTC12x10Unorm;
        break;

      case CompressedPixelFormat.RGBA_ASTC_12x12:
        formatGPU =
          colorSpace === ColorSpace.SRGB
            ? GPUTextureFormatType.ASTC12x12UnormSRGB
            : GPUTextureFormatType.ASTC12x12Unorm;
        break;

      default:
        console.error('WebGPURenderer: Unsupported texture format.', format);
    }
  } else {
    switch (format as unknown as TextureFormat) {
      case TextureFormat.RGBA:
        switch (type) {
          case TextureDataType.UnsignedByte:
            formatGPU =
              colorSpace === ColorSpace.SRGB ? GPUTextureFormatType.RGBA8UnormSRGB : GPUTextureFormatType.RGBA8Unorm;
            break;

          case TextureDataType.HalfFloat:
            formatGPU = GPUTextureFormatType.RGBA16Float;
            break;

          case TextureDataType.Float:
            formatGPU = GPUTextureFormatType.RGBA32Float;
            break;

          default:
            console.error('WebGPURenderer: Unsupported texture type with RGBAFormat.', type);
        }

        break;

      case TextureFormat.Red:
        switch (type) {
          case TextureDataType.UnsignedByte:
            formatGPU = GPUTextureFormatType.R8Unorm;
            break;

          case TextureDataType.HalfFloat:
            formatGPU = GPUTextureFormatType.R16Float;
            break;

          case TextureDataType.Float:
            formatGPU = GPUTextureFormatType.R32Float;
            break;

          default:
            console.error('WebGPURenderer: Unsupported texture type with RedFormat.', type);
        }

        break;

      case TextureFormat.RG:
        switch (type) {
          case TextureDataType.UnsignedByte:
            formatGPU = GPUTextureFormatType.RG8Unorm;
            break;

          case TextureDataType.HalfFloat:
            formatGPU = GPUTextureFormatType.RG16Float;
            break;

          case TextureDataType.Float:
            formatGPU = GPUTextureFormatType.RG32Float;
            break;

          default:
            console.error('WebGPURenderer: Unsupported texture type with RGFormat.', type);
        }

        break;

      case TextureFormat.Depth:
        switch (type) {
          case TextureDataType.UnsignedShort:
            formatGPU = GPUTextureFormatType.Depth16Unorm;
            break;

          case TextureDataType.UnsignedInt:
            formatGPU = GPUTextureFormatType.Depth24Plus;
            break;

          case TextureDataType.Float:
            formatGPU = GPUTextureFormatType.Depth32Float;
            break;

          default:
            console.error('WebGPURenderer: Unsupported texture type with TextureFormat.Depth.', type);
        }

        break;

      case TextureFormat.DepthStencil:
        switch (type) {
          case TextureDataType.UnsignedInt248:
            formatGPU = GPUTextureFormatType.Depth24PlusStencil8;
            break;

          case TextureDataType.Float:
            if (device && device.features.has(GPUFeature.Depth32FloatStencil8) === false) {
              console.error(
                'WebGPURenderer: Depth textures with TextureFormat.DepthStencil + FloatType can only be used with the "depth32float-stencil8" GPU feature.',
              );
            }

            formatGPU = GPUTextureFormatType.Depth32FloatStencil8;

            break;

          default:
            console.error('WebGPURenderer: Unsupported texture type with TextureFormat.DepthStencil.', type);
        }

        break;

      default:
        console.error('WebGPURenderer: Unsupported texture format.', format);
    }
  }

  return formatGPU;
}

const isDepthTexture = (item: any): item is DepthTexture => item.isDepthTexture;
const isFramebufferTexture = (item: any): item is FramebufferTexture => item.isFramebufferTexture;
const isDataTexture = (item: any): item is DataTexture => item.isDataTexture;
const isData3DTexture = (item: any): item is Data3DTexture => item.isData3DTexture;
const isDataArrayTexture = (item: any): item is DataArrayTexture => item.isDataArrayTexture;
const isCompressedTexture = (item: any): item is CompressedTexture => item.isCompressedTexture;
const isCubeTexture = (item: any): item is CubeTexture => item.isCubeTexture;
const isVideoTexture = (item: any): item is VideoTexture => item.isVideoTexture;
const isRenderTargetTexture = (
  item: any,
): item is {
  isRenderTargetTexture: boolean;
} => item.isRenderTargetTexture;
const isStorageTexture = (item: any): item is StorageTexture => item.isStorageTexture;
