import {
  ColorSpace,
  MagnificationTextureFilter,
  Mapping,
  MinificationTextureFilter,
  PixelFormat,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../constants.js';
import * as MathUtils from '../math/MathUtils.js';
import { Vec2 } from '../math/Vec2.js';
import { Mat3 } from '../math/Mat3.js';
import { Source } from './Source.js';
import type { CubeTexture } from './CubeTexture.js';

let _textureId = 0;

export class Texture {
  declare ['constructor']: typeof Texture;
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
  declare wrapR: Wrapping;
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
  onUpdate: any;
  isRenderTargetTexture: boolean;
  needsPMREMUpdate: boolean;
  userData: any;

  constructor(
    image: TexImageSource | OffscreenCanvas,
    mapping: Mapping = Mapping.UV,
    wrapS: Wrapping = Wrapping.ClampToEdge,
    wrapT: Wrapping = Wrapping.ClampToEdge,
    magFilter: MagnificationTextureFilter = MagnificationTextureFilter.Linear,
    minFilter: MinificationTextureFilter = MinificationTextureFilter.LinearMipmapLinear,
    format: TextureFormat = TextureFormat.RGBA,
    type: TextureDataType = TextureDataType.UnsignedByte,
    anisotropy: number = 1,
    colorSpace: ColorSpace = null,
  ) {
    this.id = ++_textureId;

    this.uuid = MathUtils.generateUuid();

    this.name = '';

    this.source = new Source(image);
    this.mipmaps = [];

    this.mapping = mapping;
    this.channel = 0;

    this.wrapS = wrapS;
    this.wrapT = wrapT;

    this.magFilter = magFilter;
    this.minFilter = minFilter;

    this.anisotropy = anisotropy;

    this.format = format;
    this.internalFormat = null;
    this.type = type;

    this.offset = Vec2.new(0, 0);
    this.repeat = Vec2.new(1, 1);
    this.center = Vec2.new(0, 0);
    this.rotation = 0;

    this.matrixAutoUpdate = true;
    this.matrix = new Mat3();

    this.generateMipmaps = true;
    this.premultiplyAlpha = false;
    this.flipY = true;
    // valid values: 1, 2, 4, 8 (see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glPixelStorei.xml)
    this.unpackAlignment = 4;

    this.colorSpace = colorSpace;

    this.userData = {};

    this.version = 0;
    this.onUpdate = null;

    // indicates whether a texture belongs to a render target or not
    this.isRenderTargetTexture = false;
    // indicates whether this texture should be processed by PMREMGenerator or not (only relevant for render target textures)
    this.needsPMREMUpdate = false;
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
    if (value === true) {
      this.version++;
      this.source.needsUpdate = true;
    }
  }
}
Texture.prototype.isTexture = true;
