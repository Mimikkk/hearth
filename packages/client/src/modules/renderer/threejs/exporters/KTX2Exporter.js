import { ColorSpace, DataTexture, Revision, TextureDataType, TextureFormat } from '../Three.js';

import {
  KHR_DF_CHANNEL_RGBSDA_ALPHA,
  KHR_DF_CHANNEL_RGBSDA_BLUE,
  KHR_DF_CHANNEL_RGBSDA_GREEN,
  KHR_DF_CHANNEL_RGBSDA_RED,
  KHR_DF_MODEL_RGBSDA,
  KHR_DF_PRIMARIES_BT709,
  KHR_DF_PRIMARIES_UNSPECIFIED,
  KHR_DF_SAMPLE_DATATYPE_FLOAT,
  KHR_DF_SAMPLE_DATATYPE_LINEAR,
  KHR_DF_SAMPLE_DATATYPE_SIGNED,
  KHR_DF_TRANSFER_LINEAR,
  KHR_DF_TRANSFER_SRGB,
  KTX2Container,
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
  write,
} from '../../threejs/libs/ktx-parse.module.js';

const VK_FORMAT_MAP = {
  [TextureFormat.RGBA]: {
    [TextureDataType.Float]: {
      [ColorSpace.No]: VK_FORMAT_R32G32B32A32_SFLOAT,
      [ColorSpace.LinearSRGB]: VK_FORMAT_R32G32B32A32_SFLOAT,
    },
    [TextureDataType.HalfFloat]: {
      [ColorSpace.No]: VK_FORMAT_R16G16B16A16_SFLOAT,
      [ColorSpace.LinearSRGB]: VK_FORMAT_R16G16B16A16_SFLOAT,
    },
    [TextureDataType.UnsignedByte]: {
      [ColorSpace.No]: VK_FORMAT_R8G8B8A8_UNORM,
      [ColorSpace.LinearSRGB]: VK_FORMAT_R8G8B8A8_UNORM,
      [ColorSpace.SRGB]: VK_FORMAT_R8G8B8A8_SRGB,
    },
  },

  [TextureFormat.RG]: {
    [TextureDataType.Float]: {
      [ColorSpace.No]: VK_FORMAT_R32G32_SFLOAT,
      [ColorSpace.LinearSRGB]: VK_FORMAT_R32G32_SFLOAT,
    },
    [TextureDataType.HalfFloat]: {
      [ColorSpace.No]: VK_FORMAT_R16G16_SFLOAT,
      [ColorSpace.LinearSRGB]: VK_FORMAT_R16G16_SFLOAT,
    },
    [TextureDataType.UnsignedByte]: {
      [ColorSpace.No]: VK_FORMAT_R8G8_UNORM,
      [ColorSpace.LinearSRGB]: VK_FORMAT_R8G8_UNORM,
      [ColorSpace.SRGB]: VK_FORMAT_R8G8_SRGB,
    },
  },

  [TextureFormat.Red]: {
    [TextureDataType.Float]: {
      [ColorSpace.No]: VK_FORMAT_R32_SFLOAT,
      [ColorSpace.LinearSRGB]: VK_FORMAT_R32_SFLOAT,
    },
    [TextureDataType.HalfFloat]: {
      [ColorSpace.No]: VK_FORMAT_R16_SFLOAT,
      [ColorSpace.LinearSRGB]: VK_FORMAT_R16_SFLOAT,
    },
    [TextureDataType.UnsignedByte]: {
      [ColorSpace.No]: VK_FORMAT_R8_UNORM,
      [ColorSpace.LinearSRGB]: VK_FORMAT_R8_UNORM,
      [ColorSpace.SRGB]: VK_FORMAT_R8_SRGB,
    },
  },
};

const KHR_DF_CHANNEL_MAP = {
  0: KHR_DF_CHANNEL_RGBSDA_RED,
  1: KHR_DF_CHANNEL_RGBSDA_GREEN,
  2: KHR_DF_CHANNEL_RGBSDA_BLUE,
  3: KHR_DF_CHANNEL_RGBSDA_ALPHA,
};

const ERROR_INPUT =
  'THREE.KTX2Exporter: Supported inputs are DataTexture, Data3DTexture, or Renderer and WebGLRenderTarget.';
const ERROR_FORMAT = 'THREE.KTX2Exporter: Supported formats are RGBAFormat, RGFormat, or RedFormat.';
const ERROR_TYPE =
  'THREE.KTX2Exporter: Supported types are TextureDataType.Float, TextureDataType.HalfFloat, or TextureDataType.UnsignedByte."';
const ERROR_COLOR_SPACE =
  'THREE.KTX2Exporter: Supported color spaces are ColorSpace.SRGB (TextureDataType.UnsignedByte only), ColorSpace.LinearSRGB, or ColorSpace.No.';

