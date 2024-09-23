import { CompressedPixelFormat, TextureFormat } from '../../../constants.js';
import { Basis, createBasis } from '@mimi/basis';

type ResultTranscode = {
  type: 'transcode';
  hasAlpha: boolean;
  format: number;
  height: number;
  width: number;
  dfdFlags: number;
  faces: any[];
  id: any;
};

type ResultError = {
  type: 'error';
  error: Error;
  id: string;
};

export type TranscoderResult = ResultTranscode | ResultError;

export namespace TranscoderResult {
  export const error = (id: string, error: Error): ResultError => ({ type: 'error', id, error });

  export const transcode = (
    id: string,
    { faces, width, height, hasAlpha, format, dfdFlags }: TranscodeResult,
  ): ResultTranscode => ({ type: 'transcode', id, faces, width, height, hasAlpha, format, dfdFlags });
}

export type Mipmap = {
  data: Uint8Array;
  width: number;
  height: number;
};

export type Face = {
  mipmaps: Mipmap[];
  width: number;
  height: number;
  format: number;
};

export type TranscodeResult = {
  buffers: ArrayBuffer[];
  hasAlpha: boolean;
  format: number;
  height: number;
  width: number;
  dfdFlags: number;
  faces: Face[];
};

export type WorkerConfig = {
  astcSupported: boolean;
  etc1Supported: boolean;
  etc2Supported: boolean;
  dxtSupported: boolean;
  bptcSupported: boolean;
  pvrtcSupported: boolean;
};

let config: WorkerConfig;
let BasisModule: Basis;
let transcoderPending: Promise<Basis>;

enum BasisFormat {
  ETC1S = 0,
  UASTC_4x4 = 1,
}

enum TranscoderFormat {
  ETC1 = 0,
  ETC2 = 1,
  BC1 = 2,
  BC3 = 3,
  BC4 = 4,
  BC5 = 5,
  BC7_M6_OPAQUE_ONLY = 6,
  BC7_M5 = 7,
  PVRTC1_4_RGB = 8,
  PVRTC1_4_RGBA = 9,
  ASTC_4x4 = 10,
  ATC_RGB = 11,
  ATC_RGBA_INTERPOLATED_ALPHA = 12,
  RGBA32 = 13,
  RGB565 = 14,
  BGR565 = 15,
  RGBA4444 = 16,
}

enum EngineFormat {
  RGBAFormat = TextureFormat.RGBA,
  RGBA_ASTC_4x4_Format = CompressedPixelFormat.RGBA_ASTC_4x4,
  RGBA_BPTC_Format = CompressedPixelFormat.RGBA_BPTC,
  RGBA_ETC2_EAC_Format = CompressedPixelFormat.RGBA_ETC2_EAC,
  RGBA_PVRTC_4BPPV1_Format = CompressedPixelFormat.RGBA_PVRTC_4BPPV1,
  RGBA_S3TC_DXT1_Format = CompressedPixelFormat.RGBA_S3TC_DXT1,
  RGBA_S3TC_DXT5_Format = CompressedPixelFormat.RGBA_S3TC_DXT5,
  RGB_ETC1_Format = CompressedPixelFormat.RGB_ETC1,
  RGB_ETC2_Format = CompressedPixelFormat.RGB_ETC2,
  RGB_PVRTC_4BPPV1_Format = CompressedPixelFormat.RGB_PVRTC_4BPPV1,
}

self.addEventListener('message', ({ data: message }) => {
  switch (message.type) {
    case 'init':
      config = message.config;
      transcoderPending = createBasis();
      transcoderPending.then(module => {
        BasisModule = module;
      });
      break;
    case 'transcode':
      transcoderPending.then(() => {
        try {
          const result = transcode(message.buffer);

          self.postMessage(TranscoderResult.transcode(message.id, result), { transfer: result.buffers });
        } catch (error) {
          console.error(error);
          self.postMessage(TranscoderResult.error(message.id, error));
        }
      });
      break;
  }
});

