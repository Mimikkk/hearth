import {
  GPUAddressModeType,
  GPUFeatureNameType,
  GPUFilterModeType,
  GPUTextureDimensionType,
  GPUTextureFormatType,
} from './constants.js';

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
  Texture,
  TextureDataType,
  TextureFormat,
  VideoTexture,
  Wrapping,
} from '../../../engine.js';

import { BackendTexturePass } from './BackendTexturePass.js';
import { Backend } from '@modules/renderer/engine/renderers/webgpu/Backend.js';
import StorageTexture from '@modules/renderer/engine/renderers/common/StorageTexture.js';
import { TypedArrayConstructor } from '@modules/renderer/engine/math/MathUtils.js';

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

export class BackendTextures {
  _passUtils: BackendTexturePass | null;
  defaultTexture: Texture | null;
  defaultCubeTexture: CubeTexture | null;
  colorBuffer: GPUTexture | null;
  depthTexture: DepthTexture;

  constructor(public backend: Backend) {
    this._passUtils = null;

    this.defaultTexture = null;
    this.defaultCubeTexture = null;

    this.colorBuffer = null;

    //@ts-expect-error
    this.depthTexture = new DepthTexture();
    this.depthTexture.name = 'depthBuffer';
  }

  createSampler(texture: Texture) {
    const backend = this.backend;
    const device = backend.device;

    const textureGPU = backend.get(texture);

    const samplerDescriptorGPU: GPUSamplerDescriptor = {
      addressModeU: this._convertAddressMode(texture.wrapS),
      addressModeV: this._convertAddressMode(texture.wrapT),
      addressModeW: this._convertAddressMode(texture.wrapR),
      magFilter: this._convertFilterMode(texture.magFilter),
      minFilter: this._convertFilterMode(texture.minFilter),
      mipmapFilter: this._convertFilterMode(texture.minFilter),
      maxAnisotropy: texture.anisotropy,
    };

    if (isDepthTexture(texture) && texture.compareFunction !== null) {
      samplerDescriptorGPU.compare = _compareToWebGPU[texture.compareFunction];
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

    this.backend.get(texture).texture = textureGPU;
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
    const backend = this.backend;
    const textureData = backend.get(texture);

    if (textureData.initialized) {
      throw new Error('WebGPUTextureUtils: Texture already initialized.');
    }

    if (options.needsMipmaps === undefined) options.needsMipmaps = false;
    if (options.levels === undefined) options.levels = 1;
    if (options.depth === undefined) options.depth = 1;

    const { width, height, depth, levels } = options;

    const dimension = this._getDimension(texture);
    const format = (texture.internalFormat || getFormat(texture, backend.device)) as GPUTextureFormat;

    let sampleCount = options.sampleCount !== undefined ? options.sampleCount : 1;

    if (sampleCount > 1) {
      // WebGPU only supports power-of-two sample counts and 2 is not a valid value
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

    // texture creation

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

      textureData.texture = backend.device.createTexture(textureDescriptorGPU);
    }

    if (isRenderTargetTexture(texture) && sampleCount > 1) {
      const msaaTextureDescriptorGPU = {
        ...textureDescriptorGPU,
        label: textureDescriptorGPU.label + '-msaa',
        sampleCount: sampleCount,
      };

      textureData.msaaTexture = backend.device.createTexture(msaaTextureDescriptorGPU);
    }

    textureData.initialized = true;

    textureData.textureDescriptorGPU = textureDescriptorGPU;
  }

  destroyTexture(texture: Texture) {
    const backend = this.backend;
    const textureData = backend.get(texture);

    textureData.texture.destroy();

    if (textureData.msaaTexture !== undefined) textureData.msaaTexture.destroy();

    backend.delete(texture);
  }

  destroySampler(texture: Texture) {
    const backend = this.backend;
    const textureData = backend.get(texture);

    delete textureData.sampler;
  }

  generateMipmaps(texture: Texture) {
    const textureData = this.backend.get(texture);

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

    const { width, height } = this.backend.renderer.getDrawSize();
    this.colorBuffer = this.backend.device.createTexture({
      label: 'colorBuffer',
      size: { width, height, depthOrArrayLayers: 1 },
      sampleCount: this.backend.renderer.parameters.sampleCount,
      format: GPUTextureFormatType.BGRA8Unorm,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    return this.colorBuffer;
  }

  getDepthBuffer(depth: boolean = true, stencil: boolean = false) {
    const backend = this.backend;
    const { width, height } = backend.renderer.getDrawSize();

    const depthTexture = this.depthTexture;
    const depthTextureGPU = backend.get(depthTexture).texture;

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

    this.createTexture(depthTexture, { sampleCount: backend.renderer.parameters.sampleCount, width, height });

    return backend.get(depthTexture).texture;
  }

  updateTexture(
    texture: Texture,
    options:
      | {
          image: ImageData;
          images: ImageData[];
        }
      | any,
  ) {
    const textureData = this.backend.get(texture);

    const { textureDescriptorGPU } = textureData;

    if (texture.isRenderTargetTexture || textureDescriptorGPU === undefined /* unsupported texture format */) return;

    // transfer texture data

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

    //

    textureData.version = texture.version;

    if (texture.onUpdate) texture.onUpdate(texture);
  }

  async copyTextureToBuffer(texture: Texture, x: number, y: number, width: number, height: number) {
    const device = this.backend.device;

    const textureData = this.backend.get(texture);
    const textureGPU = textureData.texture;
    const format = textureData.textureDescriptorGPU.format;
    const bytesPerTexel = this._getBytesPerTexel(format);

    let bytesPerRow = width * bytesPerTexel;
    bytesPerRow = Math.ceil(bytesPerRow / 256) * 256; // Align to 256 bytes

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

  _isEnvironmentTexture(texture: Texture) {
    const mapping = texture.mapping;

    return (
      mapping === Mapping.EquirectangularReflection ||
      mapping === Mapping.EquirectangularRefraction ||
      mapping === Mapping.CubeReflection ||
      mapping === Mapping.CubeRefraction
    );
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

    return this.backend.get(defaultTexture).texture;
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

    return this.backend.get(defaultCubeTexture).texture;
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
    const device = this.backend.device;

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
      this._passUtils = passUtils = new BackendTexturePass(this.backend);
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
    // @TODO: Consider to use GPUCommandEncoder.copyBufferToTexture()
    // @TODO: Consider to support valid buffer layouts with other formats like RGB

    const device = this.backend.device;

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
    // @TODO: Consider to use GPUCommandEncoder.copyBufferToTexture()

    const device = this.backend.device;

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
    // this method is only relevant for compressed texture formats

    if (format === GPUTextureFormatType.BC1RGBAUnorm || format === GPUTextureFormatType.BC1RGBAUnormSRGB)
      return { byteLength: 8, width: 4, height: 4 }; // DXT1
    if (format === GPUTextureFormatType.BC2RGBAUnorm || format === GPUTextureFormatType.BC2RGBAUnormSRGB)
      return { byteLength: 16, width: 4, height: 4 }; // DXT3
    if (format === GPUTextureFormatType.BC3RGBAUnorm || format === GPUTextureFormatType.BC3RGBAUnormSRGB)
      return { byteLength: 16, width: 4, height: 4 }; // DXT5
    if (format === GPUTextureFormatType.BC4RUnorm || format === GPUTextureFormatType.BC4RSnorm)
      return { byteLength: 8, width: 4, height: 4 }; // RGTC1
    if (format === GPUTextureFormatType.BC5RGUnorm || format === GPUTextureFormatType.BC5RGSnorm)
      return { byteLength: 16, width: 4, height: 4 }; // RGTC2
    if (format === GPUTextureFormatType.BC6HRGBUFloat || format === GPUTextureFormatType.BC6HRGBFloat)
      return { byteLength: 16, width: 4, height: 4 }; // BPTC (f32)
    //@ts-expect-error
    if (format === GPUTextureFormatType.BC7RGBAUnorm || format === GPUTextureFormatType.BC7RGBAUnormSRGB)
      return { byteLength: 16, width: 4, height: 4 }; // BPTC (unorm)

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
    // 8-bit formats
    if (
      format === GPUTextureFormatType.R8Unorm ||
      format === GPUTextureFormatType.R8Snorm ||
      format === GPUTextureFormatType.R8Uint ||
      format === GPUTextureFormatType.R8Sint
    )
      return 1;

    // 16-bit formats
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

    // 32-bit formats
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
      // Packed 32-bit formats
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

    // 64-bit formats
    if (
      format === GPUTextureFormatType.RG32Uint ||
      format === GPUTextureFormatType.RG32Sint ||
      format === GPUTextureFormatType.RG32Float ||
      format === GPUTextureFormatType.RGBA16Uint ||
      format === GPUTextureFormatType.RGBA16Sint ||
      format === GPUTextureFormatType.RGBA16Float
    )
      return 8;

    // 128-bit formats
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
            if (device && device.features.has(GPUFeatureNameType.Depth32FloatStencil8) === false) {
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
