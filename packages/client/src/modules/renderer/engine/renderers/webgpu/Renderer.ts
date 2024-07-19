import { Backend } from '@modules/renderer/engine/renderers/webgpu/Backend.js';
import { ColorSpace, Side, ToneMapping } from '@modules/renderer/engine/constants.js';
import ToneMappingNode from '@modules/renderer/engine/nodes/display/ToneMappingNode.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import { Info } from '@modules/renderer/engine/renderers/common/Info.js';
import Attributes from '@modules/renderer/engine/renderers/common/Attributes.js';
import Geometries from '@modules/renderer/engine/renderers/common/Geometries.js';
import Nodes from '@modules/renderer/engine/renderers/common/nodes/Nodes.js';
import { Animation, AnimationLoopFn } from '@modules/renderer/engine/renderers/common/Animation.js';
import Bindings from '@modules/renderer/engine/renderers/common/Bindings.js';
import RenderObjects from '@modules/renderer/engine/renderers/common/RenderObjects.js';
import Pipelines from '@modules/renderer/engine/renderers/common/Pipelines.js';
import RenderLists from '@modules/renderer/engine/renderers/common/RenderLists.js';
import RenderContexts from '@modules/renderer/engine/renderers/common/RenderContexts.js';
import Textures from '@modules/renderer/engine/renderers/common/Textures.js';
import Background from '@modules/renderer/engine/renderers/common/Background.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { Camera } from '@modules/renderer/engine/cameras/Camera.js';
import ClippingContext from '@modules/renderer/engine/renderers/common/ClippingContext.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import {
  BufferGeometry,
  Color,
  Group,
  Light,
  Line,
  LOD,
  Mat4,
  Material,
  Mesh,
  Object3D,
  Plane,
  Points,
  RenderTarget,
  Sprite,
} from '@modules/renderer/engine/engine.js';
import { GPUFeatureNameType, GPUTextureFormatType } from '@modules/renderer/engine/renderers/webgpu/utils/constants.js';
import { Frustum } from '@modules/renderer/engine/math/Frustum.js';
import { Scissor, Viewport } from '@modules/renderer/engine/renderers/common/RenderContext.js';
import ComputeNode from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';
import { RenderList, RenderItem } from '@modules/renderer/engine/renderers/common/RenderList.js';
import LightsNode from '@modules/renderer/engine/nodes/lighting/LightsNode.js';
import { ShadowNodeMaterial } from '@modules/renderer/engine/nodes/materials/ShadowNodeMaterial.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';

const _scene = new Scene();
const _screen = Vec2.new();
const _frustum = Frustum.empty();
const _projScreenMatrix = Mat4.new();
const _vector3 = Vec3.new();

export class Renderer {
  backend: Backend;
  info: Info;

  size: ViewSize;
  viewport: Viewport;
  scissor: Scissor;
  useScissor: boolean;

  _attributes: Attributes;
  _geometries: Geometries;
  _nodes: Nodes;
  _animation: Animation;
  _bindings: Bindings;
  _objects: RenderObjects;
  _pipelines: Pipelines;
  _renderLists: RenderLists;
  _renderContexts: RenderContexts;
  _textures: Textures;
  _background: Background;
  _activeRenderContext: any;
  sortOpaque: SortFn;
  sortTransparent: SortFn;
  _clearColor: Color;
  _clearDepth: number;
  _clearStencil: number;
  target: RenderTarget | null;
  activeFace: number;
  activeMipmap: number;
  _renderObject: (
    object: Object3D,
    scene: Scene,
    camera: Camera,
    geometry: BufferGeometry,
    material: Material,
    group: Group,
    lightsNode: LightsNode,
  ) => void;
  _activeRenderObject: (
    object: Object3D,
    scene: Scene,
    camera: Camera,
    geometry: BufferGeometry,
    material: Material,
    group: Group | null,
    lightsNode: LightsNode,
  ) => void;
  _handleObject: (
    object: Object3D,
    material: Material,
    scene: Scene,
    camera: Camera,
    lightsNode: LightsNode,
    passId: string,
  ) => void;
  parameters: Configuration;

