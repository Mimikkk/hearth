import {
  ColorSpace,
  MagnificationTextureFilter,
  Mapping,
  MinificationTextureFilter,
  PixelFormat,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../../constants.js';
import { Vec2 } from '../../math/Vec2.js';
import { Mat3 } from '../../math/Mat3.js';
import { Source } from './Source.js';
import type { CubeTexture } from './CubeTexture.js';
import { v4 } from 'uuid';

let _textureId = 0;

export class Texture {
  declare isTexture: true;
  id: number;
  uuid: string;
  name: string;
  source: Source;
  mipmaps: (ImageData | CubeTexture)[];
  mapping: Mapping;
  channel: number;
  wrapS: Wrapping;
  wrapT: Wrapping;
  wrapR: Wrapping;
  magFilter: MagnificationTextureFilter;
  minFilter: MinificationTextureFilter;
  anisotropy: number;
  format: TextureFormat;
  internalFormat: PixelFormat | null;
  type: TextureDataType;
  offset: Vec2;
  repeat: Vec2;
  center: Vec2;
  rotation: number;
  matrixAutoUpdate: boolean;
  matrix: Mat3;
  generateMipmaps: boolean;
  premultiplyAlpha: boolean;
  flipY: boolean;
  unpackAlignment: number;
  colorSpace?: ColorSpace | null;
  version: number;
  onUpdate?: () => void;
  isRenderTargetTexture: boolean;
  needsPMREMUpdate: boolean;
  userData: any;

  constructor(
    image?: TexImageSource | OffscreenCanvas | TextureParameters,
    mapping: Mapping = Mapping.UV,
    wrapS: Wrapping = Wrapping.ClampToEdge,
    wrapT: Wrapping = Wrapping.ClampToEdge,
    magFilter: MagnificationTextureFilter = MagnificationTextureFilter.Linear,
    minFilter: MinificationTextureFilter = MinificationTextureFilter.LinearMipmapLinear,
    format: TextureFormat = TextureFormat.RGBA,
    type: TextureDataType = TextureDataType.UnsignedByte,
    anisotropy: number = 1,
    colorSpace: ColorSpace | null = null,
  ) {
    const config = configure({ mapping, wrapS, wrapT, magFilter, minFilter, format, anisotropy, type, colorSpace, image, ...image });

    this.name = config.name;
    this.mipmaps = config.mipmaps;
    this.mapping = config.mapping;
    this.channel = config.channel;
    this.wrapS = config.wrapS;
    this.wrapT = config.wrapT;
    this.magFilter = config.magFilter;
    this.minFilter = config.minFilter;
    this.anisotropy = config.anisotropy;
    this.format = config.format;
    this.internalFormat = config.internalFormat;
    this.type = config.type;
    this.offset = config.offset;
    this.repeat = config.repeat;
    this.center = config.center;
    this.rotation = config.rotation;
    this.matrixAutoUpdate = config.matrixAutoUpdate;
    this.generateMipmaps = config.generateMipmaps;
    this.premultiplyAlpha = config.premultiplyAlpha;
    this.flipY = config.flipY;
    this.unpackAlignment = config.unpackAlignment;
    this.colorSpace = config.colorSpace;
    this.userData = config.userData;
    this.isRenderTargetTexture = config.isRenderTargetTexture;
    this.needsPMREMUpdate = config.needsPMREMUpdate;

    this.version = 0;
    this.id = ++_textureId;
    this.uuid = v4();
    this.source = new Source(config.image);
    this.matrix = Mat3.new();
  }

  static is(texture: any): texture is Texture {
    return texture?.isTexture === true;
  }

  get image() {
    return this.source.data;
  }

  set image(value) {
    this.source.data = value;
  }

  updateMatrix(): this {
    this.matrix.asUvTransform(
      this.offset.x,
      this.offset.y,
      this.repeat.x,
      this.repeat.y,
      this.rotation,
      this.center.x,
      this.center.y,
    );
    return this;
  }

  clone(): Texture {
    return new this.constructor(undefined!).copy(this);
  }

  copy(source: this): this {
    this.name = source.name;

    this.source = source.source;
    this.mipmaps = source.mipmaps.slice(0);

    this.mapping = source.mapping;
    this.channel = source.channel;

    this.wrapS = source.wrapS;
    this.wrapT = source.wrapT;

    this.magFilter = source.magFilter;
    this.minFilter = source.minFilter;

    this.anisotropy = source.anisotropy;

    this.format = source.format;
    this.internalFormat = source.internalFormat;
    this.type = source.type;

    this.offset.from(source.offset);
    this.repeat.from(source.repeat);
    this.center.from(source.center);
    this.rotation = source.rotation;

    this.matrixAutoUpdate = source.matrixAutoUpdate;
    this.matrix.from(source.matrix);

    this.generateMipmaps = source.generateMipmaps;
    this.premultiplyAlpha = source.premultiplyAlpha;
    this.flipY = source.flipY;
    this.unpackAlignment = source.unpackAlignment;
    this.colorSpace = source.colorSpace;

    this.userData = JSON.parse(JSON.stringify(source.userData));

    this.needsUpdate = true;

    return this;
  }

  set needsUpdate(value: boolean) {
    if (value === true) {
      this.version++;
      this.source.needsUpdate = true;
    }
  }
}

Texture.prototype.isTexture = true;

export interface TextureParameters {
  image?: TexImageSource | OffscreenCanvas;
  mapping?: Mapping;
  wrapS?: Wrapping;
  wrapT?: Wrapping;
  magFilter?: MagnificationTextureFilter;
  minFilter?: MinificationTextureFilter;
  format?: TextureFormat;
  type?: TextureDataType;
  anisotropy?: number;
  colorSpace?: ColorSpace | null;
  mipmaps?: (ImageData | CubeTexture)[];
  offset?: Vec2;
  repeat?: Vec2;
  center?: Vec2;
  rotation?: number;
  matrixAutoUpdate?: boolean;
  generateMipmaps?: boolean;
  premultiplyAlpha?: boolean;
  flipY?: boolean;
  unpackAlignment?: number;
  userData?: any;
  onUpdate?: () => void;
  isRenderTargetTexture?: boolean;
  needsPMREMUpdate?: boolean;
  name?: string;
  channel?: number;
  internalFormat?: PixelFormat | null;

}

export interface TextureConfiguration {
  image: TexImageSource | OffscreenCanvas;
  mapping: Mapping;
  wrapS: Wrapping;
  wrapT: Wrapping;
  magFilter: MagnificationTextureFilter;
  minFilter: MinificationTextureFilter;
  format: TextureFormat;
  type: TextureDataType;
  anisotropy: number;
  colorSpace: ColorSpace | null;
  mipmaps: (ImageData | CubeTexture)[];
  offset: Vec2;
  repeat: Vec2;
  center: Vec2;
  rotation: number;
  matrixAutoUpdate: boolean;
  generateMipmaps: boolean;
  premultiplyAlpha: boolean;
  flipY: boolean;
  unpackAlignment: number;
  userData: any;
  onUpdate?: () => void;
  isRenderTargetTexture: boolean;
  needsPMREMUpdate: boolean;
  name: string;
  channel: number;
  internalFormat: PixelFormat | null;
}

export const configure = (parameters?: TextureParameters): TextureConfiguration => {
  return {
    internalFormat: parameters?.internalFormat ?? null,
    name: parameters?.name ?? '',
    channel: parameters?.channel ?? 0,
    image: parameters?.image ?? null!,
    mapping: parameters?.mapping ?? Mapping.UV,
    wrapS: parameters?.wrapS ?? Wrapping.ClampToEdge,
    wrapT: parameters?.wrapT ?? Wrapping.ClampToEdge,
    magFilter: parameters?.magFilter ?? MagnificationTextureFilter.Linear,
    minFilter: parameters?.minFilter ?? MinificationTextureFilter.LinearMipmapLinear,
    format: parameters?.format ?? TextureFormat.RGBA,
    type: parameters?.type ?? TextureDataType.UnsignedByte,
    anisotropy: parameters?.anisotropy ?? 1,
    colorSpace: parameters?.colorSpace ?? null,
    mipmaps: parameters?.mipmaps ?? [],
    offset: parameters?.offset ?? Vec2.new(0, 0),
    repeat: parameters?.repeat ?? Vec2.new(1, 1),
    center: parameters?.center ?? Vec2.new(0, 0),
    rotation: parameters?.rotation ?? 0,
    matrixAutoUpdate: parameters?.matrixAutoUpdate ?? true,
    generateMipmaps: parameters?.generateMipmaps ?? true,
    premultiplyAlpha: parameters?.premultiplyAlpha ?? false,
    flipY: parameters?.flipY ?? true,
    unpackAlignment: parameters?.unpackAlignment ?? 4,
    userData: parameters?.userData ?? {},
    onUpdate: parameters?.onUpdate,
    isRenderTargetTexture: parameters?.isRenderTargetTexture ?? false,
    needsPMREMUpdate: parameters?.needsPMREMUpdate ?? false,
  };
};