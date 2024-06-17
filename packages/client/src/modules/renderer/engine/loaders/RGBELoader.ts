import {
  ColorSpace,
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
  Wrapping,
} from '../constants.ts';
import { DataUtils } from '@modules/renderer/engine/extras/DataUtils.js';
import { DataTexture } from '@modules/renderer/engine/textures/DataTexture.js';
import { FileLoader, FileLoaderResponse } from '@modules/renderer/engine/loaders/FileLoader.js';
import { NumberArray } from '@modules/renderer/engine/math/MathUtils.js';
import {
  classLoader,
  Configurable,
  ConfigurableConstructor,
  LoaderAsync,
} from '@modules/renderer/engine/loaders/types.js';

type SupportedType = TextureDataType.Float | TextureDataType.HalfFloat;

const RGBEByteToRGBFloat = (
  sourceArray: NumberArray,
  sourceOffset: number,
  destArray: NumberArray,
  destOffset: number,
) => {
  const e = sourceArray[sourceOffset + 3];
  const scale = Math.pow(2.0, e - 128.0) / 255.0;

  destArray[destOffset] = sourceArray[sourceOffset] * scale;
  destArray[destOffset + 1] = sourceArray[sourceOffset + 1] * scale;
  destArray[destOffset + 2] = sourceArray[sourceOffset + 2] * scale;
  destArray[destOffset + 3] = 1;
};

const RGBEByteToRGBHalf = (
  sourceArray: NumberArray,
  sourceOffset: number,
  destArray: NumberArray,
  destOffset: number,
) => {
  const e = sourceArray[sourceOffset + 3];
  const scale = Math.pow(2.0, e - 128.0) / 255.0;

  // clamping to 65504, the maximum representable value in float16
  destArray[destOffset] = DataUtils.toHalfFloat(Math.min(sourceArray[sourceOffset] * scale, 65504));
  destArray[destOffset + 1] = DataUtils.toHalfFloat(Math.min(sourceArray[sourceOffset + 1] * scale, 65504));
  destArray[destOffset + 2] = DataUtils.toHalfFloat(Math.min(sourceArray[sourceOffset + 2] * scale, 65504));
  destArray[destOffset + 3] = DataUtils.toHalfFloat(1);
};

