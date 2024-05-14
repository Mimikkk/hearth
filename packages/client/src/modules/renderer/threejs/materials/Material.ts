import { Color } from '../math/Color.js';
import { EventDispatcher } from '../core/EventDispatcher.js';
import {
  Blending,
  BlendingEquation,
  BlendingFactor,
  Depth,
  Side,
  StencilFunction,
  StencilOperation,
} from '../constants.js';
import * as MathUtils from '../math/MathUtils.js';
import { ColorRepresentation } from 'three/src/math/Color.js';
import {
  BlendingDstFactor,
  BlendingSrcFactor,
  DepthModes,
  PixelFormat,
  StencilFunc,
  StencilOp,
} from 'three/src/constants.js';
import { Vector3 } from '@modules/renderer/threejs/math/Vector3.js';
import { Plane } from '@modules/renderer/threejs/math/Plane.js';

let _materialId = 0;

export interface MaterialParameters {
  alphaHash?: boolean | undefined;
  alphaTest?: number | undefined;
  alphaToCoverage?: boolean | undefined;
  blendAlpha?: number | undefined;
  blendColor?: ColorRepresentation | undefined;
  blendDst?: BlendingDstFactor | undefined;
  blendDstAlpha?: number | undefined;
  blendEquation?: BlendingEquation | undefined;
  blendEquationAlpha?: number | undefined;
  blending?: Blending | undefined;
  blendSrc?: BlendingSrcFactor | BlendingDstFactor | undefined;
  blendSrcAlpha?: number | undefined;
  clipIntersection?: boolean | undefined;
  clippingPlanes?: Plane[] | undefined;
  clipShadows?: boolean | undefined;
  colorWrite?: boolean | undefined;
  defines?: any;
  depthFunc?: DepthModes | undefined;
  depthTest?: boolean | undefined;
  depthWrite?: boolean | undefined;
  name?: string | undefined;
  opacity?: number | undefined;
  polygonOffset?: boolean | undefined;
  polygonOffsetFactor?: number | undefined;
  polygonOffsetUnits?: number | undefined;
  precision?: 'highp' | 'mediump' | 'lowp' | null | undefined;
  premultipliedAlpha?: boolean | undefined;
  forceSinglePass?: boolean | undefined;
  dithering?: boolean | undefined;
  side?: Side | undefined;
  shadowSide?: Side | undefined;
  toneMapped?: boolean | undefined;
  transparent?: boolean | undefined;
  vertexColors?: boolean | undefined;
  visible?: boolean | undefined;
  format?: PixelFormat | undefined;
  stencilWrite?: boolean | undefined;
  stencilFunc?: StencilFunc | undefined;
  stencilRef?: number | undefined;
  stencilWriteMask?: number | undefined;
  stencilFuncMask?: number | undefined;
  stencilFail?: StencilOp | undefined;
  stencilZFail?: StencilOp | undefined;
  stencilZPass?: StencilOp | undefined;
  userData?: Record<string, any> | undefined;
}

export class Material {
  eventDispatcher = new EventDispatcher<{ dispose: {} }>();
  declare isMaterial: true;
  declare type: string | 'Material';
  id: number;
  uuid: string;
  name: string;
  blending: Blending;
  side: Side;
  vertexColors: boolean;
  opacity: number;
  transparent: boolean;
  alphaHash: boolean;
  blendSrc: BlendingSrcFactor | BlendingDstFactor;
  blendDst: BlendingDstFactor;
  blendEquation: BlendingEquation;
  blendSrcAlpha: number | null;
  blendDstAlpha: number | null;
  blendEquationAlpha: number | null;
  blendColor: Color;
  blendAlpha: number;
  depthFunc: DepthModes;
  depthTest: boolean;
  depthWrite: boolean;
  stencilWriteMask: number;
  stencilFunc: StencilFunc;
  stencilRef: number;
  stencilFuncMask: number;
  stencilFail: StencilOp;
  stencilZFail: StencilOp;
  stencilZPass: StencilOp;
  stencilWrite: boolean;
  clippingPlanes: Plane[] | null;
  clipIntersection: boolean;
  clipShadows: boolean;
  shadowSide: Side | null;
  colorWrite: boolean;
  precision: 'highp' | 'mediump' | 'lowp' | null;
  polygonOffset: boolean;
  polygonOffsetFactor: number;
  polygonOffsetUnits: number;
  dithering: boolean;
  alphaToCoverage: boolean;
  premultipliedAlpha: boolean;
  forceSinglePass: boolean;
  visible: boolean;
  toneMapped: boolean;
  userData: Record<string, any>;
  version: number;
  _alphaTest: number;

