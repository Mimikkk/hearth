import { ColorSpace, Mapping, PixelFormat, TextureDataType, TextureFormat, Wrapping } from '../../constants.js';
import { Vec2 } from '../../math/Vec2.js';
import { Mat3 } from '../../math/Mat3.js';
import { Source } from './Source.js';
import type { CubeTexture } from './CubeTexture.js';
import { v4 } from 'uuid';
import { GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';

let _textureId = 0;

export class Texture<T = any> {
  declare isTexture: true;
  id: number;
  uuid: string;
  name: string;
  source: Source<T>;
  mipmaps: (ImageData | CubeTexture)[];
  mapping: Mapping;
  channel: number;
  wrapS: Wrapping;
  wrapT: Wrapping;
  wrapR: Wrapping;
  magFilter: GPUFilterModeType;
  minFilter: GPUFilterModeType;
  anisotropy: number;
  format: TextureFormat;
  internalFormat: PixelFormat | null;
  type: TextureDataType;
  offset: Vec2;
  repeat: Vec2;
  center: Vec2;
  rotation: number;
  useLocalAutoUpdate: boolean;
  matrix: Mat3;
  useMipmap: boolean;
  usePremultiplyAlpha: boolean;
  flipY: boolean;
  unpackAlignment: number;
  colorSpace?: ColorSpace | null;
  version: number;
  onUpdate?: () => void;
  isRenderTargetTexture: boolean;
  usePmremUpdate: boolean;
  extra: any;

  constructor(
    image?: TexImageSource | OffscreenCanvas | TextureParameters<T>,
    mapping: Mapping = Mapping.UV,
    wrapS: Wrapping = Wrapping.ClampToEdge,
    wrapT: Wrapping = Wrapping.ClampToEdge,
    magFilter: GPUFilterModeType = GPUFilterModeType.Linear,
    minFilter: GPUFilterModeType = GPUFilterModeType.Linear,
    format: TextureFormat = TextureFormat.RGBA,
    type: TextureDataType = TextureDataType.UnsignedByte,
    anisotropy: number = 1,
    colorSpace: ColorSpace | null = null,
  ) {
    const config = configure({
      mapping,
      wrapS,
      wrapT,
      magFilter,
      minFilter,
      format,
      anisotropy,
      type,
      colorSpace,
      image,
      ...image,
    });

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
    this.useLocalAutoUpdate = config.useLocalAutoUpdate;
    this.useMipmap = config.useMipmap;
    this.usePremultiplyAlpha = config.usePremultiplyAlpha;
    this.flipY = config.flipY;
    this.unpackAlignment = config.unpackAlignment;
    this.colorSpace = config.colorSpace;
    this.extra = config.extra;
    this.isRenderTargetTexture = config.isRenderTargetTexture;
    this.usePmremUpdate = config.usePmremUpdate;

    this.version = 0;
    this.id = ++_textureId;
    this.uuid = v4();
    this.source = new Source(config.image);
    this.matrix = Mat3.new();
    if (config.useUpdate) this.useUpdate = true;
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

    this.useLocalAutoUpdate = source.useLocalAutoUpdate;
    this.matrix.from(source.matrix);

    this.useMipmap = source.useMipmap;
    this.usePremultiplyAlpha = source.usePremultiplyAlpha;
    this.flipY = source.flipY;
    this.unpackAlignment = source.unpackAlignment;
    this.colorSpace = source.colorSpace;

    this.extra = JSON.parse(JSON.stringify(source.extra));

    this.useUpdate = true;

    return this;
  }

  set useUpdate(value: boolean) {
    if (value === true) {
      this.version++;
      this.source.useUpdate = true;
    }
  }
}

Texture.prototype.isTexture = true;

export interface TextureParameters<T = any> {
  isRenderTargetTexture?: boolean;
  image?: TexImageSource | OffscreenCanvas | T;
  mapping?: Mapping;
  wrapS?: Wrapping;
  wrapT?: Wrapping;
  magFilter?: GPUFilterModeType;
  minFilter?: GPUFilterModeType;
  format?: TextureFormat;
  type?: TextureDataType;
  anisotropy?: number;
  colorSpace?: ColorSpace | null;
  mipmaps?: (ImageData | CubeTexture)[];
  offset?: Vec2;
  repeat?: Vec2;
  center?: Vec2;
  rotation?: number;
  unpackAlignment?: number;
  extra?: any;
  onUpdate?: () => void;
  name?: string;
  channel?: number;
  internalFormat?: PixelFormat | null;
  flipY?: boolean;
  useLocalAutoUpdate?: boolean;
  usePremultiplyAlpha?: boolean;
  usePmremUpdate?: boolean;
  useMipmap?: boolean;
  useUpdate?: boolean;
}

export interface TextureConfiguration {
  image: TexImageSource | OffscreenCanvas;
  mapping: Mapping;
  wrapS: Wrapping;
  wrapT: Wrapping;
  magFilter: GPUFilterModeType;
  minFilter: GPUFilterModeType;
  format: TextureFormat;
  type: TextureDataType;
  anisotropy: number;
  colorSpace: ColorSpace | null;
  mipmaps: (ImageData | CubeTexture)[];
  offset: Vec2;
  repeat: Vec2;
  center: Vec2;
  rotation: number;
  useLocalAutoUpdate: boolean;
  useMipmap: boolean;
  usePremultiplyAlpha: boolean;
  flipY: boolean;
  unpackAlignment: number;
  extra: any;
  onUpdate?: () => void;
  isRenderTargetTexture: boolean;
  usePmremUpdate: boolean;
  name: string;
  channel: number;
  internalFormat: PixelFormat | null;
  useUpdate: boolean;
}

export const configure = <T>(parameters?: TextureParameters<T>): TextureConfiguration => {
  return {
    internalFormat: parameters?.internalFormat ?? null,
    name: parameters?.name ?? '',
    channel: parameters?.channel ?? 0,
    image: parameters?.image ?? null!,
    mapping: parameters?.mapping ?? Mapping.UV,
    wrapS: parameters?.wrapS ?? Wrapping.ClampToEdge,
    wrapT: parameters?.wrapT ?? Wrapping.ClampToEdge,
    magFilter: parameters?.magFilter ?? GPUFilterModeType.Linear,
    minFilter: parameters?.minFilter ?? GPUFilterModeType.Linear,
    format: parameters?.format ?? TextureFormat.RGBA,
    type: parameters?.type ?? TextureDataType.UnsignedByte,
    anisotropy: parameters?.anisotropy ?? 1,
    colorSpace: parameters?.colorSpace ?? null,
    mipmaps: parameters?.mipmaps ?? [],
    offset: parameters?.offset ?? Vec2.new(0, 0),
    repeat: parameters?.repeat ?? Vec2.new(1, 1),
    center: parameters?.center ?? Vec2.new(0, 0),
    rotation: parameters?.rotation ?? 0,
    useLocalAutoUpdate: parameters?.useLocalAutoUpdate ?? true,
    useMipmap: parameters?.useMipmap ?? true,
    usePremultiplyAlpha: parameters?.usePremultiplyAlpha ?? false,
    flipY: parameters?.flipY ?? true,
    unpackAlignment: parameters?.unpackAlignment ?? 4,
    extra: parameters?.extra ?? {},
    onUpdate: parameters?.onUpdate,
    isRenderTargetTexture: parameters?.isRenderTargetTexture ?? false,
    usePmremUpdate: parameters?.usePmremUpdate ?? false,
    useUpdate: parameters?.useUpdate ?? false,
  };
};
