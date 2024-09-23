import { Color, ColorRepresentation } from '../../math/Color.js';
import { Blending, PixelFormat, Side } from '../../constants.js';
import { Vec3 } from '../../math/Vec3.js';
import { Plane } from '../../math/Plane.js';
import { Hearth } from '../../hearth/Hearth.js';
import { Scene } from '../scenes/Scene.js';
import { Camera } from '../cameras/Camera.js';
import { Geometry } from '../../core/Geometry.js';
import { Entity } from '../../core/Entity.js';
import { Group } from '../Group.js';
import { v4 } from 'uuid';
import {
  GPUBlendFactorType,
  GPUBlendOperationType,
  GPUCompareFunctionType,
  GPUStencilOperationType,
} from '../../hearth/constants.js';

let _materialId = 0;

export interface MaterialParameters {
  alphaHash?: boolean;
  alphaTest?: number;
  alphaToCoverage?: boolean;
  blendAlpha?: number;
  blendColor?: ColorRepresentation;
  blendDst?: GPUBlendFactorType;
  blendDstAlpha?: number;
  blendEquation?: GPUBlendOperationType;
  blendEquationAlpha?: number;
  blending?: Blending;
  blendSrc?: GPUBlendFactorType;
  blendSrcAlpha?: number;
  clipIntersection?: boolean;
  clippingPlanes?: Plane[];
  clipShadows?: boolean;
  colorWrite?: boolean;
  defines?: any;
  depthFunc?: GPUCompareFunctionType;
  depthTest?: boolean;
  depthWrite?: boolean;
  name?: string;
  opacity?: number;
  polygonOffset?: boolean;
  polygonOffsetFactor?: number;
  polygonOffsetUnits?: number;
  premultipliedAlpha?: boolean;
  dithering?: boolean;
  side?: Side;
  shadowSide?: Side;
  toneMapped?: boolean;
  transparent?: boolean;
  vertexColors?: boolean;
  visible?: boolean;
  format?: PixelFormat;
  stencilWrite?: boolean;
  stencilFunc?: GPUCompareFunctionType;
  stencilRef?: number;
  stencilWriteMask?: number;
  stencilFuncMask?: number;
  stencilFail?: GPUStencilOperationType;
  stencilZFail?: GPUStencilOperationType;
  stencilZPass?: GPUStencilOperationType;
  extra?: Record<string, any>;
}

export class Material {
  declare isMaterial: true;

  id: number;
  uuid: string;
  name: string;
  blending: Blending;
  side: Side;
  vertexColors: boolean;
  opacity: number;
  transparent: boolean;
  alphaHash: boolean;
  blendSrc: GPUBlendFactorType;
  blendDst: GPUBlendFactorType;
  blendEquation: GPUBlendOperationType;
  blendSrcAlpha: number | null;
  blendDstAlpha: number | null;
  blendEquationAlpha: number | null;
  blendColor: Color;
  blendAlpha: number;
  depthFunc: GPUCompareFunctionType;
  depthTest: boolean;
  depthWrite: boolean;
  stencilWriteMask: number;
  stencilFunc: GPUCompareFunctionType;
  stencilRef: number;
  stencilFuncMask: number;
  stencilFail: GPUStencilOperationType;
  stencilZFail: GPUStencilOperationType;
  stencilZPass: GPUStencilOperationType;
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
  extra: Record<string, any>;
  version: number;
  _alphaTest: number;

  constructor(parameters?: MaterialParameters) {
    this.id = _materialId++;
    this.uuid = v4();
    this.name = '';

    this.blending = Blending.Normal;
    this.side = Side.Front;
    this.vertexColors = false;

    this.opacity = 1;
    this.transparent = false;
    this.alphaHash = false;

    this.blendSrc = GPUBlendFactorType.SrcAlpha;
    this.blendDst = GPUBlendFactorType.OneMinusSrcAlpha;
    this.blendEquation = GPUBlendOperationType.Add;
    this.blendSrcAlpha = null;
    this.blendDstAlpha = null;
    this.blendEquationAlpha = null;
    this.blendColor = Color.new(0, 0, 0);
    this.blendAlpha = 0;

    this.depthFunc = GPUCompareFunctionType.LessEqual;
    this.depthTest = true;
    this.depthWrite = true;

    this.stencilWriteMask = 0xff;
    this.stencilFunc = GPUCompareFunctionType.Always;
    this.stencilRef = 0;
    this.stencilFuncMask = 0xff;
    this.stencilFail = GPUStencilOperationType.Keep;
    this.stencilZFail = GPUStencilOperationType.Keep;
    this.stencilZPass = GPUStencilOperationType.Keep;
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

    this.extra = {};

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

  onBuild(shaderobject: any, hearth: Hearth) {}

  onBeforeRender(hearth: Hearth, scene: Scene, camera: Camera, geometry: Geometry, object: Entity, group: Group) {}

  onBeforeCompile(shaderobject: Entity, hearth: Hearth) {}

  customProgramCacheKey() {
    return this.onBeforeCompile.toString();
  }

  setValues(values?: MaterialParameters): void {
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

  set useUpdate(value: boolean) {
    if (value) ++this.version;
  }
}

Material.prototype.isMaterial = true;
