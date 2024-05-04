import { EventDispatcher } from './EventDispatcher.js';
import { Texture } from '../textures/Texture.js';
import { ColorSpace, Filter, Mapping, PixelFormat, TextureDataType, TextureFormat, Wrapping } from '../constants.js';
import { Vector4 } from '../math/Vector4.js';
import { Source } from '../textures/Source.js';

export interface RenderTargetOptions {
  generateMipmaps: boolean;
  internalFormat: PixelFormat | null;
  minFilter: number;
  depthBuffer: boolean;
  stencilBuffer: boolean;
  depthTexture: Texture | null;
  samples: number;
  count: number;
  image: any | null;
  mapping: Mapping;
  wrapS: Wrapping;
  wrapT: Wrapping;
  magFilter: Filter;
  format: TextureFormat;
  type: TextureDataType;
  anisotropy: number;
  colorSpace: ColorSpace;
}

export namespace RenderTargetOptions {
  export const create = (options?: Partial<RenderTargetOptions>): RenderTargetOptions => ({
    generateMipmaps: options?.generateMipmaps ?? false,
    internalFormat: options?.internalFormat ?? null,
    minFilter: options?.minFilter ?? Filter.Linear,
    depthBuffer: options?.depthBuffer ?? true,
    stencilBuffer: options?.stencilBuffer ?? false,
    depthTexture: options?.depthTexture ?? null,
    samples: options?.samples ?? 0,
    count: options?.count ?? 1,
    image: options?.image ?? null,
    mapping: options?.mapping ?? Mapping.UV,
    wrapS: options?.wrapS ?? Wrapping.ClampToEdge,
    wrapT: options?.wrapT ?? Wrapping.ClampToEdge,
    magFilter: options?.magFilter ?? Filter.Linear,
    format: options?.format ?? TextureFormat.RGBA,
    type: options?.type ?? TextureDataType.UnsignedByte,
    anisotropy: options?.anisotropy ?? 1,
    colorSpace: options?.colorSpace ?? ColorSpace.No,
  });
}

export class RenderTarget {
  declare ['constructor']: typeof RenderTarget;
  declare isRenderTarget: true;
  eventDispatcher = new EventDispatcher<{ dispose: {} }>();

  depth: number;
  scissor: Vector4;
  scissorTest: boolean;
  viewport: Vector4;
  textures: Texture[];
  depthBuffer: boolean;
  stencilBuffer: boolean;
  depthTexture: Texture | null;
  samples: number;

  constructor(
    public width: number = 1,
    public height: number = 1,
    options: Partial<RenderTargetOptions> = {},
  ) {
    this.depth = 1;

    this.scissor = new Vector4(0, 0, width, height);
    this.scissorTest = false;

    this.viewport = new Vector4(0, 0, width, height);

    const image = { width: width, height: height, depth: 1 };

    const configuration = RenderTargetOptions.create(options);

    const texture = new Texture(
      image,
      configuration.mapping,
      configuration.wrapS,
      configuration.wrapT,
      configuration.magFilter,
      configuration.minFilter,
      configuration.format,
      configuration.type,
      configuration.anisotropy,
      configuration.colorSpace,
    );

    texture.flipY = false;
    texture.generateMipmaps = configuration.generateMipmaps;
    texture.internalFormat = configuration.internalFormat;

    this.textures = [];

    const count = configuration.count;
    for (let i = 0; i < count; i++) {
      this.textures[i] = texture.clone();
      this.textures[i].isRenderTargetTexture = true;
    }

    this.depthBuffer = configuration.depthBuffer;
    this.stencilBuffer = configuration.stencilBuffer;
    this.depthTexture = configuration.depthTexture;
    this.samples = configuration.samples;
  }

  get texture(): Texture {
    return this.textures[0];
  }

  set texture(value: Texture) {
    this.textures[0] = value;
  }

  setSize(width: number, height: number, depth: number = 1): this {
    if (this.width !== width || this.height !== height || this.depth !== depth) {
      this.width = width;
      this.height = height;
      this.depth = depth;

      for (let i = 0, il = this.textures.length; i < il; i++) {
        this.textures[i].image.width = width;
        this.textures[i].image.height = height;
        this.textures[i].image.depth = depth;
      }

      this.dispose();
    }

    this.viewport.set(0, 0, width, height);
    this.scissor.set(0, 0, width, height);
    return this;
  }

  clone() {
    return new this.constructor().copy(this);
  }

  copy(source: RenderTarget): this {
    this.width = source.width;
    this.height = source.height;
    this.depth = source.depth;

    this.scissor.copy(source.scissor);
    this.scissorTest = source.scissorTest;

    this.viewport.copy(source.viewport);

    this.textures.length = 0;

    for (let i = 0, il = source.textures.length; i < il; i++) {
      this.textures[i] = source.textures[i].clone();
      this.textures[i].isRenderTargetTexture = true;
    }

    // ensure image object is not shared, see #20328

    const image = Object.assign({}, source.texture.image);
    this.texture.source = new Source(image);

    this.depthBuffer = source.depthBuffer;
    this.stencilBuffer = source.stencilBuffer;

    if (source.depthTexture !== null) this.depthTexture = source.depthTexture.clone();

    this.samples = source.samples;

    return this;
  }

  dispose(): void {
    this.eventDispatcher.dispatch({ type: 'dispose' }, this);
  }
}

RenderTarget.prototype.isRenderTarget = true;