function transcode(buffer: ArrayBuffer): TranscodeResult {
  const ktx2File = new BasisModule.KTX2File(new Uint8Array(buffer));

  const cleanup = () => {
    ktx2File.close();
    ktx2File.delete();
  };
  const raise = (message: string) => {
    cleanup();
    return Error(message);
  };

  const result = () => {
    cleanup();

    return { faces, buffers, width, height, hasAlpha, format: engineFormat, dfdFlags };
  };

  if (!ktx2File.isValid()) throw raise('Invalid or unsupported .ktx2 file');

  const width = ktx2File.getWidth();
  const height = ktx2File.getHeight();
  const layerCount = ktx2File.getLayers() || 1;
  const levelCount = ktx2File.getLevels();
  const faceCount = ktx2File.getFaces();
  const hasAlpha = ktx2File.getHasAlpha();
  const dfdFlags = ktx2File.getDFDFlags();

  const basisFormat = ktx2File.isUASTC() ? BasisFormat.UASTC_4x4 : BasisFormat.ETC1S;
  const { transcoderFormat, engineFormat } = getTranscoderFormat(basisFormat, width, height, hasAlpha);

  if (!width || !height || !levelCount) throw raise('Invalid or unsupported texture');
  if (!ktx2File.startTranscoding()) throw raise('.startTranscoding failed');

  const faces: Face[] = [];
  const buffers: ArrayBuffer[] = [];

  for (let face = 0; face < faceCount; face++) {
    const mipmaps: Mipmap[] = [];

    for (let mip = 0; mip < levelCount; mip++) {
      const layerMips = [];

      let mipWidth!: number;
      let mipHeight!: number;

      for (let layer = 0; layer < layerCount; layer++) {
        const levelInfo = ktx2File.getImageLevelInfo(mip, layer, face);

        if (
          face === 0 &&
          mip === 0 &&
          layer === 0 &&
          (levelInfo.origWidth % 4 !== 0 || levelInfo.origHeight % 4 !== 0)
        ) {
          console.warn('THREE.KTX2Loader: ETC1S and UASTC textures should use multiple-of-four dimensions.');
        }

        if (levelCount > 1) {
          mipWidth = levelInfo.origWidth;
          mipHeight = levelInfo.origHeight;
        } else {
          mipWidth = levelInfo.width;
          mipHeight = levelInfo.height;
        }

        const dst = new Uint8Array(ktx2File.getImageTranscodedSizeInBytes(mip, layer, 0, transcoderFormat));
        const status = ktx2File.transcodeImage(dst, mip, layer, face, transcoderFormat, 0, -1, -1);

        if (!status) {
          cleanup();
          throw new Error('THREE.KTX2Loader: .transcodeImage failed.');
        }

        layerMips.push(dst);
      }

      const mipData = concat(layerMips);

      mipmaps.push({ data: mipData, width: mipWidth, height: mipHeight });
      buffers.push(mipData.buffer);
    }

    faces.push({ mipmaps, width, height, format: engineFormat });
  }

  return result();
}

interface Option {
  if: keyof WorkerConfig;
  basisFormat: BasisFormat[];
  transcoderFormat: TranscoderFormat[];
  engineFormat: EngineFormat[];
  priorityETC1S: number;
  priorityUASTC: number;
  needsPowerOfTwo: boolean;
}

