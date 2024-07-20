import {
  ColorSpace,
  CompressedArrayTexture,
  CompressedCubeTexture,
  CompressedTexture,
  CompressedTextureFormat,
  Data3DTexture,
  DataTexture,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
} from '@modules/renderer/engine/engine.js';
import { WorkerPool } from '../../../utils/WorkerPool.js';
import {
  KHR_DF_FLAG_ALPHA_PREMULTIPLIED,
  KHR_DF_PRIMARIES_BT709,
  KHR_DF_PRIMARIES_DISPLAYP3,
  KHR_DF_PRIMARIES_UNSPECIFIED,
  KHR_DF_TRANSFER_SRGB,
  KHR_SUPERCOMPRESSION_NONE,
  KHR_SUPERCOMPRESSION_ZSTD,
  KTX2Container,
  read,
  VK_FORMAT_ASTC_6x6_SRGB_BLOCK,
  VK_FORMAT_ASTC_6x6_UNORM_BLOCK,
  VK_FORMAT_R16_SFLOAT,
  VK_FORMAT_R16G16_SFLOAT,
  VK_FORMAT_R16G16B16A16_SFLOAT,
  VK_FORMAT_R32_SFLOAT,
  VK_FORMAT_R32G32_SFLOAT,
  VK_FORMAT_R32G32B32A32_SFLOAT,
  VK_FORMAT_R8_SRGB,
  VK_FORMAT_R8_UNORM,
  VK_FORMAT_R8G8_SRGB,
  VK_FORMAT_R8G8_UNORM,
  VK_FORMAT_R8G8B8A8_SRGB,
  VK_FORMAT_R8G8B8A8_UNORM,
  VK_FORMAT_UNDEFINED,
} from 'ktx-parse';
import { ZSTDDecoder } from 'zstddec';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import LoadWorker from './KTX2Loader.worker.ts?worker';
import type { TranscoderResult, WorkerConfig } from './KTX2Loader.worker.ts';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';

let _activeLoaders = 0;

type TranscoderSignal = {
  message: { type: 'transcode'; buffer: ArrayBuffer };
  transmits: [ArrayBuffer];
  response: { data: TranscoderResult };
};

export class KTX2Loader extends classLoader<{
  This: KTX2Loader;
  Url: string;
  Return: CompressedCubeTexture | CompressedArrayTexture | CompressedTexture | Data3DTexture | DataTexture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(ResponseType.Buffer, options?.fileLoader),
    workerPoolSize: options?.workerPoolSize ?? 4,
  }),
  async function (this, url, configuration, handlers) {
    const buffer = await FileLoader.loadAsync(url, configuration.fileLoader, handlers);

    const container = read(new Uint8Array(buffer));
    if (container.vkFormat !== VK_FORMAT_UNDEFINED) return createRawTexture(container);
    const { data } = await this.pool.post({ type: 'transcode', buffer }, [buffer]);
    return createTexture(data, container);
  },
) {
  workerConfig: WorkerConfig;
  pool: WorkerPool<TranscoderSignal>;
  initialized: boolean = false;

  constructor(options?: Options) {
    super(options);
    this.pool = new WorkerPool(() => {
      const worker = new LoadWorker();
      worker.postMessage({ type: 'init', config: this.workerConfig });
      return worker;
    }, this.configuration.workerPoolSize);
  }

  async detectSupportAsync(renderer: Renderer) {
    this.workerConfig = {
      astcSupported: await renderer.backend.hasFeature('texture-compression-astc'),
      etc1Supported: await renderer.backend.hasFeature('texture-compression-etc1'),
      etc2Supported: await renderer.backend.hasFeature('texture-compression-etc2'),
      dxtSupported: await renderer.backend.hasFeature('texture-compression-bc'),
      bptcSupported: await renderer.backend.hasFeature('texture-compression-bptc'),
      pvrtcSupported: await renderer.backend.hasFeature('texture-compression-pvrtc'),
    };
    return this;
  }

  dispose() {
    this.pool.dispose();
    --_activeLoaders;
    return this;
  }
}

export namespace KTX2Loader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
    workerPoolSize?: number;
  }

  export interface Configuration {
    fileLoader: FileLoader.Options<ResponseType.Buffer>;
    workerPoolSize: number;
  }
}
export type Options = KTX2Loader.Options;
export type Configuration = KTX2Loader.Configuration;

