import { Color, DepthTexture, RenderTarget, Texture, Vec4 } from '@modules/renderer/engine/engine.js';
import { ClippingContext } from '@modules/renderer/engine/hearth/core/ClippingContext.js';
import { Const } from '@modules/renderer/engine/math/types.js';

let id = 0;

export class RenderContext {
  declare isRenderContext: true;
  id: number;

  useClearColor: boolean;
  clearColor: Color;

  useDepth: boolean;
  depthClear: number;

  useClearDepth: boolean;
  clearDepth: number;

  useClearStencil: boolean;
  stencilClear: number;

  useStencil: boolean;
  clearStencil: number;

  useUpdateViewport: boolean;
  viewport: RenderViewport;

  useUpdateScissor: boolean;
  scissor: RenderScissor;

  textures: Texture[] | null;
  depthTexture: DepthTexture | null;

  width: number;
  height: number;

  sampleCount: number;

  clip: ClippingContext;
  target: RenderTarget;
  activeCubeFace: number;
  activeMipmapLevel: number;
  occlusionQueryCount: number;

  constructor() {
    this.id = id++;

    this.useClearColor = true;
    this.clearColor = { r: 0, g: 0, b: 0, a: 1 };

    this.useDepth = true;
    this.useClearDepth = true;
    this.clearDepth = 1;

    this.useStencil = false;
    this.useClearStencil = true;
    this.clearStencil = 1;

    this.useUpdateViewport = false;
    this.viewport = RenderViewport.new();

    this.useUpdateScissor = false;
    this.scissor = RenderScissor.new();
    this.clip = new ClippingContext();

    this.textures = null;
    this.depthTexture = null;
    this.activeCubeFace = 0;
    this.sampleCount = 1;

    this.width = 0;
    this.height = 0;
  }
}

RenderContext.prototype.isRenderContext = true;

class RenderViewport {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public minDepth: number = 0,
    public maxDepth: number = 1,
  ) {}

  static new() {
    return new RenderViewport(0, 0, 0, 0);
  }

  set(
    x: number,
    y: number,
    width: number,
    height: number,
    minDepth: number = this.minDepth,
    maxDepth: number = this.maxDepth,
  ): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.minDepth = minDepth;
    this.maxDepth = maxDepth;
    return this;
  }

  equalsVec({ x, y, z: width, w: height }: Const<Vec4>): boolean {
    return this.x === x && this.y === y && this.width === width && this.height === height;
  }
}

class RenderScissor {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {}

  static new() {
    return new RenderScissor(0, 0, 0, 0);
  }

  set(x: number, y: number, width: number, height: number): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
  }

  equalsVec({ x, y, z: width, w: height }: Const<Vec4>): boolean {
    return this.x === x && this.y === y && this.width === width && this.height === height;
  }
}
