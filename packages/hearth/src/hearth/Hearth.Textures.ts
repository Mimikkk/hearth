import DataMap from './memo/DataMap.js';

import { Hearth } from './Hearth.js';
import { HearthTexturesTexturePass } from './Hearth.Textures.TexturePass.js';
import { GPUFeature, GPUFilterModeType, GPUTextureDimensionType, GPUTextureFormatType } from './constants.js';
import { StorageTexture } from '../entities/textures/StorageTexture.js';
import { DepthTexture } from '../entities/textures/DepthTexture.js';
import { RenderTarget } from './core/RenderTarget.js';
import { ColorSpace, CompressedPixelFormat, TextureDataType, TextureFormat } from '../constants.js';
import { Texture } from '../entities/textures/Texture.js';
import { CubeTexture } from '../entities/textures/CubeTexture.js';
import { Vec3 } from '../math/Vec3.js';
import { FramebufferTexture } from '../entities/textures/FramebufferTexture.js';
import { DataTexture } from '../entities/textures/DataTexture.js';
import { Data3DTexture } from '../entities/textures/Data3DTexture.js';
import { DataArrayTexture } from '../entities/textures/DataArrayTexture.js';
import { CompressedTexture } from '../entities/textures/CompressedTexture.js';
import { VideoTexture } from '../entities/textures/VideoTexture.js';
import { lazy } from '../math/types.js';

