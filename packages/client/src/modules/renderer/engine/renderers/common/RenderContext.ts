import { Color, RenderTarget } from '@modules/renderer/engine/engine.js';
import { ClippingContext } from '@modules/renderer/engine/renderers/common/ClippingContext.js';
import { Const } from '@modules/renderer/engine/math/types.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';

let id = 0;

export class RenderContext {
  id: number;
  color: boolean;
  clearColor: boolean;
  clearColorValue: Color;
  depth: boolean;
  clearDepth: boolean;
  clearDepthValue: number;
  stencil: boolean;
  clearStencil: boolean;
  clearStencilValue: number;
  viewport: Viewport;
  scissor: Scissor;
  textures: any;
  depthTexture: any;
  activeCubeFace: number;
  sampleCount: number;
  width: number;
  height: number;
  activeMipmapLevel: number;
  occlusionQueryCount: number;
  isRenderContext: boolean;
  stencilClearValue: number;
  depthClearValue: number;
  clip: ClippingContext;
  renderTarget: RenderTarget;

  constructor() {
    this.id = id++;

    this.color = true;
    this.clearColor = true;
    this.clearColorValue = { r: 0, g: 0, b: 0, a: 1 };
    this.clip = new ClippingContext();

    this.depth = true;
    this.clearDepth = true;
    this.clearDepthValue = 1;

    this.stencil = false;
    this.clearStencil = true;
    this.clearStencilValue = 1;

    this.viewport = Viewport.new();
    this.scissor = Scissor.new();

    this.textures = null;
    this.depthTexture = null;
    this.activeCubeFace = 0;
    this.sampleCount = 1;

    this.width = 0;
    this.height = 0;

    this.isRenderContext = true;
  }
}

export default RenderContext;

export class Scissor {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0,
    public enabled: boolean = false,
  ) {}

  static new() {
    return new Scissor();
  }

  static from({ x, y, width, height, enabled }: Const<Scissor>): Scissor {
    return new Scissor(x, y, width, height, enabled);
  }

  static fromSize(width: number, height: number): Scissor {
    return new Scissor(0, 0, width, height, false);
  }

  set(x: number, y: number, width: number, height: number, enabled: boolean = this.enabled): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.enabled = enabled;
    return this;
  }

  setSize(width: number, height: number): this {
    this.width = width;
    this.height = height;
    return this;
  }

  from({ x, y, width, height, enabled }: Const<Scissor>): this {
    return this.set(x, y, width, height, enabled);
  }

  equals({ x: width, y: height }: Const<Vec2>): boolean {
    return this.width === width && this.height === height;
  }
}

export class Viewport {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0,
    public minDepth: number = 0,
    public maxDepth: number = 1,
    public enabled: boolean = false,
  ) {}

  static new() {
    return new Viewport();
  }

  static from({ x, y, width, height, minDepth, maxDepth, enabled }: Const<Viewport>): Viewport {
    return new Viewport(x, y, width, height, minDepth, maxDepth, enabled);
  }

  static fromSize(width: number, height: number): Viewport {
    return new Viewport(0, 0, width, height);
  }

  set(
    x: number,
    y: number,
    width: number,
    height: number,
    minDepth: number = 0,
    maxDepth: number = 1,
    enabled: boolean = this.enabled,
  ): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.minDepth = minDepth;
    this.maxDepth = maxDepth;
    this.enabled = enabled;
    return this;
  }

  setSize(width: number, height: number): this {
    this.width = width;
    this.height = height;
    return this;
  }

  from({ x, y, width, height, minDepth, maxDepth, enabled }: Const<Viewport>): this {
    return this.set(x, y, width, height, minDepth, maxDepth, enabled);
  }

  equals({ x: width, y: height }: Const<Vec2>): boolean {
    return this.width === width && this.height === height;
  }
}