  static configure(options?: Options): Configuration {
    const canvas = options?.canvas ?? document.createElement('canvas');
    const context = canvas.getContext('webgpu');
    if (context === null) throw Error('WebGPU not supported.');

    const antialias = options?.antialias ?? true;
    return {
      alpha: options?.alpha ?? true,
      antialias,
      sampleCount: antialias ? options?.sampleCount ?? 4 : 1,
      autoClear: options?.autoClear ?? true,
      autoClearColor: options?.autoClearColor ?? true,
      autoClearDepth: options?.autoClearDepth ?? true,
      autoClearStencil: options?.autoClearStencil ?? true,
      canvas,
      clippingPlanes: options?.clippingPlanes ?? [],
      context,
      depth: options?.depth ?? true,
      localClippingEnabled: options?.localClippingEnabled ?? false,
      logarithmicDepthBuffer: options?.logarithmicDepthBuffer ?? false,
      outputColorSpace: options?.outputColorSpace ?? ColorSpace.SRGB,
      outputEncoding: options?.outputEncoding ?? 'sRGB',
      powerPreference: options?.powerPreference ?? 'high-performance',
      useSort: options?.sortObjects ?? true,
      stencil: options?.stencil ?? false,
      toneMapping: options?.toneMapping ?? ToneMapping.None,
      toneMappingExposure: options?.toneMappingExposure ?? 1.0,
      toneMappingNode: options?.toneMappingNode ?? null,
      requiredLimits: options?.requiredLimits ?? {},
      trackTimestamp: options?.trackTimestamp ?? false,
    };
  }

  private constructor(parameters?: Options) {
    this.parameters = Renderer.configure(parameters);
    this.backend = new Backend(this);

    const { width, height } = this.parameters.canvas;
    this.size = ViewSize.fromSize(width, height);
    this.viewport = Viewport.fromSize(width, height);
    this.scissor = Scissor.fromSize(width, height);
    this.useScissor = false;

    this.info = new Info();
    this._nodes = new Nodes(this);
    this._animation = new Animation(this);
    this._attributes = new Attributes(this);
    this._background = new Background(this);
    this._geometries = new Geometries(this);
    this._textures = new Textures(this);
    this._pipelines = new Pipelines(this);
    this._bindings = new Bindings(this);
    this._objects = new RenderObjects(this);
    this._renderLists = new RenderLists();
    this._renderContexts = new RenderContexts();
    this._activeRenderContext = null;

    this.sortOpaque = painterSortStable;
    this.sortTransparent = reversePainterSortStable;

    this._clearColor = Color.new(0, 0, 0, this.parameters.alpha ? 0 : 1);
    this._clearDepth = 1;
    this._clearStencil = 0;

    this.target = null;
    this.activeFace = 0;
    this.activeMipmap = 0;

    this._renderObject = null!;
    this._activeRenderObject = this.renderObject;
    this._handleObject = this._renderObjectDirect;
  }

  static async create(parameters?: Options) {
    const renderer = new Renderer(parameters);
    const backend = renderer.backend;

    const adapter = await navigator.gpu.requestAdapter({ powerPreference: renderer.parameters.powerPreference });
    if (adapter === null) throw Error('WebGPUBackend: Unable to create WebGPU adapter.');

    const device = await adapter.requestDevice({
      requiredFeatures: Object.values(GPUFeatureNameType).filter(name => adapter.features.has(name)),
      requiredLimits: renderer.parameters.requiredLimits,
    });

    backend.device = device;
    backend.adapter = adapter;
    backend.colorBuffer = backend.textures.getColorBuffer();

    renderer.parameters.context.configure({
      device,
      format: GPUTextureFormatType.BGRA8Unorm,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      alphaMode: renderer.parameters.alpha ? 'premultiplied' : 'opaque',
    });

    renderer.updateSize(window.innerWidth, window.innerHeight);
    if (parameters?.autoinsert === undefined || parameters.autoinsert) {
      document.body.appendChild(renderer.parameters.canvas);
    }
    if (parameters?.animate) renderer._animation.loop = parameters.animate;

    return renderer;
  }