export class HearthTextures extends DataMap<any, any> {
  utils: HearthTexturesTexturePass;
  #flatTexture = lazy(() =>
    this.createTexture(
      new Texture({
        minFilter: GPUFilterModeType.Nearest,
        magFilter: GPUFilterModeType.Nearest,
      }),
      { width: 1, height: 1 },
    ),
  );
  #cubeTexture = lazy(() =>
    this.createTexture(
      new CubeTexture({
        minFilter: GPUFilterModeType.Nearest,
        magFilter: GPUFilterModeType.Nearest,
      }),
      { width: 1, height: 1, depth: 6 },
    ),
  );

  constructor(public hearth: Hearth) {
    super();

    this.utils = new HearthTexturesTexturePass(hearth);
  }

  updateRenderTarget(target: RenderTarget, activeMipmapLevel: number = this.hearth.activeMipmapLevel) {
    const data = this.get(target);

    const sampleCount = target.samples === 0 ? 1 : target.samples;
    const depthTextureMips = data.depthTextureMips || (data.depthTextureMips = {});

    const texture = target.texture;
    const textures = target.textures;

    const size = this.getSize(texture);

    const mipWidth = size.x >> activeMipmapLevel;
    const mipHeight = size.y >> activeMipmapLevel;

    let depthTexture = target.depthTexture || depthTextureMips[activeMipmapLevel];
    let textureNeedsUpdate = false;

    if (depthTexture === undefined) {
      depthTexture = new DepthTexture({
        width: mipWidth,
        height: mipHeight,
        format: target.stencilBuffer ? TextureFormat.DepthStencil : TextureFormat.Depth,
        type: target.stencilBuffer ? TextureDataType.UnsignedInt248 : TextureDataType.UnsignedInt,
      });

      depthTextureMips[activeMipmapLevel] = depthTexture;
    }

    if (data.width !== size.x || size.y !== data.height) {
      textureNeedsUpdate = true;

      depthTexture.useUpdate = true;
      depthTexture.image.width = mipWidth;
      depthTexture.image.height = mipHeight;
    }

    data.width = size.x;
    data.height = size.y;
    data.textures = textures;
    data.depthTexture = depthTexture;
    data.depth = target.depthBuffer;
    data.stencil = target.stencilBuffer;
    data.renderTarget = target;

    if (data.sampleCount !== sampleCount) {
      textureNeedsUpdate = true;
      depthTexture.useUpdate = true;

      data.sampleCount = sampleCount;
    }

    const options = { sampleCount };

    for (let i = 0; i < textures.length; i++) {
      const texture = textures[i];

      if (textureNeedsUpdate) texture.useUpdate = true;

      this.updateTexture(texture, options);
    }

    this.updateTexture(depthTexture, options);

    if (data.initialized !== true) {
      data.initialized = true;
    }
  }

  updateTexture(texture: Texture, options: Record<string, any> = {}) {
    const data = this.get(texture);
    if (data.initialized === true && data.version === texture.version) return;

    const isRenderTarget = texture.isRenderTargetTexture || texture.isDepthTexture || texture.isFramebufferTexture;

    if (isRenderTarget && data.initialized === true) {
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
      const needsCreate = data.initialized !== true;

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

          if (data.isDefaultTexture === undefined || data.isDefaultTexture === true) {
            this.hearth.createTexture(texture, options);

            data.isDefaultTexture = false;
          }

          if (texture.source.dataReady === true) this.hearth.updateTexture(texture, options);

          if (options.needsMipmaps && texture.mipmaps.length === 0) this.hearth.useMipmap(texture);
        }
      } else {
        this.hearth.createDefaultTexture(texture);

        data.isDefaultTexture = true;
      }
    }

    if (data.initialized !== true) {
      data.initialized = true;

      this.hearth.stats.memory.textures++;
    }

    data.version = texture.version;
  }

  getSize(texture: Texture, into: Vec3 = _size) {
    let image = texture.images ? texture.images[0] : texture.image;

    if (image) {
      if (image.image !== undefined) image = image.image;

      into.x = image.width;
      into.y = image.height;
      into.z = texture.isCubeTexture ? 6 : image.depth || 1;
    } else {
      into.x = into.y = into.z = 1;
    }

    return into;
  }

  getMipLevels(texture: Texture, width: number, height: number): number {
    if (CompressedTexture.is(texture)) return texture.mipmaps.length;
    return Math.floor(Math.log2(Math.max(width, height))) + 1;
  }

  needsMipmaps(texture: Texture): boolean {
    if (texture.isEnvironment()) return true;
    return CompressedTexture.is(texture) || texture.useMipmap;
  }

  createSampler(texture: Texture): GPUSampler {
    const sampler = this.hearth.device.createSampler({
      addressModeU: texture.wrapS,
      addressModeV: texture.wrapT,
      addressModeW: texture.wrapR,
      magFilter: texture.magFilter,
      minFilter: texture.minFilter,
      mipmapFilter: texture.minFilter,
      maxAnisotropy: texture.anisotropy,
      compare: texture.compare,
    });
    this.hearth.memo.get(texture).sampler = sampler;
    return sampler;
  }

  createDefaultTexture(texture: Texture): GPUTexture {
    let gpu: GPUTexture;

    if (isCubeTexture(texture)) {
      gpu = this.#cubeTexture();
    } else {
      gpu = this.#flatTexture();
    }

    this.hearth.memo.get(texture).texture = gpu;
    return gpu;
  }

  createTexture(
    texture: Texture,
    {
      depth = 1,
      levels = 1,
      height,
      sampleCount = 1,
      width,
    }: {
      levels?: number;
      depth?: number;
      sampleCount?: number;
      width: number;
      height: number;
    },
  ): GPUTexture {
    const data = this.hearth.memo.get(texture);
    if (data.initialized) throw new Error('HearthTextures: Texture already initialized.');

    const dimension = GPUTextureDimensionType.dim(texture);
    const format = texture.internalFormat || getFormat(texture, this.hearth.device);

    if (sampleCount > 1) {
      sampleCount = Math.pow(2, Math.floor(Math.log2(sampleCount)));
      if (sampleCount === 2) sampleCount = 4;
    }

    const primarySampleCount = texture.isRenderTargetTexture ? 1 : sampleCount;

    let usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC;

    if (isStorageTexture(texture)) {
      usage |= GPUTextureUsage.STORAGE_BINDING;
    }

    if (isCompressedTexture(texture) !== true) {
      usage |= GPUTextureUsage.RENDER_ATTACHMENT;
    }

    const descriptor: GPUTextureDescriptor = {
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

      (descriptor.size as GPUExtent3DDictStrict).width = videoFrame.displayWidth;
      (descriptor.size as GPUExtent3DDictStrict).height = videoFrame.displayHeight;

      videoFrame.close();

      data.externalTexture = video;
    } else {
      if (format === undefined) {
        console.warn('WebGPURenderer: Texture format not supported.');
        this.createDefaultTexture(texture);
      }

      data.texture = this.hearth.device.createTexture(descriptor);
    }

    if (isRenderTargetTexture(texture) && sampleCount > 1) {
      const msaa = {
        ...descriptor,
        label: descriptor.label + '-msaa',
        sampleCount: sampleCount,
      };

      data.msaaTexture = this.hearth.device.createTexture(msaa);
    }

    data.initialized = true;
    data.textureDescriptorGPU = descriptor;
    return data.texture;
  }

  destroyTexture(texture: Texture) {
    const { memo } = this.hearth;
    const data = memo.get(texture);

    data.texture.destroy();

    if (data.msaaTexture !== undefined) data.msaaTexture.destroy();

    memo.delete(texture);
  }

  destroySampler(texture: Texture) {
    const data = this.hearth.memo.get(texture);

    delete data.sampler;
  }

  useMipmap(texture: Texture) {
    const data = this.hearth.memo.get(texture);

    if (isCubeTexture(texture)) {
      for (let i = 0; i < 6; i++) {
        this.utils.useMipmap(data.texture, data.textureDescriptorGPU, i);
      }
    } else {
      this.utils.useMipmap(data.texture, data.textureDescriptorGPU, 0);
    }
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
    const data = this.hearth.memo.get(texture);

    const { textureDescriptorGPU } = data;

    if (texture.isRenderTargetTexture || textureDescriptorGPU === undefined) return;

    if (isDataTexture(texture) || isData3DTexture(texture)) {
      this._copyBufferToTexture(options.image, data.texture, textureDescriptorGPU, 0, texture.flipY);
    } else if (isDataArrayTexture(texture)) {
      for (let i = 0; i < options.image.depth; i++) {
        this._copyBufferToTexture(options.image, data.texture, textureDescriptorGPU, i, texture.flipY, i);
      }
    } else if (isCompressedTexture(texture)) {
      this._copyCompressedBufferToTexture(texture.mipmaps as ImageData[], data.texture, textureDescriptorGPU);
    } else if (isCubeTexture(texture)) {
      this._copyCubeToTexture(options.images, data.texture, textureDescriptorGPU, texture.flipY);
    } else if (isVideoTexture(texture)) {
      const video = texture.source.data;

      data.externalTexture = video;
    } else {
      this._copyFlatToTexture(options.image, data.texture, textureDescriptorGPU, 0, texture.flipY);
    }

    data.version = texture.version;

    texture.onUpdate?.();
  }

  async copyTextureToBuffer(texture: Texture, x: number, y: number, width: number, height: number) {
    const device = this.hearth.device;

    const data = this.hearth.memo.get(texture);
    const gpuTexture = data.texture;
    const format = data.textureDescriptorGPU.format;
    const bytesPerTexel = GPUTextureFormatType.bytes(format);

    let bytesPerRow = width * bytesPerTexel;
    bytesPerRow = Math.ceil(bytesPerRow / 256) * 256;

    const readBuffer = device.createBuffer({
      size: width * height * bytesPerTexel,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const encoder = device.createCommandEncoder();

    encoder.copyTextureToBuffer(
      {
        texture: gpuTexture,
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

    device.queue.submit([encoder.finish()]);
    await readBuffer.mapAsync(GPUMapMode.READ);
    const buffer = readBuffer.getMappedRange();

    const TypedArray = GPUTextureFormatType.array(format);
    return new TypedArray(buffer);
  }

  _copyCubeToTexture(images: ImageData[], texture: GPUTexture, descriptor: GPUTextureDescriptor, useFlip: boolean) {
    for (let i = 0; i < 6; i++) {
      const image = images[i];
      const flipAt = useFlip ? _flipOrder[i] : i;

      if (DataTexture.is(image)) {
        this._copyBufferToTexture(image.image, texture, descriptor, flipAt, useFlip);
      } else {
        this._copyFlatToTexture(image, texture, descriptor, flipAt, useFlip);
      }
    }
  }

  _copyFlatToTexture(
    image: ImageData,
    texture: GPUTexture,
    descriptor: GPUTextureDescriptor,
    depth: number,
    useFlip: boolean,
  ) {
    this.hearth.device.queue.copyExternalImageToTexture(
      {
        source: image,
      },
      {
        texture: texture,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: depth },
      },
      {
        width: image.width,
        height: image.height,
        depthOrArrayLayers: 1,
      },
    );

    if (useFlip) this.utils.useFlipY(texture, descriptor, depth);
  }

  _copyBufferToTexture(
    { data, width, height }: ImageData,
    texture: GPUTexture,
    descriptor: GPUTextureDescriptor,
    originDepth: number,
    useFlip: boolean,
    depth: number = 0,
  ) {
    const bytesPerTexel = GPUTextureFormatType.bytes(descriptor.format);

    this.hearth.device.queue.writeTexture(
      {
        texture: texture,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: originDepth },
      },
      data,
      {
        offset: width * height * bytesPerTexel * depth,
        bytesPerRow: width * bytesPerTexel,
      },
      {
        width: width,
        height: height,
        depthOrArrayLayers: 1,
      },
    );

    if (useFlip) this.utils.useFlipY(texture, descriptor, originDepth);
  }

  _copyCompressedBufferToTexture(mipmaps: ImageData[], texture: GPUTexture, descriptor: GPUTextureDescriptor) {
    const size = GPUTextureFormatType.chunksize(descriptor.format);

    for (let mipLevel = 0; mipLevel < mipmaps.length; ++mipLevel) {
      const { width, height, data } = mipmaps[mipLevel];

      this.hearth.device.queue.writeTexture(
        { texture, mipLevel },
        data,
        {
          offset: 0,
          bytesPerRow: Math.ceil(width / size.width) * size.byteLength,
        },
        {
          width: Math.ceil(width / size.width) * size.width,
          height: Math.ceil(height / size.width) * size.width,
          depthOrArrayLayers: 1,
        },
      );
    }
  }
}

const _size = Vec3.new();
const _flipOrder = [0, 1, 3, 2, 4, 5] as const;

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