export class KTX2Exporter {
  parse(arg1, arg2) {
    let texture;

    if (arg1.isDataTexture || arg1.isData3DTexture) {
      texture = arg1;
    } else if (arg1.isWebGLRenderer && arg2.isWebGLRenderTarget) {
      texture = toDataTexture(arg1, arg2);
    } else {
      throw new Error(ERROR_INPUT);
    }

    if (VK_FORMAT_MAP[texture.format] === undefined) {
      throw new Error(ERROR_FORMAT);
    }

    if (VK_FORMAT_MAP[texture.format][texture.type] === undefined) {
      throw new Error(ERROR_TYPE);
    }

    if (VK_FORMAT_MAP[texture.format][texture.type][texture.colorSpace] === undefined) {
      throw new Error(ERROR_COLOR_SPACE);
    }

    //

    const array = texture.image.data;
    const channelCount = getChannelCount(texture);
    const container = new KTX2Container();

    container.vkFormat = VK_FORMAT_MAP[texture.format][texture.type][texture.colorSpace];
    container.typeSize = array.BYTES_PER_ELEMENT;
    container.pixelWidth = texture.image.width;
    container.pixelHeight = texture.image.height;

    if (texture.isData3DTexture) {
      container.pixelDepth = texture.image.depth;
    }

    //

    const basicDesc = container.dataFormatDescriptor[0];

    basicDesc.colorModel = KHR_DF_MODEL_RGBSDA;
    basicDesc.colorPrimaries =
      texture.colorSpace === ColorSpace.No ? KHR_DF_PRIMARIES_UNSPECIFIED : KHR_DF_PRIMARIES_BT709;
    basicDesc.transferFunction = texture.colorSpace === ColorSpace.SRGB ? KHR_DF_TRANSFER_SRGB : KHR_DF_TRANSFER_LINEAR;

    basicDesc.texelBlockDimension = [0, 0, 0, 0];

    basicDesc.bytesPlane = [container.typeSize * channelCount, 0, 0, 0, 0, 0, 0, 0];

    for (let i = 0; i < channelCount; ++i) {
      let channelType = KHR_DF_CHANNEL_MAP[i];

      if (texture.colorSpace === ColorSpace.LinearSRGB || texture.colorSpace === ColorSpace.No) {
        channelType |= KHR_DF_SAMPLE_DATATYPE_LINEAR;
      }

      if (texture.type === TextureDataType.Float || texture.type === TextureDataType.HalfFloat) {
        channelType |= KHR_DF_SAMPLE_DATATYPE_FLOAT;
        channelType |= KHR_DF_SAMPLE_DATATYPE_SIGNED;
      }

      basicDesc.samples.push({
        channelType: channelType,
        bitOffset: i * array.BYTES_PER_ELEMENT,
        bitLength: array.BYTES_PER_ELEMENT * 8 - 1,
        samplePosition: [0, 0, 0, 0],
        sampleLower: texture.type === TextureDataType.UnsignedByte ? 0 : -1,
        sampleUpper: texture.type === TextureDataType.UnsignedByte ? 255 : 1,
      });
    }

    //

    container.levels = [
      {
        levelData: new Uint8Array(array.buffer, array.byteOffset, array.byteLength),
        uncompressedByteLength: array.byteLength,
      },
    ];

    //

    container.keyValue['KTXwriter'] = `three.js ${Revision}`;

    //

    return write(container, { keepWriter: true });
  }
}

function toDataTexture(renderer, rtt) {
  const channelCount = getChannelCount(rtt.texture);

  let view;

  if (rtt.texture.type === TextureDataType.Float) {
    view = new Float32Array(rtt.width * rtt.height * channelCount);
  } else if (rtt.texture.type === TextureDataType.HalfFloat) {
    view = new Uint16Array(rtt.width * rtt.height * channelCount);
  } else if (rtt.texture.type === TextureDataType.UnsignedByte) {
    view = new Uint8Array(rtt.width * rtt.height * channelCount);
  } else {
    throw new Error(ERROR_TYPE);
  }

  renderer.readRenderTargetPixels(rtt, 0, 0, rtt.width, rtt.height, view);

  return new DataTexture(view, rtt.width, rtt.height, rtt.texture.format, rtt.texture.type);
}

function getChannelCount(texture) {
  switch (texture.format) {
    case TextureFormat.RGBA:
      return 4;

    case TextureFormat.RG:
    case TextureFormat.RGInteger:
      return 2;

    case TextureFormat.Red:
    case TextureFormat.RedInteger:
      return 1;

    default:
      throw new Error(ERROR_FORMAT);
  }
}