const Etc1sOptions: Option[] = [
  {
    if: 'astcSupported',
    basisFormat: [BasisFormat.UASTC_4x4],
    transcoderFormat: [TranscoderFormat.ASTC_4x4, TranscoderFormat.ASTC_4x4],
    engineFormat: [EngineFormat.RGBA_ASTC_4x4_Format, EngineFormat.RGBA_ASTC_4x4_Format],
    priorityETC1S: Infinity,
    priorityUASTC: 1,
    needsPowerOfTwo: false,
  },
  {
    if: 'bptcSupported',
    basisFormat: [BasisFormat.ETC1S, BasisFormat.UASTC_4x4],
    transcoderFormat: [TranscoderFormat.BC7_M5, TranscoderFormat.BC7_M5],
    engineFormat: [EngineFormat.RGBA_BPTC_Format, EngineFormat.RGBA_BPTC_Format],
    priorityETC1S: 3,
    priorityUASTC: 2,
    needsPowerOfTwo: false,
  },
  {
    if: 'etc2Supported',
    basisFormat: [BasisFormat.ETC1S, BasisFormat.UASTC_4x4],
    transcoderFormat: [TranscoderFormat.ETC1, TranscoderFormat.ETC2],
    engineFormat: [EngineFormat.RGB_ETC2_Format, EngineFormat.RGBA_ETC2_EAC_Format],
    priorityETC1S: 1,
    priorityUASTC: 3,
    needsPowerOfTwo: false,
  },
  {
    if: 'etc1Supported',
    basisFormat: [BasisFormat.ETC1S, BasisFormat.UASTC_4x4],
    transcoderFormat: [TranscoderFormat.ETC1],
    engineFormat: [EngineFormat.RGB_ETC1_Format],
    priorityETC1S: 2,
    priorityUASTC: 4,
    needsPowerOfTwo: false,
  },
  {
    if: 'dxtSupported',
    basisFormat: [BasisFormat.ETC1S, BasisFormat.UASTC_4x4],
    transcoderFormat: [TranscoderFormat.BC1, TranscoderFormat.BC3],
    engineFormat: [EngineFormat.RGBA_S3TC_DXT1_Format, EngineFormat.RGBA_S3TC_DXT5_Format],
    priorityETC1S: 4,
    priorityUASTC: 5,
    needsPowerOfTwo: false,
  },
  {
    if: 'pvrtcSupported',
    basisFormat: [BasisFormat.ETC1S, BasisFormat.UASTC_4x4],
    transcoderFormat: [TranscoderFormat.PVRTC1_4_RGB, TranscoderFormat.PVRTC1_4_RGBA],
    engineFormat: [EngineFormat.RGB_PVRTC_4BPPV1_Format, EngineFormat.RGBA_PVRTC_4BPPV1_Format],
    priorityETC1S: 5,
    priorityUASTC: 6,
    needsPowerOfTwo: true,
  },
];
const UastcOptions = Etc1sOptions.toSorted((a, b) => a.priorityUASTC - b.priorityUASTC);

function getTranscoderFormat(
  basisFormat: BasisFormat,
  width: number,
  height: number,
  hasAlpha: boolean,
): {
  transcoderFormat: TranscoderFormat;
  engineFormat: EngineFormat;
} {
  const options = basisFormat === BasisFormat.ETC1S ? Etc1sOptions : UastcOptions;

  for (let i = 0; i < options.length; ++i) {
    const option = options[i];

    if (!config[option.if]) continue;
    if (!option.basisFormat.includes(basisFormat)) continue;
    if (hasAlpha && option.transcoderFormat.length < 2) continue;
    if (option.needsPowerOfTwo && !(isPowerOfTwo(width) && isPowerOfTwo(height))) continue;

    return {
      transcoderFormat: option.transcoderFormat[hasAlpha ? 1 : 0]!,
      engineFormat: option.engineFormat[hasAlpha ? 1 : 0]!,
    };
  }

  console.warn('THREE.KTX2Loader: No suitable compressed texture format found. Decoding to RGBA32.');
  return { transcoderFormat: TranscoderFormat.RGBA32, engineFormat: EngineFormat.RGBAFormat };
}

function isPowerOfTwo(value: number): boolean {
  return value <= 2 || ((value & (value - 1)) === 0 && value !== 0);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  if (arrays.length === 1) return arrays[0];

  let totalByteLength = 0;

  for (let i = 0; i < arrays.length; ++i) {
    const array = arrays[i];

    totalByteLength += array.byteLength;
  }

  const result = new Uint8Array(totalByteLength);

  let byteOffset = 0;

  for (let i = 0; i < arrays.length; ++i) {
    const array = arrays[i];
    result.set(array, byteOffset);

    byteOffset += array.byteLength;
  }

  return result;
}