  async compile(scene: Scene, camera: Camera, targetScene: Scene | null = null) {
    const frame = this._nodes.frame;
    const previousRenderId = frame.id;
    const previousRenderContext = this._activeRenderContext;
    const previousRenderObjectFunction = this._activeRenderObject;

    //

    const sceneRef = Scene.is(scene) ? scene : _scene;

    if (targetScene === null) targetScene = scene;

    const target = this.target;
    const renderContext = this._renderContexts.get(targetScene, camera, target);
    const activeMipmapLevel = this.activeMipmap;

    this._activeRenderContext = renderContext;
    this._activeRenderObject = this.renderObject;
    this._handleObject = this._createObjectPipeline;

    frame.id++;
    frame.update();

    renderContext.depth = this.parameters.depth;
    renderContext.stencil = this.parameters.stencil;

    if (!renderContext.clip) renderContext.clip = new ClippingContext();
    renderContext.clip.updateGlobal(this, camera);

    //@ts-expect-error
    sceneRef.onBeforeRender(this, scene, camera);

    const list = this._renderLists.get(scene, camera);
    list.begin();

    this._projectObject(scene, camera, 0, list);

    if (targetScene !== scene) {
      targetScene.traverseVisible(object => {
        if (Light.is(object) && object.layers.test(camera.layers)) {
          list.lights.push(object);
        }
      });
    }

    list.finish();

    if (target !== null) {
      this._textures.updateRenderTarget(target, activeMipmapLevel);

      const renderTargetData = this._textures.get(target);

      renderContext.textures = renderTargetData.textures;
      renderContext.depthTexture = renderTargetData.depthTexture;
    } else {
      renderContext.textures = null;
      renderContext.depthTexture = null;
    }

    this._nodes.updateScene(sceneRef);

    this._background.update(sceneRef, list, renderContext);

    const opaqueObjects = list.opaque;
    const transparentObjects = list.transparent;
    const lightsNode = list.node;

    if (opaqueObjects.length > 0) this._renderObjects(opaqueObjects, camera, sceneRef, lightsNode);
    if (transparentObjects.length > 0) this._renderObjects(transparentObjects, camera, sceneRef, lightsNode);

    frame.id = previousRenderId;
    this._activeRenderContext = previousRenderContext;
    this._activeRenderObject = previousRenderObjectFunction;
    this._handleObject = this._renderObjectDirect;
  }

