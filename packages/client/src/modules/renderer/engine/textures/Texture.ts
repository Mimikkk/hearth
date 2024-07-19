import { EventDispatcher } from '../core/EventDispatcher.js';
import {
  ColorSpace,
  CompressedTextureFormat,
  CubeMapping,
  MagnificationTextureFilter,
  Mapping,
  MinificationTextureFilter,
  PixelFormat,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../constants.js';
import { Vec2 } from '../math/Vec2.js';
import { Mat3 } from '../math/Mat3.js';
import { v4 } from 'uuid';

let _textureId = 0;

export class Texture<T = any> {
  declare isTexture: true;
  eventDispatcher = new EventDispatcher<{ dispose: {} }>();
  id: number;
  uuid: string;
  name: string;
  image: T;
  mipmaps: ImageData[];
  mapping: Mapping | CubeMapping;
  channel: number;
  wrapS: Wrapping;
  wrapT: Wrapping;
  wrapR: Wrapping;
  magFilter: MagnificationTextureFilter;
  minFilter: MinificationTextureFilter;
  anisotropy: number;
  format: TextureFormat | CompressedTextureFormat;
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
  unpackAlignment: 1 | 2 | 4 | 8;
  colorSpace: ColorSpace;
  version: number;
  /** whether a texture belongs to a render target */
  isRenderTargetTexture: boolean;
  /** whether should be processed by PMREMGenerator */
  needsPMREMUpdate: boolean;
  userData: any;

  constructor(
    image: T,
    options: Options | Mapping = Mapping.UV,
    wrapS: Wrapping = Wrapping.ClampToEdge,
    wrapT: Wrapping = Wrapping.ClampToEdge,
    magFilter: MagnificationTextureFilter = MagnificationTextureFilter.Linear,
    minFilter: MinificationTextureFilter = MinificationTextureFilter.LinearMipmapLinear,
    format: TextureFormat = TextureFormat.RGBA,
    type: TextureDataType = TextureDataType.UnsignedByte,
    anisotropy: number = 1,
    colorSpace: ColorSpace = ColorSpace.No,
  ) {
    this.id = ++_textureId;
    this.uuid = v4();
    this.image = image;

    let configuration: Configuration;
    if (typeof options !== 'object') {
      configuration = Texture.configure({
        mapping: options,
        wrapS,
        wrapT,
        magFilter,
        minFilter,
        format,
        type,
        anisotropy,
        colorSpace,
      });
    } else {
      configuration = Texture.configure(options);
    }

    this.configure(configuration);
  }

  static is(item: any): item is Texture {
    return item?.isTexture === true;
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

  clone(): Texture<T> {
    return new this.constructor(this.image).copy(this);
  }

  copy(source: this): this {
    this.name = source.name;
    this.image = source.image;
    this.mipmaps = source.mipmaps.slice(0);
    this.mapping = source.mapping;
    this.channel = source.channel;
    this.wrapS = source.wrapS;
    this.wrapT = source.wrapT;
    this.wrapR = source.wrapR;
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

  dispose() {
    this.eventDispatcher.dispatch({ type: 'dispose' }, this);
  }

  transformUv(uv: Vec2): Vec2 {
    if (this.mapping !== Mapping.UV) return uv;

    uv.applyMat3(this.matrix);

    if (uv.x < 0 || uv.x > 1) {
      switch (this.wrapS) {
        case Wrapping.Repeat:
          uv.x = uv.x - Math.floor(uv.x);
          break;

        case Wrapping.ClampToEdge:
          uv.x = uv.x < 0 ? 0 : 1;
          break;

        case Wrapping.MirroredRepeat:
          if (Math.abs(Math.floor(uv.x) % 2) === 1) {
            uv.x = Math.ceil(uv.x) - uv.x;
          } else {
            uv.x = uv.x - Math.floor(uv.x);
          }

          break;
      }
    }

    if (uv.y < 0 || uv.y > 1) {
      switch (this.wrapT) {
        case Wrapping.Repeat:
          uv.y = uv.y - Math.floor(uv.y);
          break;

        case Wrapping.ClampToEdge:
          uv.y = uv.y < 0 ? 0 : 1;
          break;

        case Wrapping.MirroredRepeat:
          if (Math.abs(Math.floor(uv.y) % 2) === 1) {
            uv.y = Math.ceil(uv.y) - uv.y;
          } else {
            uv.y = uv.y - Math.floor(uv.y);
          }

          break;
      }
    }

    if (this.flipY) {
      uv.y = 1 - uv.y;
    }

    return uv;
  }

  set needsUpdate(value: boolean) {
    if (!value) return;
    ++this.version;
  }

  configure(configuration: Configuration) {
    this.name = configuration.name;
    this.mipmaps = configuration.mipmaps;
    this.mapping = configuration.mapping;
    this.channel = configuration.channel;
    this.wrapS = configuration.wrapS;
    this.wrapT = configuration.wrapT;
    this.wrapR = configuration.wrapR;
    this.magFilter = configuration.magFilter;
    this.minFilter = configuration.minFilter;
    this.anisotropy = configuration.anisotropy;
    this.format = configuration.format;
    this.internalFormat = configuration.internalFormat;
    this.type = configuration.type;
    this.offset = configuration.offset;
    this.repeat = configuration.repeat;
    this.center = configuration.center;
    this.rotation = configuration.rotation;
    this.matrixAutoUpdate = configuration.matrixAutoUpdate;
    this.matrix = configuration.matrix;
    this.generateMipmaps = configuration.generateMipmaps;
    this.premultiplyAlpha = configuration.premultiplyAlpha;
    this.flipY = configuration.flipY;
    this.unpackAlignment = configuration.unpackAlignment;
    this.colorSpace = configuration.colorSpace;
    this.userData = configuration.userData;
    this.version = configuration.version;
    this.isRenderTargetTexture = configuration.isRenderTargetTexture;
    this.needsPMREMUpdate = configuration.needsPMREMUpdate;
  }

  static configure(options?: Options): Configuration {
    return {
      name: options?.name ?? '',
      mipmaps: options?.mipmaps ?? [],
      mapping: options?.mapping ?? Mapping.UV,
      channel: options?.channel ?? 0,
      wrapS: options?.wrapS ?? Wrapping.ClampToEdge,
      wrapT: options?.wrapT ?? Wrapping.ClampToEdge,
      wrapR: options?.wrapR ?? Wrapping.ClampToEdge,
      magFilter: options?.magFilter ?? MagnificationTextureFilter.Linear,
      minFilter: options?.minFilter ?? MinificationTextureFilter.LinearMipmapLinear,
      anisotropy: options?.anisotropy ?? 1,
      format: options?.format ?? TextureFormat.RGBA,
      internalFormat: options?.internalFormat ?? null,
      type: options?.type ?? TextureDataType.UnsignedByte,
      offset: options?.offset ?? Vec2.new(0, 0),
      repeat: options?.repeat ?? Vec2.new(1, 1),
      center: options?.center ?? Vec2.new(0, 0),
      rotation: options?.rotation ?? 0,
      matrixAutoUpdate: options?.matrixAutoUpdate ?? true,
      matrix: options?.matrix ?? new Mat3(),
      generateMipmaps: options?.generateMipmaps ?? true,
      premultiplyAlpha: options?.premultiplyAlpha ?? false,
      flipY: options?.flipY ?? true,
      unpackAlignment: options?.unpackAlignment ?? 4,
      colorSpace: options?.colorSpace ?? ColorSpace.No,
      userData: options?.userData ?? {},
      version: options?.version ?? 0,
      isRenderTargetTexture: options?.isRenderTargetTexture ?? false,
      needsPMREMUpdate: options?.needsPMREMUpdate ?? false,
    };
  }
}

Texture.prototype.isTexture = true;

export namespace Texture {
  export interface Options {
    name?: string;
    mipmaps?: ImageData[];
    mapping?: Mapping | CubeMapping;
    channel?: number;
    wrapS?: Wrapping;
    wrapT?: Wrapping;
    wrapR?: Wrapping;
    magFilter?: MagnificationTextureFilter;
    minFilter?: MinificationTextureFilter;
    anisotropy?: number;
    format?: TextureFormat | CompressedTextureFormat;
    internalFormat?: PixelFormat | null;
    type?: TextureDataType;
    offset?: Vec2;
    repeat?: Vec2;
    center?: Vec2;
    rotation?: number;
    matrixAutoUpdate?: boolean;
    matrix?: Mat3;
    generateMipmaps?: boolean;
    premultiplyAlpha?: boolean;
    flipY?: boolean;
    unpackAlignment?: 1 | 2 | 4 | 8;
    colorSpace?: ColorSpace;
    userData?: any;
    version?: number;
    isRenderTargetTexture?: boolean;
    needsPMREMUpdate?: boolean;
  }

  export interface Configuration {
    name: string;
    mipmaps: ImageData[];
    mapping: Mapping | CubeMapping;
    channel: number;
    wrapS: Wrapping;
    wrapT: Wrapping;
    wrapR: Wrapping;
    magFilter: MagnificationTextureFilter;
    minFilter: MinificationTextureFilter;
    anisotropy: number;
    format: TextureFormat | CompressedTextureFormat;
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
    unpackAlignment: 1 | 2 | 4 | 8;
    colorSpace: ColorSpace;
    userData: any;
    version: number;
    isRenderTargetTexture: boolean;
    needsPMREMUpdate: boolean;
  }
}
type Options = Texture.Options;
type Configuration = Texture.Configuration;
