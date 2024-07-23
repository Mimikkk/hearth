import { Color, ColorRepresentation } from '../math/Color.js';
import {
  Blending,
  BlendingEquation,
  BlendingFactor,
  Depth,
  PixelFormat,
  Side,
  StencilFunction,
  StencilOperation,
} from '../constants.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Plane } from '@modules/renderer/engine/math/Plane.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { Camera } from '@modules/renderer/engine/cameras/Camera.js';
import { Geometry } from '@modules/renderer/engine/core/geometry/Geometry.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { Group } from '@modules/renderer/engine/objects/Group.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { v4 } from 'uuid';

let _materialId = 0;

export interface MaterialParameters {
  alphaHash?: boolean | undefined;
  alphaTest?: number | undefined;
  alphaToCoverage?: boolean | undefined;
  blendAlpha?: number | undefined;
  blendColor?: ColorRepresentation | undefined;
  blendDst?: BlendingFactor | undefined;
  blendDstAlpha?: number | undefined;
  blendEquation?: BlendingEquation | undefined;
  blendEquationAlpha?: number | undefined;
  blending?: Blending | undefined;
  blendSrc?: BlendingFactor | undefined;
  blendSrcAlpha?: number | undefined;
  clipIntersection?: boolean | undefined;
  clippingPlanes?: Plane[] | undefined;
  clipShadows?: boolean | undefined;
  colorWrite?: boolean | undefined;
  defines?: any;
  depthFunc?: Depth | undefined;
  depthTest?: boolean | undefined;
  depthWrite?: boolean | undefined;
  name?: string | undefined;
  opacity?: number | undefined;
  polygonOffset?: boolean | undefined;
  polygonOffsetFactor?: number | undefined;
  polygonOffsetUnits?: number | undefined;
  premultipliedAlpha?: boolean | undefined;
  dithering?: boolean | undefined;
  side?: Side | undefined;
  shadowSide?: Side | undefined;
  toneMapped?: boolean | undefined;
  transparent?: boolean | undefined;
  vertexColors?: boolean | undefined;
  visible?: boolean | undefined;
  format?: PixelFormat | undefined;
  stencilWrite?: boolean | undefined;
  stencilFunc?: StencilFunction | undefined;
  stencilRef?: number | undefined;
  stencilWriteMask?: number | undefined;
  stencilFuncMask?: number | undefined;
  stencilFail?: StencilOperation | undefined;
  stencilZFail?: StencilOperation | undefined;
  stencilZPass?: StencilOperation | undefined;
  userData?: Record<string, any> | undefined;
}

export class Material {
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
  blendSrc: BlendingFactor;
  blendDst: BlendingFactor;
  blendEquation: BlendingEquation;
  blendSrcAlpha: number | null;
  blendDstAlpha: number | null;
  blendEquationAlpha: number | null;
  blendColor: Color;
  blendAlpha: number;
  depthFunc: Depth;
  depthTest: boolean;
  depthWrite: boolean;
  stencilWriteMask: number;
  stencilFunc: StencilFunction;
  stencilRef: number;
  stencilFuncMask: number;
  stencilFail: StencilOperation;
  stencilZFail: StencilOperation;
  stencilZPass: StencilOperation;
  stencilWrite: boolean;
  clippingPlanes: Plane[] | null;
  clipIntersection: boolean;
  clipShadows: boolean;
  shadowSide: Side | null;
  colorWrite: boolean;
  polygonOffset: boolean;
  polygonOffsetFactor: number;
  polygonOffsetUnits: number;
  dithering: boolean;
  alphaToCoverage: boolean;
  premultipliedAlpha: boolean;
  visible: boolean;
  toneMapped: boolean;
  userData: Record<string, any>;
  version: number;
  _alphaTest: number;

  declare positionNode?: Node;
  declare fragmentNode?: Node;

  constructor(parameters: MaterialParameters) {
    this.id = _materialId++;
    this.uuid = v4();
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
    this.blendColor = Color.new(0, 0, 0);
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

    this.polygonOffset = false;
    this.polygonOffsetFactor = 0;
    this.polygonOffsetUnits = 0;

    this.dithering = false;

    this.alphaToCoverage = false;
    this.premultipliedAlpha = false;

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

  onBuild(shaderobject: any, renderer: Renderer) {
    console.log({ shaderobject });
  }

  onBeforeRender(renderer: Renderer, scene: Scene, camera: Camera, geometry: Geometry, object: Entity, group: Group) {}

  onBeforeCompile(/* shaderobject, renderer */) {}

  customProgramCacheKey() {
    return this.onBeforeCompile.toString();
  }

  setValues(values: MaterialParameters): void {
    if (values === undefined) return;

    const isVec3 = (v: any): v is Vec3 => v instanceof Vec3;
    const isColor = (v: any): v is Color => v instanceof Color;

    for (const key in values) {
      const current = values[key as keyof MaterialParameters];
      const next = this[key as unknown as keyof this];

      if (isColor(next)) {
        next.set(current);
      } else if (isVec3(next) && isVec3(current)) {
        next.from(current);
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
    this.blendColor.from(source.blendColor);
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

    this.polygonOffset = source.polygonOffset;
    this.polygonOffsetFactor = source.polygonOffsetFactor;
    this.polygonOffsetUnits = source.polygonOffsetUnits;

    this.dithering = source.dithering;

    this.alphaTest = source.alphaTest;
    this.alphaHash = source.alphaHash;
    this.alphaToCoverage = source.alphaToCoverage;
    this.premultipliedAlpha = source.premultipliedAlpha;

    this.visible = source.visible;

    this.toneMapped = source.toneMapped;

    this.userData = JSON.parse(JSON.stringify(source.userData));

    return this;
  }

  set needsUpdate(value: boolean) {
    if (value) ++this.version;
  }
}

Material.prototype.isMaterial = true;
Material.prototype.type = 'Material';
