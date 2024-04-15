import {
  ColorSpace,
  CompressedPixelFormat,
  TextureDataType,
  TextureFormat,
  TransferFunction,
} from '../../constants.ts';
import { ColorManagement } from '../../math/ColorManagement.js';

function WebGLUtils(gl, extensions) {
  function convert(p, colorSpace = ColorSpace.No) {
    let extension;

    const transfer = ColorManagement.getTransfer(colorSpace);

    if (p === TextureDataType.UnsignedByte) return gl.UNSIGNED_BYTE;
    if (p === TextureDataType.UnsignedShort4444) return gl.UNSIGNED_SHORT_4_4_4_4;
    if (p === TextureDataType.UnsignedShort5551) return gl.UNSIGNED_SHORT_5_5_5_1;

    if (p === TextureDataType.Byte) return gl.BYTE;
    if (p === TextureDataType.Short) return gl.SHORT;
    if (p === TextureDataType.UnsignedShort) return gl.UNSIGNED_SHORT;
    if (p === TextureDataType.Int) return gl.INT;
    if (p === TextureDataType.UnsignedInt) return gl.UNSIGNED_INT;
    if (p === TextureDataType.Float) return gl.FLOAT;
    if (p === TextureDataType.HalfFloat) return gl.HALF_FLOAT;

    if (p === TextureFormat.Alpha) return gl.ALPHA;
    if (p === TextureFormat.RGBA) return gl.RGBA;
    if (p === TextureFormat.Luminance) return gl.LUMINANCE;
    if (p === TextureFormat.LuminanceAlpha) return gl.LUMINANCE_ALPHA;
    if (p === TextureFormat.Depth) return gl.DEPTH_COMPONENT;
    if (p === TextureFormat.DepthStencil) return gl.DEPTH_STENCIL;

    // WebGL2 formats.

    if (p === TextureFormat.Red) return gl.RED;
    if (p === TextureFormat.RedInteger) return gl.RED_INTEGER;
    if (p === TextureFormat.RG) return gl.RG;
    if (p === TextureFormat.RGInteger) return gl.RG_INTEGER;
    if (p === TextureFormat.RGBAInteger) return gl.RGBA_INTEGER;

    // S3TC

    if (
      p === CompressedPixelFormat.RGB_S3TC_DXT1 ||
      p === CompressedPixelFormat.RGBA_S3TC_DXT1 ||
      p === CompressedPixelFormat.RGBA_S3TC_DXT3 ||
      p === CompressedPixelFormat.RGBA_S3TC_DXT5
    ) {
      if (transfer === TransferFunction.SRGB) {
        extension = extensions.get('WEBGL_compressed_texture_s3tc_srgb');

        if (extension !== null) {
          if (p === CompressedPixelFormat.RGB_S3TC_DXT1) return extension.COMPRESSED_SRGB_S3TC_DXT1_EXT;
          if (p === CompressedPixelFormat.RGBA_S3TC_DXT1) return extension.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
          if (p === CompressedPixelFormat.RGBA_S3TC_DXT3) return extension.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
          if (p === CompressedPixelFormat.RGBA_S3TC_DXT5) return extension.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
        } else {
          return null;
        }
      } else {
        extension = extensions.get('WEBGL_compressed_texture_s3tc');

        if (extension !== null) {
          if (p === CompressedPixelFormat.RGB_S3TC_DXT1) return extension.COMPRESSED_RGB_S3TC_DXT1_EXT;
          if (p === CompressedPixelFormat.RGBA_S3TC_DXT1) return extension.COMPRESSED_RGBA_S3TC_DXT1_EXT;
          if (p === CompressedPixelFormat.RGBA_S3TC_DXT3) return extension.COMPRESSED_RGBA_S3TC_DXT3_EXT;
          if (p === CompressedPixelFormat.RGBA_S3TC_DXT5) return extension.COMPRESSED_RGBA_S3TC_DXT5_EXT;
        } else {
          return null;
        }
      }
    }

    // PVRTC

    if (
      p === CompressedPixelFormat.RGB_PVRTC_4BPPV1 ||
      p === CompressedPixelFormat.RGB_PVRTC_2BPPV1 ||
      p === CompressedPixelFormat.RGBA_PVRTC_4BPPV1 ||
      p === CompressedPixelFormat.RGBA_PVRTC_2BPPV1
    ) {
      extension = extensions.get('WEBGL_compressed_texture_pvrtc');

      if (extension !== null) {
        if (p === CompressedPixelFormat.RGB_PVRTC_4BPPV1) return extension.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        if (p === CompressedPixelFormat.RGB_PVRTC_2BPPV1) return extension.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
        if (p === CompressedPixelFormat.RGBA_PVRTC_4BPPV1) return extension.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
        if (p === CompressedPixelFormat.RGBA_PVRTC_2BPPV1) return extension.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
      } else {
        return null;
      }
    }

    // ETC1

    if (p === CompressedPixelFormat.RGB_ETC1) {
      extension = extensions.get('WEBGL_compressed_texture_etc1');

      if (extension !== null) {
        return extension.COMPRESSED_RGB_ETC1_WEBGL;
      } else {
        return null;
      }
    }

    // ETC2

    if (p === CompressedPixelFormat.RGB_ETC2 || p === CompressedPixelFormat.RGBA_ETC2_EAC) {
      extension = extensions.get('WEBGL_compressed_texture_etc');

      if (extension !== null) {
        if (p === CompressedPixelFormat.RGB_ETC2)
          return transfer === TransferFunction.SRGB ? extension.COMPRESSED_SRGB8_ETC2 : extension.COMPRESSED_RGB8_ETC2;
        if (p === CompressedPixelFormat.RGBA_ETC2_EAC)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC
            : extension.COMPRESSED_RGBA8_ETC2_EAC;
      } else {
        return null;
      }
    }

    // ASTC

    if (
      p === CompressedPixelFormat.RGBA_ASTC_4x4 ||
      p === CompressedPixelFormat.RGBA_ASTC_5x4 ||
      p === CompressedPixelFormat.RGBA_ASTC_5x5 ||
      p === CompressedPixelFormat.RGBA_ASTC_6x5 ||
      p === CompressedPixelFormat.RGBA_ASTC_6x6 ||
      p === CompressedPixelFormat.RGBA_ASTC_8x5 ||
      p === CompressedPixelFormat.RGBA_ASTC_8x6 ||
      p === CompressedPixelFormat.RGBA_ASTC_8x8 ||
      p === CompressedPixelFormat.RGBA_ASTC_10x5 ||
      p === CompressedPixelFormat.RGBA_ASTC_10x6 ||
      p === CompressedPixelFormat.RGBA_ASTC_10x8 ||
      p === CompressedPixelFormat.RGBA_ASTC_10x10 ||
      p === CompressedPixelFormat.RGBA_ASTC_12x10 ||
      p === CompressedPixelFormat.RGBA_ASTC_12x12
    ) {
      extension = extensions.get('WEBGL_compressed_texture_astc');

      if (extension !== null) {
        if (p === CompressedPixelFormat.RGBA_ASTC_4x4)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR
            : extension.COMPRESSED_RGBA_ASTC_4x4_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_5x4)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR
            : extension.COMPRESSED_RGBA_ASTC_5x4_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_5x5)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR
            : extension.COMPRESSED_RGBA_ASTC_5x5_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_6x5)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR
            : extension.COMPRESSED_RGBA_ASTC_6x5_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_6x6)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR
            : extension.COMPRESSED_RGBA_ASTC_6x6_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_8x5)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR
            : extension.COMPRESSED_RGBA_ASTC_8x5_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_8x6)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR
            : extension.COMPRESSED_RGBA_ASTC_8x6_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_8x8)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR
            : extension.COMPRESSED_RGBA_ASTC_8x8_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_10x5)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR
            : extension.COMPRESSED_RGBA_ASTC_10x5_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_10x6)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR
            : extension.COMPRESSED_RGBA_ASTC_10x6_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_10x8)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR
            : extension.COMPRESSED_RGBA_ASTC_10x8_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_10x10)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR
            : extension.COMPRESSED_RGBA_ASTC_10x10_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_12x10)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR
            : extension.COMPRESSED_RGBA_ASTC_12x10_KHR;
        if (p === CompressedPixelFormat.RGBA_ASTC_12x12)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
            : extension.COMPRESSED_RGBA_ASTC_12x12_KHR;
      } else {
        return null;
      }
    }

    // BPTC

    if (
      p === CompressedPixelFormat.RGBA_BPTC ||
      p === CompressedPixelFormat.RGB_BPTC_SIGNED ||
      p === CompressedPixelFormat.RGB_BPTC_UNSIGNED
    ) {
      extension = extensions.get('EXT_texture_compression_bptc');

      if (extension !== null) {
        if (p === CompressedPixelFormat.RGBA_BPTC)
          return transfer === TransferFunction.SRGB
            ? extension.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
            : extension.COMPRESSED_RGBA_BPTC_UNORM_EXT;
        if (p === CompressedPixelFormat.RGB_BPTC_SIGNED) return extension.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;
        if (p === CompressedPixelFormat.RGB_BPTC_UNSIGNED) return extension.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT;
      } else {
        return null;
      }
    }

    // RGTC

    if (
      p === CompressedPixelFormat.RED_RGTC1 ||
      p === CompressedPixelFormat.SIGNED_RED_RGTC1 ||
      p === CompressedPixelFormat.RED_GREEN_RGTC2 ||
      p === CompressedPixelFormat.SIGNED_RED_GREEN_RGTC2
    ) {
      extension = extensions.get('EXT_texture_compression_rgtc');

      if (extension !== null) {
        if (p === CompressedPixelFormat.RGBA_BPTC) return extension.COMPRESSED_RED_RGTC1_EXT;
        if (p === CompressedPixelFormat.SIGNED_RED_RGTC1) return extension.COMPRESSED_SIGNED_RED_RGTC1_EXT;
        if (p === CompressedPixelFormat.RED_GREEN_RGTC2) return extension.COMPRESSED_RED_GREEN_RGTC2_EXT;
        if (p === CompressedPixelFormat.SIGNED_RED_GREEN_RGTC2) return extension.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT;
      } else {
        return null;
      }
    }

    //

    if (p === TextureDataType.UnsignedInt248) return gl.UNSIGNED_INT_24_8;

    // if "p" can't be resolved, assume the user defines a WebGL constant as a string (fallback/workaround for packed RGB formats)

    return gl[p] !== undefined ? gl[p] : null;
  }

  return { convert: convert };
}

export { WebGLUtils };