const UNCOMPRESSED_FORMATS = new Set([TextureFormat.RGBA, TextureFormat.RG, TextureFormat.Red]);
const FORMAT_MAP = {
  [VK_FORMAT_R32G32B32A32_SFLOAT]: TextureFormat.RGBA,
  [VK_FORMAT_R16G16B16A16_SFLOAT]: TextureFormat.RGBA,
  [VK_FORMAT_R8G8B8A8_UNORM]: TextureFormat.RGBA,
  [VK_FORMAT_R8G8B8A8_SRGB]: TextureFormat.RGBA,

  [VK_FORMAT_R32G32_SFLOAT]: TextureFormat.RG,
  [VK_FORMAT_R16G16_SFLOAT]: TextureFormat.RG,
  [VK_FORMAT_R8G8_UNORM]: TextureFormat.RG,
  [VK_FORMAT_R8G8_SRGB]: TextureFormat.RG,

  [VK_FORMAT_R32_SFLOAT]: TextureFormat.Red,
  [VK_FORMAT_R16_SFLOAT]: TextureFormat.Red,
  [VK_FORMAT_R8_SRGB]: TextureFormat.Red,
  [VK_FORMAT_R8_UNORM]: TextureFormat.Red,

  [VK_FORMAT_ASTC_6x6_SRGB_BLOCK]: CompressedTextureFormat.RGBA_ASTC_6x6,
  [VK_FORMAT_ASTC_6x6_UNORM_BLOCK]: CompressedTextureFormat.RGBA_ASTC_6x6,
};
const TYPE_MAP = {
  [VK_FORMAT_R32G32B32A32_SFLOAT]: TextureDataType.Float,
  [VK_FORMAT_R16G16B16A16_SFLOAT]: TextureDataType.HalfFloat,
  [VK_FORMAT_R8G8B8A8_UNORM]: TextureDataType.UnsignedByte,
  [VK_FORMAT_R8G8B8A8_SRGB]: TextureDataType.UnsignedByte,

  [VK_FORMAT_R32G32_SFLOAT]: TextureDataType.Float,
  [VK_FORMAT_R16G16_SFLOAT]: TextureDataType.HalfFloat,
  [VK_FORMAT_R8G8_UNORM]: TextureDataType.UnsignedByte,
  [VK_FORMAT_R8G8_SRGB]: TextureDataType.UnsignedByte,

  [VK_FORMAT_R32_SFLOAT]: TextureDataType.Float,
  [VK_FORMAT_R16_SFLOAT]: TextureDataType.HalfFloat,
  [VK_FORMAT_R8_SRGB]: TextureDataType.UnsignedByte,
  [VK_FORMAT_R8_UNORM]: TextureDataType.UnsignedByte,

  [VK_FORMAT_ASTC_6x6_SRGB_BLOCK]: TextureDataType.UnsignedByte,
  [VK_FORMAT_ASTC_6x6_UNORM_BLOCK]: TextureDataType.UnsignedByte,
};

let _zstd!: ZSTDDecoder;