  constructor(parameters: MaterialParameters) {
    this.id = _materialId++;
    this.uuid = MathUtils.generateUuid();
    this.name = '';

    this.blending = Blending.Normal;
    this.side = Side.Front;
    this.vertexColors = false;

    this.opacity = 1;
    this.transparent = false;
    this.alphaHash = false;

    this.blendSrc = BlendingFactor.SrcAlpha;
    this.blendDst = BlendingFactor.OneMinusSrcAlpha;
    this.blendEquation = BlendingEquation.Add;
    this.blendSrcAlpha = null;
    this.blendDstAlpha = null;
    this.blendEquationAlpha = null;
    this.blendColor = new Color(0, 0, 0);
    this.blendAlpha = 0;

    this.depthFunc = Depth.LessEqual;
    this.depthTest = true;
    this.depthWrite = true;

    this.stencilWriteMask = 0xff;
    this.stencilFunc = StencilFunction.Always;
    this.stencilRef = 0;
    this.stencilFuncMask = 0xff;
    this.stencilFail = StencilOperation.Keep;
    this.stencilZFail = StencilOperation.Keep;
    this.stencilZPass = StencilOperation.Keep;
    this.stencilWrite = false;

    this.clippingPlanes = null;
    this.clipIntersection = false;
    this.clipShadows = false;

    this.shadowSide = null;

    this.colorWrite = true;

    this.precision = null; // override the renderer's default precision for this material

    this.polygonOffset = false;
    this.polygonOffsetFactor = 0;
    this.polygonOffsetUnits = 0;

    this.dithering = false;

    this.alphaToCoverage = false;
    this.premultipliedAlpha = false;
    this.forceSinglePass = false;

    this.visible = true;

    this.toneMapped = true;

    this.userData = {};

    this.version = 0;

    this._alphaTest = 0;

    this.setValues(parameters);
  }

  get alphaTest() {
    return this._alphaTest;
  }

  set alphaTest(value) {
    if (this._alphaTest > 0 !== value > 0) ++this.version;

    this._alphaTest = value;
  }

  onBuild(/* shaderobject, renderer */) {}

  onBeforeRender(/* renderer, scene, camera, geometry, object, group */) {}

  onBeforeCompile(/* shaderobject, renderer */) {}

  customProgramCacheKey() {
    return this.onBeforeCompile.toString();
  }

  setValues(values: MaterialParameters): void {
    if (values === undefined) return;

    const isVector3 = (v: any): v is Vector3 => v instanceof Vector3;
    const isColor = (v: any): v is Color => v instanceof Color;

    for (const key in values) {
      const current = values[key as keyof MaterialParameters];
      const next = this[key as unknown as keyof this];

      if (isColor(next)) {
        next.set(current);
      } else if (isVector3(next) && isVector3(current)) {
        next.copy(current);
      } else {
        this[key as unknown as keyof this] = current;
      }
    }
  }

  clone(): this {
    //@ts-expect-error
    return new this.constructor().copy(this);
  }

  copy(source: this): this {
    this.name = source.name;

    this.blending = source.blending;
    this.side = source.side;
    this.vertexColors = source.vertexColors;

    this.opacity = source.opacity;
    this.transparent = source.transparent;

    this.blendSrc = source.blendSrc;
    this.blendDst = source.blendDst;
    this.blendEquation = source.blendEquation;
    this.blendSrcAlpha = source.blendSrcAlpha;
    this.blendDstAlpha = source.blendDstAlpha;
    this.blendEquationAlpha = source.blendEquationAlpha;
    this.blendColor.copy(source.blendColor);
    this.blendAlpha = source.blendAlpha;

    this.depthFunc = source.depthFunc;
    this.depthTest = source.depthTest;
    this.depthWrite = source.depthWrite;

    this.stencilWriteMask = source.stencilWriteMask;
    this.stencilFunc = source.stencilFunc;
    this.stencilRef = source.stencilRef;
    this.stencilFuncMask = source.stencilFuncMask;
    this.stencilFail = source.stencilFail;
    this.stencilZFail = source.stencilZFail;
    this.stencilZPass = source.stencilZPass;
    this.stencilWrite = source.stencilWrite;

    const srcPlanes = source.clippingPlanes;
    let dstPlanes = null;

    if (srcPlanes !== null) {
      const n = srcPlanes.length;
      dstPlanes = new Array(n);

      for (let i = 0; i !== n; ++i) {
        dstPlanes[i] = srcPlanes[i].clone();
      }
    }

    this.clippingPlanes = dstPlanes;
    this.clipIntersection = source.clipIntersection;
    this.clipShadows = source.clipShadows;

    this.shadowSide = source.shadowSide;

    this.colorWrite = source.colorWrite;

    this.precision = source.precision;

    this.polygonOffset = source.polygonOffset;
    this.polygonOffsetFactor = source.polygonOffsetFactor;
    this.polygonOffsetUnits = source.polygonOffsetUnits;

    this.dithering = source.dithering;

    this.alphaTest = source.alphaTest;
    this.alphaHash = source.alphaHash;
    this.alphaToCoverage = source.alphaToCoverage;
    this.premultipliedAlpha = source.premultipliedAlpha;
    this.forceSinglePass = source.forceSinglePass;

    this.visible = source.visible;

    this.toneMapped = source.toneMapped;

    this.userData = JSON.parse(JSON.stringify(source.userData));

    return this;
  }

  dispose() {
    this.eventDispatcher.dispatch({ type: 'dispose' }, this);
  }

  set needsUpdate(value: boolean) {
    if (value) ++this.version;
  }
}

Material.prototype.isMaterial = true;
Material.prototype.type = 'Material';
