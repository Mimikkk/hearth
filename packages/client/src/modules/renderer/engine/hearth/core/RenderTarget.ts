import { Texture } from '@modules/renderer/engine/entities/textures/Texture.js';
import { ColorSpace, Mapping, PixelFormat, TextureDataType, TextureFormat } from '../../constants.js';
import { Vec4 } from '../../math/Vec4.js';
import { GPUAddressModeType, GPUFilterModeType } from '@modules/renderer/engine/hearth/constants.js';
import { cloneDeep } from 'lodash-es';

export class RenderTarget {
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

    const config = RenderTarget.configure(options);
    this.configuration = config;
    config.image = image;

    const texture = new Texture(config);

    texture.flipY = false;
    texture.useMipmap = config.useMipmap;
    texture.internalFormat = config.internalFormat;

    this.textures = [];

    const count = config.count;
    for (let i = 0; i < count; i++) {
      this.textures[i] = cloneDeep(texture);
      this.textures[i].isRenderTargetTexture = true;
    }

    this.count = count;
    this.depthBuffer = config.depthBuffer;
    this.stencilBuffer = config.stencilBuffer;
    this.depthTexture = config.depthTexture;
    this.samples = config.samples;
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
}

export namespace RenderTarget {
  export interface Configuration {
    useMipmap: boolean;
    internalFormat: PixelFormat | null;
    minFilter: number;
    depthBuffer: boolean;
    stencilBuffer: boolean;
    depthTexture: Texture | null;
    samples: number;
    count: number;
    image: any | null;
    mapping: Mapping;
    wrapS: GPUAddressModeType;
    wrapT: GPUAddressModeType;
    magFilter: GPUFilterModeType;
    format: TextureFormat;
    type: TextureDataType;
    anisotropy: number;
    colorSpace: ColorSpace | null;
  }

  export interface Options extends Partial<Configuration> {}

  export const initial: Configuration = {
    useMipmap: false,
    internalFormat: null,
    minFilter: GPUFilterModeType.Linear,
    depthBuffer: true,
    stencilBuffer: false,
    depthTexture: null,
    samples: 0,
    count: 1,
    image: null,
    mapping: Mapping.UV,
    wrapS: GPUAddressModeType.ClampToEdge,
    wrapT: GPUAddressModeType.ClampToEdge,
    magFilter: GPUFilterModeType.Linear,
    format: TextureFormat.RGBA,
    type: TextureDataType.UnsignedByte,
    anisotropy: 1,
    colorSpace: null,
  };
  export const configure = (options?: Options): Configuration => ({
    useMipmap: options?.useMipmap ?? initial.useMipmap,
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