async function createRawTexture(container: KTX2Container) {
  const { vkFormat } = container;

  if (FORMAT_MAP[vkFormat as keyof typeof FORMAT_MAP] === undefined) {
    throw new Error('engine.KTX2Loader: Unsupported vkFormat.');
  }

  //

  if (container.supercompressionScheme === KHR_SUPERCOMPRESSION_ZSTD) {
    if (!_zstd) {
      _zstd = new ZSTDDecoder();
      await _zstd.init();
    }
  }

  //

  const mipmaps = [];

  for (let levelIndex = 0; levelIndex < container.levels.length; levelIndex++) {
    const levelWidth = Math.max(1, container.pixelWidth >> levelIndex);
    const levelHeight = Math.max(1, container.pixelHeight >> levelIndex);
    const levelDepth = container.pixelDepth ? Math.max(1, container.pixelDepth >> levelIndex) : 0;

    const level = container.levels[levelIndex];

    let levelData!: Uint8Array;

    if (container.supercompressionScheme === KHR_SUPERCOMPRESSION_NONE) {
      levelData = level.levelData;
    } else if (container.supercompressionScheme === KHR_SUPERCOMPRESSION_ZSTD) {
      levelData = _zstd.decode(level.levelData, level.uncompressedByteLength);
    }

    let data;

    if (TYPE_MAP[vkFormat as keyof typeof TYPE_MAP] === TextureDataType.Float) {
      data = new Float32Array(
        levelData.buffer,
        levelData.byteOffset,
        levelData.byteLength / Float32Array.BYTES_PER_ELEMENT,
      );
    } else if (TYPE_MAP[vkFormat as keyof typeof TYPE_MAP] === TextureDataType.HalfFloat) {
      data = new Uint16Array(
        levelData.buffer,
        levelData.byteOffset,
        levelData.byteLength / Uint16Array.BYTES_PER_ELEMENT,
      );
    } else {
      data = levelData;
    }

    mipmaps.push({
      data: data,
      width: levelWidth,
      height: levelHeight,
      depth: levelDepth,
    });
  }

  let texture;

  if (UNCOMPRESSED_FORMATS.has(FORMAT_MAP[vkFormat as keyof typeof FORMAT_MAP] as TextureFormat)) {
    texture =
      container.pixelDepth === 0
        ? new DataTexture(mipmaps[0].data, container.pixelWidth, container.pixelHeight)
        : new Data3DTexture(mipmaps[0].data, container.pixelWidth, container.pixelHeight, container.pixelDepth);
  } else {
    if (container.pixelDepth > 0) throw new Error('engine.KTX2Loader: Unsupported pixelDepth.');

    texture = new CompressedTexture({ mipmaps, width: container.pixelWidth, height: container.pixelHeight });
  }

  /*@ts-expect-error*/
  texture.mipmaps = mipmaps;

  /*@ts-expect-error*/
  texture.type = TYPE_MAP[vkFormat];
  /*@ts-expect-error*/
  texture.format = FORMAT_MAP[vkFormat];
  texture.colorSpace = parseColorSpace(container);
  texture.needsUpdate = true;

  //

  return Promise.resolve(texture);
}

function parseColorSpace(container: KTX2Container) {
  const dfd = container.dataFormatDescriptor[0];

  if (dfd.colorPrimaries === KHR_DF_PRIMARIES_BT709) {
    return dfd.transferFunction === KHR_DF_TRANSFER_SRGB ? ColorSpace.SRGB : ColorSpace.LinearSRGB;
  } else if (dfd.colorPrimaries === KHR_DF_PRIMARIES_DISPLAYP3) {
    return dfd.transferFunction === KHR_DF_TRANSFER_SRGB ? ColorSpace.DisplayP3 : ColorSpace.LinearDisplayP3;
  } else if (dfd.colorPrimaries === KHR_DF_PRIMARIES_UNSPECIFIED) {
    return ColorSpace.No;
  } else {
    console.warn(`engine.KTX2Loader: Unsupported color primaries, "${dfd.colorPrimaries}"`);
    return ColorSpace.No;
  }
}

async function createTexture(
  result: TranscoderResult,
  container: KTX2Container,
): Promise<CompressedCubeTexture | CompressedArrayTexture | CompressedTexture> {
  if (result.type === 'error') return Promise.reject(result.error);
  const { faces, width, height, format, dfdFlags } = result;

  let texture;

  if (container.faceCount === 6) {
    texture = new CompressedCubeTexture(faces, { format, type: TextureDataType.UnsignedByte });
  } else {
    const mipmaps = faces[0].mipmaps;

    texture =
      container.layerCount > 1
        ? new CompressedArrayTexture(
            { mipmaps, width, height, depth: container.layerCount },
            { format, type: TextureDataType.UnsignedByte },
          )
        : new CompressedTexture({ mipmaps, width, height }, { format, type: TextureDataType.UnsignedByte });
  }

  texture.minFilter =
    faces[0].mipmaps.length === 1 ? MinificationTextureFilter.Linear : MinificationTextureFilter.LinearMipmapLinear;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.generateMipmaps = false;

  texture.colorSpace = parseColorSpace(container);
  texture.premultiplyAlpha = !!(dfdFlags & KHR_DF_FLAG_ALPHA_PREMULTIPLIED);
  texture.needsUpdate = true;

  return texture;
}