export type ParseResult = {
  data: Float32Array | Uint16Array;
  width: number;
  height: number;
  header: string;
  gamma: number;
  exposure: number;
  type: TextureDataType;
};
export const parse = (buffer: ArrayBuffer, type: SupportedType): ParseResult => {
  const rgbe_read_error = 1;
  const rgbe_write_error = 2;
  const rgbe_format_error = 3;
  const rgbe_memory_error = 4;
  const rgbe_error = (rgbe_error_code: number, msg?: string) => {
    switch (rgbe_error_code) {
      case rgbe_read_error:
        throw new Error('engine.RGBELoader: Read Error: ' + (msg || ''));
      case rgbe_write_error:
        throw new Error('engine.RGBELoader: Write Error: ' + (msg || ''));
      case rgbe_format_error:
        throw new Error('engine.RGBELoader: Bad File Format: ' + (msg || ''));
      default:
      case rgbe_memory_error:
        throw new Error('engine.RGBELoader: Memory Error: ' + (msg || ''));
    }
  };
  const RGBE_VALID_PROGRAMTYPE = 1;
  const RGBE_VALID_FORMAT = 2;
  const RGBE_VALID_DIMENSIONS = 4;
  const NEWLINE = '\n';
  const fgets = (buffer: Uint8Array, lineLimit?: number, consume?: boolean): string | undefined => {
    const chunkSize = 128;

    lineLimit = !lineLimit ? 1024 : lineLimit;
    let p = position;
    let i = -1;
    let len = 0;
    let s = '';
    let chunk = String.fromCharCode.apply(null, new Uint16Array(buffer.subarray(p, p + chunkSize)));

    while (0 > (i = chunk.indexOf(NEWLINE)) && len < lineLimit && p < buffer.byteLength) {
      s += chunk;
      len += chunk.length;
      p += chunkSize;
      chunk += String.fromCharCode.apply(null, new Uint16Array(buffer.subarray(p, p + chunkSize)));
    }

    if (-1 < i) {
      /*for (i=l-1; i>=0; i--) {
          byteCode = m.charCodeAt(i);
          if (byteCode > 0x7f && byteCode <= 0x7ff) byteLen++;
          else if (byteCode > 0x7ff && byteCode <= 0xffff) byteLen += 2;
          if (byteCode >= 0xDC00 && byteCode <= 0xDFFF) i--; //trail surrogate
        }*/
      if (false !== consume) position += len + i + 1;
      return s + chunk.slice(0, i);
    }
  };
  const RGBE_ReadHeader = (buffer: Uint8Array) => {
    // regexes to parse header info fields
    const magic_token_re = /^#\?(\S+)/;
    const gamma_re = /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/;
    const exposure_re = /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/;
    const format_re = /^\s*FORMAT=(\S+)\s*$/;
    const dimensions_re = /^\s*-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/;
    // RGBE format header struct
    const header = {
      valid: 0 /* indicate which fields are valid */,

      string: '' /* the actual header string */,

      comments: '' /* comments found in header */,

      programtype: 'RGBE' /* listed at beginning of file to identify it after "#?". defaults to "RGBE" */,

      format: '' /* RGBE format, default 32-bit_rle_rgbe */,

      gamma: 1.0 /* image has already been gamma corrected with given gamma. defaults to 1.0 (no correction) */,

      exposure: 1.0 /* a value of 1.0 in an image corresponds to <exposure> watts/steradian/m^2. defaults to 1.0 */,

      width: 0,
      height: 0 /* image dimensions, width/height */,
    };

    let line!: undefined | string;
    let match: RegExpMatchArray | undefined | null;

    if (position >= buffer.byteLength || !(line = fgets(buffer))) {
      rgbe_error(rgbe_read_error, 'no header found');
    }

    /* if you want to require the magic token then uncomment the next line */
    if (!(match = line?.match(magic_token_re))) {
      rgbe_error(rgbe_format_error, 'bad initial token');
    }

    header.valid |= RGBE_VALID_PROGRAMTYPE;
    header.programtype = match![1];
    header.string += line + '\n';

    while (true) {
      line = fgets(buffer);
      if (undefined === line) break;
      header.string += line + '\n';

      if ('#' === line.charAt(0)) {
        header.comments += line + '\n';
        continue; // comment line
      }

      if ((match = line.match(gamma_re))) {
        header.gamma = parseFloat(match[1]);
      }

      if ((match = line.match(exposure_re))) {
        header.exposure = parseFloat(match[1]);
      }

      if ((match = line.match(format_re))) {
        header.valid |= RGBE_VALID_FORMAT;
        header.format = match[1]; //'32-bit_rle_rgbe';
      }

      if ((match = line.match(dimensions_re))) {
        header.valid |= RGBE_VALID_DIMENSIONS;
        header.height = parseInt(match[1], 10);
        header.width = parseInt(match[2], 10);
      }

      if (header.valid & RGBE_VALID_FORMAT && header.valid & RGBE_VALID_DIMENSIONS) break;
    }

    if (!(header.valid & RGBE_VALID_FORMAT)) {
      rgbe_error(rgbe_format_error, 'missing format specifier');
    }

    if (!(header.valid & RGBE_VALID_DIMENSIONS)) {
      rgbe_error(rgbe_format_error, 'missing image size specifier');
    }

    return header;
  };
  const RGBE_ReadPixels_RLE = (buffer: Uint8Array, w: number, h: number) => {
    const scanline_width = w;

    if (
      // run length encoding is not allowed so read flat
      scanline_width < 8 ||
      scanline_width > 0x7fff ||
      // this file is not run length encoded
      2 !== buffer[0] ||
      2 !== buffer[1] ||
      buffer[2] & 0x80
    ) {
      // return the flat buffer
      return new Uint8Array(buffer);
    }

    if (scanline_width !== ((buffer[2] << 8) | buffer[3])) {
      rgbe_error(rgbe_format_error, 'wrong scanline width');
    }

    const data_rgba = new Uint8Array(4 * w * h);

    if (!data_rgba.length) {
      rgbe_error(rgbe_memory_error, 'unable to allocate buffer space');
    }

    let offset = 0;
    let pos = 0;

    const ptr_end = 4 * scanline_width;
    const rgbeStart = new Uint8Array(4);
    const scanline_buffer = new Uint8Array(ptr_end);
    let num_scanlines = h;

    // read in each successive scanline
    while (num_scanlines > 0 && pos < buffer.byteLength) {
      if (pos + 4 > buffer.byteLength) {
        rgbe_error(rgbe_read_error);
      }

      rgbeStart[0] = buffer[pos++];
      rgbeStart[1] = buffer[pos++];
      rgbeStart[2] = buffer[pos++];
      rgbeStart[3] = buffer[pos++];

      if (2 != rgbeStart[0] || 2 != rgbeStart[1] || ((rgbeStart[2] << 8) | rgbeStart[3]) != scanline_width) {
        rgbe_error(rgbe_format_error, 'bad rgbe scanline format');
      }

      let ptr = 0;
      let count;

      while (ptr < ptr_end && pos < buffer.byteLength) {
        count = buffer[pos++];
        const isEncodedRun = count > 128;
        if (isEncodedRun) count -= 128;

        if (0 === count || ptr + count > ptr_end) {
          rgbe_error(rgbe_format_error, 'bad scanline data');
        }

        if (isEncodedRun) {
          // a (encoded) run of the same value
          const byteValue = buffer[pos++];
          for (let i = 0; i < count; i++) {
            scanline_buffer[ptr++] = byteValue;
          }
          //ptr += count;
        } else {
          // a literal-run
          scanline_buffer.set(buffer.subarray(pos, pos + count), ptr);
          ptr += count;
          pos += count;
        }
      }

      for (let i = 0; i < scanline_width; i++) {
        let off = 0;
        data_rgba[offset] = scanline_buffer[i + off];
        off += scanline_width; //1;
        data_rgba[offset + 1] = scanline_buffer[i + off];
        off += scanline_width; //1;
        data_rgba[offset + 2] = scanline_buffer[i + off];
        off += scanline_width; //1;
        data_rgba[offset + 3] = scanline_buffer[i + off];
        offset += 4;
      }

      num_scanlines--;
    }

    return data_rgba;
  };

  let position = 0;
  const byteArray = new Uint8Array(buffer);

  const header = RGBE_ReadHeader(byteArray);

  const width = header.width;
  const height = header.height;

  const image_rgba_data = RGBE_ReadPixels_RLE(byteArray.subarray(position), width, height);

  let data;
  let numElements;
  switch (type) {
    case TextureDataType.Float: {
      numElements = image_rgba_data.length / 4;
      const result = new Float32Array(numElements * 4);

      for (let j = 0; j < numElements; j++) {
        RGBEByteToRGBFloat(image_rgba_data, j * 4, result, j * 4);
      }

      data = result;
      break;
    }
    case TextureDataType.HalfFloat: {
      numElements = image_rgba_data.length / 4;
      const result = new Uint16Array(numElements * 4);

      for (let j = 0; j < numElements; j++) {
        RGBEByteToRGBHalf(image_rgba_data, j * 4, result, j * 4);
      }

      data = result;
      break;
    }
  }

  return {
    width: width,
    height: height,
    data: data,
    header: header.string,
    gamma: header.gamma,
    exposure: header.exposure,
    type: type,
  };
};

