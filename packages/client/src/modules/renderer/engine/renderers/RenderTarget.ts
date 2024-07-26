import { Texture } from '@modules/renderer/engine/objects/textures/Texture.js';
import {
  from,
  Filter,
  MagnificationTextureFilter,
  Mapping,
  PixelFormat,
  TextureDataType,
  TextureFormat,
  Wrapping,
} from '../constants.js';
import { Vec4 } from '../math/Vec4.js';
import { Source } from '@modules/renderer/engine/objects/textures/Source.js';

export class RenderTarget {
  declare ['constructor']: typeof RenderTarget;
  declare isRenderTarget: true;

  depth: number;
  scissor: Vec4;
  scissorTest: boolean;
  viewport: Vec4;
  textures: Texture[];
  depthBuffer: boolean;
  stencilBuffer: boolean;
  depthTexture: Texture | null;
  samples: number;
  configuration: RenderTarget.Configuration;
  count: number;

  constructor(
    public width: number = 1,
    public height: number = 1,
    options?: RenderTarget.Options,
  ) {
    this.depth = 1;

    this.scissor = Vec4.new(0, 0, width, height);
    this.scissorTest = false;

    this.viewport = Vec4.new(0, 0, width, height);

    const image = { width: width, height: height, depth: 1 };

    const configuration = RenderTarget.configure(options);
    this.configuration = configuration;

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

    this.count = count;
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
    }

    this.viewport.set(0, 0, width, height);
    this.scissor.set(0, 0, width, height);
    return this;
  }

  clone() {
    return new this.constructor().copy(this);
  }

  copy(source: this): this {
    this.width = source.width;
    this.height = source.height;
    this.depth = source.depth;

    this.scissor.from(source.scissor);
    this.scissorTest = source.scissorTest;

    this.viewport.from(source.viewport);

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
}

export namespace RenderTarget {
  export interface Configuration {
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
    magFilter: MagnificationTextureFilter;
    format: TextureFormat;
    type: TextureDataType;
    anisotropy: number;
    colorSpace: from | null;
  }

  export interface Options extends Partial<Configuration> {}

  export const initial: Configuration = {
    generateMipmaps: false,
    internalFormat: null,
    minFilter: Filter.Linear,
    depthBuffer: true,
    stencilBuffer: false,
    depthTexture: null,
    samples: 0,
    count: 1,
    image: null,
    mapping: Mapping.UV,
    wrapS: Wrapping.ClampToEdge,
    wrapT: Wrapping.ClampToEdge,
    magFilter: MagnificationTextureFilter.Linear,
    format: TextureFormat.RGBA,
    type: TextureDataType.UnsignedByte,
    anisotropy: 1,
    colorSpace: null,
  };
  export const configure = (options?: Options): Configuration => ({
    generateMipmaps: options?.generateMipmaps ?? initial.generateMipmaps,
    internalFormat: options?.internalFormat ?? initial.internalFormat,
    minFilter: options?.minFilter ?? initial.minFilter,
    depthBuffer: options?.depthBuffer ?? initial.depthBuffer,
    stencilBuffer: options?.stencilBuffer ?? initial.stencilBuffer,
    depthTexture: options?.depthTexture ?? initial.depthTexture,
    samples: options?.samples ?? initial.samples,
    count: options?.count ?? initial.count,
    image: options?.image ?? initial.image,
    mapping: options?.mapping ?? initial.mapping,
    wrapS: options?.wrapS ?? initial.wrapS,
    wrapT: options?.wrapT ?? initial.wrapT,
    magFilter: options?.magFilter ?? initial.magFilter,
    format: options?.format ?? initial.format,
    type: options?.type ?? initial.type,
    anisotropy: options?.anisotropy ?? initial.anisotropy,
    colorSpace: options?.colorSpace ?? initial.colorSpace,
  });
}

RenderTarget.prototype.isRenderTarget = true;