  async render(scene: Object3D, camera: Camera) {
    const frame = this._nodes.frame;
    const previousFrameId = frame.id;
    const previousContext = this._activeRenderContext;
    const previousRenderObject = this._activeRenderObject;

    const target = this.target;
    const context = this._renderContexts.get(scene, camera, target);
    const activeCubeFace = this.activeFace;
    const activeMipmapLevel = this.activeMipmap;

    this._activeRenderContext = context;
    this._activeRenderObject = this._renderObject || this.renderObject;

    this.info.updateRender();
    frame.id = this.info.passes;

    if (scene.useMatrixWorldAutoUpdate) scene.updateMatrixWorld();
    if (camera.parent === null && camera.useMatrixWorldAutoUpdate) camera.updateMatrixWorld();

    const viewport = target?.viewport ?? this.viewport;
    const scissor = target?.scissor ?? this.scissor;
    const pixelRatio = target ? 1 : this.size.pixelRatio;

    this.getDrawSize(_screen);

    context.viewport.set(
      ~~(viewport.x * pixelRatio),
      ~~(viewport.y * pixelRatio),
      context.viewport.width >> activeMipmapLevel,
      context.viewport.height >> activeMipmapLevel,
      viewport.minDepth,
      viewport.maxDepth,
      context.viewport.equals(_screen),
    );

    context.scissor.set(
      scissor.x * pixelRatio,
      scissor.y * pixelRatio,
      context.scissor.width >> activeMipmapLevel,
      context.scissor.height >> activeMipmapLevel,
      this.useScissor && !context.scissor.equals(_screen),
    );

    if (!context.clip) context.clip = new ClippingContext();
    context.clip.updateGlobal(this, camera);

    //

    const sceneRef = Scene.is(scene) ? scene : _scene;
    sceneRef.onBeforeRender(this, scene, camera);

    //

    _projScreenMatrix.from(camera.projectionMatrix).mul(camera.matrixWorldInverse);
    _frustum.fromProjection(_projScreenMatrix);

    const list = this._renderLists.get(scene, camera);

    list.begin();
    this._projectObject(scene, camera, 0, list);
    list.finish();

    if (this.parameters.useSort) list.sort(this.sortOpaque, this.sortTransparent);

    if (target) {
      this._textures.updateRenderTarget(target, activeMipmapLevel);

      const renderTargetData = this._textures.get(target);

      context.textures = renderTargetData.textures;
      context.depthTexture = renderTargetData.depthTexture;
      context.width = renderTargetData.width;
      context.height = renderTargetData.height;
      context.renderTarget = target;
      context.depth = target.depthBuffer;
      context.stencil = target.stencilBuffer;
    } else {
      context.textures = null;
      context.depthTexture = null;
      context.width = this.parameters.canvas.width;
      context.height = this.parameters.canvas.height;
      context.depth = this.parameters.depth;
      context.stencil = this.parameters.stencil;
    }

    context.width >>= activeMipmapLevel;
    context.height >>= activeMipmapLevel;
    context.activeCubeFace = activeCubeFace;
    context.activeMipmapLevel = activeMipmapLevel;
    context.occlusionQueryCount = list.occlusionCount;

    this._nodes.updateScene(sceneRef);
    this._background.update(sceneRef, list, context);

    this.backend.beginRender(context);
    const opaque = list.opaque;
    const transparent = list.transparent;
    const lightsNode = list.node;

    if (opaque.length > 0) this._renderObjects(opaque, camera, sceneRef, lightsNode);
    if (transparent.length > 0) this._renderObjects(transparent, camera, sceneRef, lightsNode);
    this.backend.finishRender(context);

    frame.id = previousFrameId;
    this._activeRenderContext = previousContext;
    this._activeRenderObject = previousRenderObject;

    sceneRef.onAfterRender(this, scene, camera, target);
    await this.backend.resolveTimestampAsync(context, 'render');

    return context;
  }

  async compute(computeNodes: ComputeNode | ComputeNode[]) {
    const frame = this._nodes.frame;

    const previousRenderId = frame.id;

    //
    this.info.updateCompute();

    frame.id = this.info.passes;

    //

    const backend = this.backend;
    const pipelines = this._pipelines;
    const bindings = this._bindings;
    const nodes = this._nodes;
    const computeList = Array.isArray(computeNodes) ? computeNodes : [computeNodes];

    if (computeList[0] === undefined || computeList[0].isComputeNode !== true) {
      throw new Error('engine.Renderer: .compute() expects a ComputeNode.');
    }

    backend.beginCompute(computeNodes);

    for (const computeNode of computeList) {
      // onInit

      if (pipelines.has(computeNode) === false) {
        const dispose = () => {
          computeNode.eventDispatcher.remove('dispose', dispose);

          pipelines.delete(computeNode);
          bindings.delete(computeNode);
          nodes.delete(computeNode);
        };

        computeNode.eventDispatcher.add('dispose', dispose);

        //

        computeNode.onInit({ renderer: this });
      }

      nodes.updateForCompute(computeNode);
      bindings.updateForCompute(computeNode);

      const computeBindings = bindings.getForCompute(computeNode);
      const computePipeline = pipelines.getForCompute(computeNode, computeBindings);

      backend.compute(computeNodes, computeNode, computeBindings, computePipeline);
    }

    backend.finishCompute(computeNodes);

    await this.backend.resolveTimestampAsync(computeNodes, 'compute');

    //

    frame.id = previousRenderId;
  }