const createDataTexture = (details: ParseResult): DataTexture => {
  //@ts-expect-error
  const texture = new DataTexture();

  texture.wrapS = Wrapping.ClampToEdge;
  texture.wrapT = Wrapping.ClampToEdge;
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.anisotropy = 1;
  texture.colorSpace = ColorSpace.LinearSRGB;
  texture.generateMipmaps = false;
  texture.flipY = true;
  texture.image.width = details.width;
  texture.image.height = details.height;
  texture.image.data = details.data;
  texture.type = details.type;

  texture.needsUpdate = true;

  return texture;
};

export class RGBELoader extends classLoader<{
  Url: string;
  Return: DataTexture;
  Options: Options;
  Configuration: Configuration;
}>(
  options => ({
    fileLoader: FileLoader.configureAs(FileLoaderResponse.Buffer, options?.fileLoader),
    type: options?.type ?? TextureDataType.HalfFloat,
  }),
  async (url, configuration, handlers) => {
    const buffer = await FileLoader.loadAsync(url, configuration.fileLoader, handlers);

    return createDataTexture(parse(buffer, configuration.type));
  },
) {}

export namespace RGBELoader {
  export interface Options {
    fileLoader?: Omit<FileLoader.Options, 'responseType'>;
    type?: SupportedType;
  }

  export interface Configuration {
    fileLoader: FileLoader.Configuration<FileLoaderResponse.Buffer>;
    type: SupportedType;
  }
}
type Options = RGBELoader.Options;
type Configuration = RGBELoader.Configuration;
