import { Vec4 } from '@modules/renderer/engine/engine.js';
import { RGBA } from '@modules/renderer/engine/renderers/common/Color4.js';
import ClippingContext from '@modules/renderer/engine/renderers/common/ClippingContext.js';
import { Const } from '@modules/renderer/engine/math/types.js';

let id = 0;

export class RenderContext {
  id: number;
  color: boolean;
  clearColor: boolean;
  clearColorValue: RGBA;
  depth: boolean;
  clearDepth: boolean;
  clearDepthValue: number;
  stencil: boolean;
  clearStencil: boolean;
  clearStencilValue: number;
  viewport: boolean;
  viewportValue: Vec4;
  scissor: Scissor;
  textures: any;
  depthTexture: any;
  activeCubeFace: number;
  sampleCount: number;
  width: number;
  height: number;
  isRenderContext: boolean;
  stencilClearValue: number;
  depthClearValue: number;
  clippingContext: ClippingContext;

  constructor() {
    this.id = id++;

    this.color = true;
    this.clearColor = true;
    this.clearColorValue = { r: 0, g: 0, b: 0, a: 1 };

    this.depth = true;
    this.clearDepth = true;
    this.clearDepthValue = 1;

    this.stencil = false;
    this.clearStencil = true;
    this.clearStencilValue = 1;

    this.viewport = false;
    this.viewportValue = new Vec4();

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

  from({ x, y, width, height, enabled }: Const<Scissor>): this {
    return this.set(x, y, width, height, enabled);
  }

  equals({ x, y, z: width, w: height }: Const<Vec4>): boolean {
    return this.x === x && this.y === y && this.width === width && this.height === height;
  }
}