  getDrawSize(into: Vec2 = Vec2.new()): Vec2 {
    return into.set(this.size.width * this.size.pixelRatio, this.size.height * this.size.pixelRatio).floor();
  }

  updateSize(width: number, height: number, pixelRatio = this.size.pixelRatio): this {
    this.size.set(width, height, pixelRatio);

    this.parameters.canvas.width = Math.floor(width * this.size.pixelRatio);
    this.parameters.canvas.height = Math.floor(height * this.size.pixelRatio);
    this.parameters.canvas.style.width = width + 'px';
    this.parameters.canvas.style.height = height + 'px';

    this.viewport.setSize(width, height);
    this.backend.updateSize();
    return this;
  }

  clear(color: boolean = true, depth: boolean = true, stencil: boolean = true): this {
    let targetData = null;
    const target = this.target;

    if (target) {
      this._textures.updateRenderTarget(target);
      targetData = this._textures.get(target);
    }

    this.backend.clear(color, depth, stencil, targetData);
    return this;
  }

  get activeColorSpace() {
    const target = this.target;
    if (target) {
      const texture = target.texture;

      return (Array.isArray(texture) ? texture[0] : texture).colorSpace;
    }

    return this.parameters.outputColorSpace;
  }

  dispose() {
    this.info.dispose();
    this._animation.dispose();
    this._objects.dispose();
    this._pipelines.dispose();
    this._nodes.dispose();
    this._bindings.dispose();
    this._renderLists.dispose();
    this._renderContexts.dispose();
    this._textures.dispose();
    this.target = null;
    this._animation.loop = null;
  }

  setRenderTarget(target: RenderTarget | null, face: number = 0, mipmap: number = 0) {
    this.target = target;
    this.activeFace = face;
    this.activeMipmap = mipmap;
  }

  renderObject(
    object: Object3D,
    scene: Scene,
    camera: Camera,
    geometry: BufferGeometry,
    material: Material,
    group: Group,
    lightsNode: LightsNode,
  ) {
    object.onBeforeRender(this, scene, camera, geometry, material, group);
    material.onBeforeRender(this, scene, camera, geometry, material, group);

    let overridePositionNode;
    let overrideFragmentNode;
    if (scene.overrideMaterial) {
      const overrideMaterial = scene.overrideMaterial;

      if (material.positionNode && Node.is(material.positionNode)) {
        overridePositionNode = overrideMaterial.positionNode;
        overrideMaterial.positionNode = material.positionNode;
      }

      if (ShadowNodeMaterial.is(overrideMaterial)) {
        overrideMaterial.side = material.shadowSide === null ? material.side : material.shadowSide;

        if (Node.is(material.shadowNode)) {
          overrideFragmentNode = overrideMaterial.fragmentNode;
          overrideMaterial.fragmentNode = material.shadowNode;
        }

        if (this.parameters.localClippingEnabled) {
          if (material.clipShadows) {
            if (overrideMaterial.clippingPlanes !== material.clippingPlanes) {
              overrideMaterial.clippingPlanes = material.clippingPlanes;
              overrideMaterial.needsUpdate = true;
            }

            if (overrideMaterial.clipIntersection !== material.clipIntersection) {
              overrideMaterial.clipIntersection = material.clipIntersection;
            }
          } else if (Array.isArray(overrideMaterial.clippingPlanes)) {
            overrideMaterial.clippingPlanes = null;
            overrideMaterial.needsUpdate = true;
          }
        }
      }

      material = overrideMaterial;
    }

    if (material.transparent && material.side === Side.Double && !material.useSinglePass) {
      material.side = Side.Back;
      this._handleObject(object, material, scene, camera, lightsNode, 'first');
      material.side = Side.Front;
      this._handleObject(object, material, scene, camera, lightsNode, 'second');

      material.side = Side.Double;
    } else {
      this._handleObject(object, material, scene, camera, lightsNode, 'first');
    }

    if (overridePositionNode) scene.overrideMaterial!.positionNode = overridePositionNode;
    if (overrideFragmentNode) scene.overrideMaterial!.fragmentNode = overrideFragmentNode;

    object.onAfterRender(this, scene, camera, geometry, material, group);
  }

  _projectObject(object: Object3D, camera: Camera, groupOrder: number, list: RenderList): void {
    if (!object.visible) return;

    const visible = object.layers.test(camera.layers);

    if (visible) {
      if (Group.is(object)) {
        groupOrder = object.renderOrder;
      } else if (LOD.is(object)) {
        if (object.autoUpdate) object.update(camera);
      } else if (Light.is(object)) {
        list.lights.push(object);
      } else if (Sprite.is(object)) {
        if (!object.frustumCulled || _frustum.intersectsSphere(object)) {
          if (this.parameters.useSort) _vector3.fromMat4Position(object.matrixWorld).applyMat4(_projScreenMatrix);

          const geometry = object.geometry;
          const material = object.material;
          if (material.visible) list.push(object, geometry, material, groupOrder, _vector3.z, null);
        }
      } else if (Mesh.is(object) || Line.is(object) || Points.is(object)) {
        if (!object.frustumCulled || _frustum.intersectsObject(object)) {
          const geometry = object.geometry;
          const material = object.material;

          if (this.parameters.useSort) {
            if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

            _vector3.from(geometry.boundingSphere!.center).applyMat4(object.matrixWorld).applyMat4(_projScreenMatrix);
          }

          if (Array.isArray(material)) {
            const groups = geometry.groups;

            for (let i = 0, it = groups.length; i < it; i++) {
              const group = groups[i];
              const groupMaterial = material[group.materialIndex];

              if (groupMaterial && groupMaterial.visible) {
                list.push(object, geometry, groupMaterial, groupOrder, _vector3.z, group);
              }
            }
          } else if (material.visible) {
            list.push(object, geometry, material, groupOrder, _vector3.z, null);
          }
        }
      }
    }

    const children = object.children;
    for (let i = 0, it = children.length; i < it; i++) {
      this._projectObject(children[i], camera, groupOrder, list);
    }
  }

  _renderObjects(items: RenderItem[], camera: Camera, scene: Scene, lightsNode: LightsNode): void {
    for (let i = 0, it = items.length; i < it; i++) {
      const { object, geometry, material, group } = items[i];

      this._activeRenderObject(object, scene, camera, geometry, material, group, lightsNode);
    }
  }

  _renderObjectDirect(
    object: Object3D,
    material: Material,
    scene: Scene,
    camera: Camera,
    lightsNode: LightsNode,
    passId: string,
  ): void {
    const renderObject = this._objects.get(
      object,
      material,
      scene,
      camera,
      lightsNode,
      this._activeRenderContext,
      passId,
    );

    this._nodes.updateBefore(renderObject);

    object.modelViewMatrix.from(camera.matrixWorldInverse).mul(object.matrixWorld);
    object.normalMatrix.fromNMat4(object.modelViewMatrix);

    this._nodes.updateForRender(renderObject);
    this._geometries.updateForRender(renderObject);
    this._bindings.updateForRender(renderObject);
    this._pipelines.updateForRender(renderObject);

    this.backend.draw(renderObject, this.info);
  }

  _createObjectPipeline(
    object: Object3D,
    material: Material,
    scene: Scene,
    camera: Camera,
    lightsNode: LightsNode,
    passId: string,
  ): void {
    const renderObject = this._objects.get(
      object,
      material,
      scene,
      camera,
      lightsNode,
      this._activeRenderContext,
      passId,
    );
    this._nodes.updateBefore(renderObject);
    this._nodes.updateForRender(renderObject);
    this._geometries.updateForRender(renderObject);
    this._bindings.updateForRender(renderObject);
    this._pipelines.getForRender(renderObject);
  }
}

export namespace Renderer {
  export interface Options {
    autoinsert?: boolean;
    animate?: AnimationLoopFn;
    alpha?: boolean;
    antialias?: boolean;
    sampleCount?: number;
    autoClear?: boolean;
    autoClearColor?: boolean;
    autoClearDepth?: boolean;
    autoClearStencil?: boolean;
    canvas?: HTMLCanvasElement;
    clippingPlanes?: Plane[];
    depth?: boolean;
    localClippingEnabled?: boolean;
    logarithmicDepthBuffer?: boolean;
    outputColorSpace?: ColorSpace;
    outputEncoding?: string;
    powerPreference?: GPUPowerPreference;
    sortObjects?: boolean;
    stencil?: boolean;
    toneMapping?: ToneMapping;
    toneMappingExposure?: number;
    toneMappingNode?: ToneMappingNode | null;
    requiredLimits?: Record<string, GPUSize64>;
    trackTimestamp?: boolean;
  }

  export interface Configuration {
    alpha: boolean;
    antialias: boolean;
    sampleCount: number;
    autoClear: boolean;
    autoClearColor: boolean;
    autoClearDepth: boolean;
    autoClearStencil: boolean;
    canvas: HTMLCanvasElement;
    clippingPlanes: Plane[];
    context: GPUCanvasContext;
    depth: boolean;
    localClippingEnabled: boolean;
    logarithmicDepthBuffer: boolean;
    outputColorSpace: ColorSpace;
    outputEncoding: string;
    powerPreference: GPUPowerPreference;
    useSort: boolean;
    stencil: boolean;
    toneMapping: ToneMapping;
    toneMappingExposure: number;
    toneMappingNode: ToneMappingNode | null;
    requiredLimits: Record<string, GPUSize64>;
    trackTimestamp: boolean;
  }
}
type Options = Renderer.Options;
type Configuration = Renderer.Configuration;

export class ViewSize {
  constructor(
    public width: number = 0,
    public height: number = 0,
    public pixelRatio = window.devicePixelRatio,
    public useScissor: boolean = false,
  ) {}

  static new(
    width: number = 0,
    height: number = 0,
    pixelRatio = window.devicePixelRatio,
    useScissor: boolean = false,
  ): ViewSize {
    return new ViewSize(width, height, pixelRatio, useScissor);
  }

  static fromSize(
    width: number,
    height: number,
    pixelRatio = window.devicePixelRatio,
    useScissor: boolean = false,
  ): ViewSize {
    return new ViewSize(width, height, pixelRatio, useScissor);
  }

  set(
    width: number,
    height: number,
    pixelRatio: number = this.pixelRatio,
    useScissor: boolean = this.useScissor,
  ): this {
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;
    this.useScissor = useScissor;
    return this;
  }
}

type SortFn = (a: RenderItem, b: RenderItem) => number;
const painterSortStable: SortFn = (a, b) => {
  if (a.groupOrder !== b.groupOrder) return a.groupOrder - b.groupOrder;
  if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
  if (a.material.id !== b.material.id) return a.material.id - b.material.id;
  if (a.z !== b.z) return a.z - b.z;
  return a.id - b.id;
};
const reversePainterSortStable: SortFn = (a, b) => painterSortStable(b, a);
