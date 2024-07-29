import { Backend } from '@modules/renderer/engine/hearth/Backend.js';
import { ColorSpace, Side, ToneMapping } from '@modules/renderer/engine/constants.js';
import ToneMappingNode from '@modules/renderer/engine/nodes/display/ToneMappingNode.js';
import { HearthStatistics } from '@modules/renderer/engine/hearth/Hearth.Statistics.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';
import { AnimationLoopFn, HearthAnimation } from '@modules/renderer/engine/hearth/Hearth.Animation.js';
import { HearthContexts } from '@modules/renderer/engine/hearth/Hearth.Contexts.js';
import { HearthBackground } from '@modules/renderer/engine/hearth/Hearth.Background.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { Camera } from '@modules/renderer/engine/entities/cameras/Camera.js';
import ClippingContext from '@modules/renderer/engine/hearth/core/ClippingContext.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import {
  Attribute,
  Color,
  Entity,
  FramebufferTexture,
  Frustum,
  Geometry,
  Group,
  Mat4,
  Material,
  Plane,
  RenderTarget,
  Texture,
} from '@modules/renderer/engine/engine.js';
import { GPUFeature, GPUTextureFormatType } from '@modules/renderer/engine/hearth/constants.js';
import { RenderItem, RenderList, SortFn } from '@modules/renderer/engine/hearth/core/RenderList.js';
import { ComputeNode } from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';
import { RenderContext } from '@modules/renderer/engine/hearth/core/RenderContext.js';
import { LightsNode } from '@modules/renderer/engine/nodes/lighting/LightsNode.js';
import { HearthQueues } from '@modules/renderer/engine/hearth/Hearth.Queues.js';
import { HearthEntities } from '@modules/renderer/engine/hearth/Hearth.Entities.js';
import { HearthAttributes } from '@modules/renderer/engine/hearth/Hearth.Attributes.js';
import { HearthGeometries } from '@modules/renderer/engine/hearth/Hearth.Geometries.js';
import { HearthNodes } from '@modules/renderer/engine/hearth/Hearth.Nodes.js';
import { HearthBindings } from '@modules/renderer/engine/hearth/Hearth.Bindings.js';
import { HearthPipelines } from '@modules/renderer/engine/hearth/Hearth.Pipelines.js';
import { HearthTextures } from '@modules/renderer/engine/hearth/Hearth.Textures.js';
import { HearthPostprocess } from '@modules/renderer/engine/hearth/Hearth.Postprocess.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';
import BackendPipelines from '@modules/renderer/engine/hearth/Backend.Pipelines.js';
import { BackendTextures } from '@modules/renderer/engine/hearth/Backend.Textures.js';
import { HearthResources } from '@modules/renderer/engine/hearth/Hearth.Resources.js';

export class Hearth {
  backend: Backend;
  info: HearthStatistics;

  _pixelRatio: number;
  _width: number;
  _height: number;

  viewport: Vec4;
  scissor: Vec4;

  useScissor: boolean;

  attributes: HearthAttributes;
  geometries: HearthGeometries;
  nodes: HearthNodes;
  animation: HearthAnimation;
  bindings: HearthBindings;
  objects: HearthEntities;
  pipelines: HearthPipelines;
  resources: HearthResources;

  renderLists: HearthQueues;
  renderContexts: HearthContexts;
  textures: BackendTextures;
  textures: HearthTextures;
  background: HearthBackground;

  // adapter: GPUAdapter;
  // device: GPUDevice;
  // colorBuffer: GPUTexture | null;
  // renderPassDescriptor: GPURenderPassDescriptor | null;
  // utilities: BackendUtilities;
  // resolveBufferMap: Map<number, GPUBuffer>;
  // resources: BackendResources;

  context: RenderContext | null;
  target: RenderTarget | null;
  _activeCubeFace: number;
  _activeMipmapLevel: number;

  opaqueSort: SortFn = sortPainterAsc;
  transparentSort: SortFn = sortPainterDesc;

  _clearColor: Color;
  _clearDepth: number;
  _clearStencil: number;

  _activeRenderObjectFn: RenderFn;
  _renderObjectFn: RenderFn;
  _handleObjectFn: RenderFn;
  parameters: Configuration;

  static configure(options?: Options): Configuration {
    const canvas = options?.canvas ?? document.createElement('canvas');
    const context = canvas.getContext('webgpu');
    if (context === null) throw Error('WebGPU not supported.');

    const antialias = options?.antialias ?? true;
    return {
      alpha: options?.alpha ?? true,
      antialias,
      sampleCount: antialias ? (options?.sampleCount ?? 4) : 1,
      autoClear: options?.autoClear ?? true,
      autoClearColor: options?.autoClearColor ?? true,
      autoClearDepth: options?.autoClearDepth ?? true,
      autoClearStencil: options?.autoClearStencil ?? true,
      canvas,
      clippingPlanes: options?.clippingPlanes ?? [],
      context,
      useDepth: options?.useDepth ?? true,
      localClippingEnabled: options?.localClippingEnabled ?? false,
      logarithmicDepthBuffer: options?.logarithmicDepthBuffer ?? false,
      outputColorSpace: options?.outputColorSpace ?? ColorSpace.SRGB,
      outputEncoding: options?.outputEncoding ?? 'sRGB',
      powerPreference: options?.powerPreference ?? 'high-performance',
      useSort: options?.useSort ?? true,
      useStencil: options?.useStencil ?? false,
      toneMapping: options?.toneMapping ?? ToneMapping.None,
      toneMappingExposure: options?.toneMappingExposure ?? 1.0,
      toneMappingNode: options?.toneMappingNode ?? null,
      requiredLimits: options?.requiredLimits ?? {},
      useTimestamp: options?.trackTimestamp ?? false,
    };
  }

  private constructor(parameters?: Options) {
    this.parameters = Hearth.configure(parameters);

    this._pixelRatio = window.devicePixelRatio;
    this._width = this.parameters.canvas.width;
    this._height = this.parameters.canvas.height;

    this.viewport = Vec4.new(0, 0, this._width, this._height);

    this.scissor = Vec4.new(0, 0, this._width, this._height);

    this.useScissor = false;

    this.backend = new Backend(this);
    this.info = new HearthStatistics();
    this.nodes = new HearthNodes(this);
    this.animation = new HearthAnimation(this);
    this.attributes = new HearthAttributes(this);
    this.background = new HearthBackground(this);
    this.geometries = new HearthGeometries(this);
    this.textures = new HearthTextures(this);
    this.pipelines = new HearthPipelines(this);
    this.resources = new HearthResources(this);
    this.bindings = new HearthBindings(this);
    this.objects = new HearthEntities(this);
    this.renderLists = new HearthQueues();
    this.renderContexts = new HearthContexts();
    this.context = null;

    this._clearColor = Color.new(0, 0, 0, this.parameters.alpha ? 0 : 1);
    this._clearDepth = 1;
    this._clearStencil = 0;

    this.target = null;
    this._activeCubeFace = 0;
    this._activeMipmapLevel = 0;

    this._renderObjectFn = null;
    this._activeRenderObjectFn = this.renderObject;
    this._handleObjectFn = this._compileObject;
  }

  static async as(parameters?: Options): Promise<Hearth> {
    const hearth = new Hearth(parameters);
    const backend = hearth.backend;

    const adapter = await navigator.gpu.requestAdapter({ powerPreference: hearth.parameters.powerPreference });
    if (adapter === null) throw Error('WebGPUBackend: Unable to create WebGPU adapter.');

    const device = await adapter.requestDevice({
      requiredFeatures: Object.values(GPUFeature).filter(name => adapter.features.has(name)),
      requiredLimits: hearth.parameters.requiredLimits,
    });

    backend.device = device;
    backend.adapter = adapter;
    backend.colorBuffer = backend.textures.getColorBuffer();

    hearth.parameters.context.configure({
      device,
      format: GPUTextureFormatType.BGRA8Unorm,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      alphaMode: hearth.parameters.alpha ? 'premultiplied' : 'opaque',
    });

    hearth.setSize(window.innerWidth, window.innerHeight);
    if (parameters?.autoinsert === undefined || parameters.autoinsert) {
      document.body.appendChild(hearth.parameters.canvas);
    }
    if (parameters?.animate) hearth.animation.loop = parameters.animate;

    return hearth;
  }

  async render(scene: Entity, camera: Camera): Promise<RenderContext> {
    const nodeFrame = this.nodes.nodeFrame;
    const previousRenderId = nodeFrame.renderId;
    const previousRenderContext = this.context;
    const previousRenderObjectFunction = this._activeRenderObjectFn;
    const sceneRef = Scene.is(scene) ? scene : _scene;

    const target = this.target;
    const context = this.renderContexts.get(scene, camera, target);
    const activeCubeFace = this._activeCubeFace;
    const activeMipmapLevel = this._activeMipmapLevel;

    this.context = context;
    this._activeRenderObjectFn = this._renderObjectFn || this.renderObject;
    this.info.passes++;
    this.info.render.passes++;

    nodeFrame.renderId = this.info.passes;
    if (scene.matrixWorldAutoUpdate) scene.updateMatrixWorld();

    if (camera.parent === null && camera.matrixWorldAutoUpdate) camera.updateMatrixWorld();
    let viewport = this.viewport;
    let scissor = this.scissor;
    let pixelRatio = this._pixelRatio;

    if (target !== null) {
      viewport = target.viewport;
      scissor = target.scissor;
      pixelRatio = 1;
    }

    this.getDrawSize(_drawSize);

    _screen.set(0, 0, _drawSize.width, _drawSize.height);

    context.viewportValue.from(viewport).scale(pixelRatio).floor();
    context.viewportValue.width >>= activeMipmapLevel;
    context.viewportValue.height >>= activeMipmapLevel;
    context.viewportValue.minDepth = 0;
    context.viewportValue.maxDepth = 1;
    context.useViewport = context.viewportValue.equals(_screen) === false;

    context.scissorValue.from(scissor).scale(pixelRatio).floor();
    context.useScissor = this.useScissor && context.scissorValue.equals(_screen) === false;
    context.scissorValue.width >>= activeMipmapLevel;
    context.scissorValue.height >>= activeMipmapLevel;

    if (!context.clippingContext) context.clippingContext = new ClippingContext();
    context.clippingContext.updateGlobal(this, camera);
    sceneRef.onBeforeRender(this, scene, camera, target);
    _projection.asMul(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.fromProjection(_projection);

    const renderList = this.renderLists.get(scene, camera);
    renderList.begin();

    this._projectObject(scene, camera, 0, renderList);

    renderList.finish();

    if (this.parameters.useSort) {
      renderList.sort(this.opaqueSort, this.transparentSort);
    }
    if (target !== null) {
      this.textures.updateRenderTarget(target, activeMipmapLevel);

      const data = this.textures.get(target);

      context.textures = data.textures;
      context.depthTexture = data.depthTexture;
      context.width = data.width;
      context.height = data.height;
      context.renderTarget = target;
      context.useDepth = target.depthBuffer;
      context.useStencil = target.stencilBuffer;
    } else {
      context.textures = null;
      context.depthTexture = null;
      context.width = this.parameters.canvas.width;
      context.height = this.parameters.canvas.height;
      context.useDepth = this.parameters.useDepth;
      context.useStencil = this.parameters.useStencil;
    }

    context.width >>= activeMipmapLevel;
    context.height >>= activeMipmapLevel;
    context.activeCubeFace = activeCubeFace;
    context.activeMipmapLevel = activeMipmapLevel;
    context.occlusionQueryCount = renderList.occlusionQueryCount;

    this.nodes.updateScene(sceneRef);
    this.background.update(sceneRef, renderList, context);
    this.backend.beginRender(context);

    const opaque = renderList.opaque;
    const transparent = renderList.transparent;
    const lightsNode = renderList.lightsNode;

    if (opaque.length > 0) this._renderObjects(opaque, camera, sceneRef, lightsNode);
    if (transparent.length > 0) this._renderObjects(transparent, camera, sceneRef, lightsNode);

    this.backend.finishRender(context);

    nodeFrame.renderId = previousRenderId;
    this.context = previousRenderContext;
    this._activeRenderObjectFn = previousRenderObjectFunction;

    sceneRef.onAfterRender(this, scene, camera, target);
    this.backend.resolveTimestamp(context, 'render');

    return context;
  }

  async compute(computeNodes: ComputeNode | ComputeNode[]): Promise<void> {
    const frame = this.nodes.nodeFrame;

    const previousRenderId = frame.renderId;
    this.info.passes++;
    this.info.compute.passes++;
    frame.renderId = this.info.passes;

    const backend = this.backend;
    const pipelines = this.pipelines;
    const bindings = this.bindings;
    const nodes = this.nodes;
    backend.beginCompute(computeNodes);

    const computes = Array.isArray(computeNodes) ? computeNodes : [computeNodes];
    for (const computeNode of computes) {
      if (!pipelines.has(computeNode)) computeNode.onInit({ hearth: this });

      nodes.updateForCompute(computeNode);
      bindings.updateForCompute(computeNode);

      const computeBindings = bindings.getForCompute(computeNode);
      const computePipeline = pipelines.getForCompute(computeNode, computeBindings);

      backend.compute(computeNodes, computeNode, computeBindings, computePipeline);
    }

    backend.finishCompute(computeNodes);

    await this.backend.resolveTimestamp(computeNodes, 'compute');
    frame.renderId = previousRenderId;
  }

  async compile(scene: Scene, camera: Camera, targetScene: Scene | null = null): Promise<void> {
    const nodeFrame = this.nodes.nodeFrame;

    const previousRenderId = nodeFrame.renderId;
    const previousRenderContext = this.context;
    const previousRenderObjectFunction = this._activeRenderObjectFn;
    const sceneRef = scene.isScene === true ? scene : _scene;

    if (targetScene === null) targetScene = scene;

    const renderTarget = this.target;
    const renderContext = this.renderContexts.get(targetScene, camera, renderTarget);
    const activeMipmapLevel = this._activeMipmapLevel;

    this.context = renderContext;
    this._activeRenderObjectFn = this.renderObject;

    this._handleObjectFn = this._createObject;

    nodeFrame.renderId++;
    nodeFrame.update();
    renderContext.useDepth = this.parameters.useDepth;
    renderContext.useStencil = this.parameters.useStencil;

    if (!renderContext.clippingContext) renderContext.clippingContext = new ClippingContext();
    renderContext.clippingContext.updateGlobal(this, camera);
    sceneRef.onBeforeRender(this, scene, camera, renderTarget);
    const renderList = this.renderLists.get(scene, camera);
    renderList.begin();

    this._projectObject(scene, camera, 0, renderList);

    if (targetScene !== scene) {
      targetScene.traverseVisible(object => {
        if (object.isLight && object.layers.test(camera.layers)) {
          renderList.pushLight(object);
        }
      });
    }

    renderList.finish();
    if (renderTarget !== null) {
      this.textures.updateRenderTarget(renderTarget, activeMipmapLevel);

      const renderTargetData = this.textures.get(renderTarget);

      renderContext.textures = renderTargetData.textures;
      renderContext.depthTexture = renderTargetData.depthTexture;
    } else {
      renderContext.textures = null;
      renderContext.depthTexture = null;
    }
    this.nodes.updateScene(sceneRef);
    this.background.update(sceneRef, renderList, renderContext);

    const opaqueObjects = renderList.opaque;
    const transparentObjects = renderList.transparent;
    const lightsNode = renderList.lightsNode;

    this._renderObjects(opaqueObjects, camera, sceneRef, lightsNode);
    this._renderObjects(transparentObjects, camera, sceneRef, lightsNode);
    nodeFrame.renderId = previousRenderId;

    this.context = previousRenderContext;
    this._activeRenderObjectFn = previousRenderObjectFunction;
    this._handleObjectFn = this._compileObject;
  }

  getMaxAnisotropy(): number {
    return this.backend.getMaxAnisotropy();
  }

  async getArrayBuffer(attribute: Attribute) {
    return await this.backend.getArrayBuffer(attribute);
  }

  getDrawSize(into: Vec2 = Vec2.new()): Vec2 {
    return into.set(this._width * this._pixelRatio, this._height * this._pixelRatio).floor();
  }

  getSize(into: Vec2) {
    return into.set(this._width, this._height);
  }

  setPixelRatio(value: number = 1) {
    this._pixelRatio = value;

    this.setSize(this._width, this._height);
  }

  setSize(width: number, height: number): void {
    this._width = width;
    this._height = height;

    this.parameters.canvas.width = Math.floor(width * this._pixelRatio);
    this.parameters.canvas.height = Math.floor(height * this._pixelRatio);
    this.parameters.canvas.style.width = width + 'px';
    this.parameters.canvas.style.height = height + 'px';

    this.viewport.set(0, 0, width, height);
    this.backend.updateSize();
  }

  isOccluded(object: Entity): boolean {
    const renderContext = this.context;

    return renderContext && this.backend.isOccluded(renderContext, object);
  }

  clear(color: boolean = true, depth: boolean = true, stencil: boolean = true) {
    const target = this.target;

    let data = null;
    if (target) {
      this.textures.updateRenderTarget(target);

      data = this.textures.get(target);
    }

    this.backend.clear(color, depth, stencil, data);
  }

  get currentColorSpace() {
    const renderTarget = this.target;

    if (renderTarget !== null) {
      const texture = renderTarget.texture;

      return (Array.isArray(texture) ? texture[0] : texture).colorSpace;
    }

    return this.parameters.outputColorSpace;
  }

  updateRenderTarget(renderTarget: RenderTarget | null, activeCubeFace: number = 0, activeMipmapLevel: number = 0) {
    this.target = renderTarget;
    this._activeCubeFace = activeCubeFace;
    this._activeMipmapLevel = activeMipmapLevel;
  }

  readFramebuffer(texture: FramebufferTexture): void {
    this.textures.updateTexture(texture);

    this.backend.readFramebuffer(texture);
  }

  patchTextureAt(texture: Texture, patch: Texture, at: { x: number; y: number; z?: number; level?: number }): void {
    this.textures.updateTexture(patch);
    this.textures.updateTexture(texture);

    this.backend.patchTextureAt(texture, patch, at);
  }

  _projectObject(object: Entity, camera: Camera, groupOrder: number, renderList: RenderList): void {
    if (object.visible === false) return;

    const visible = object.layers.test(camera.layers);

    if (visible) {
      if (object.isGroup) {
        groupOrder = object.renderOrder;
      } else if (object.isLOD) {
        if (object.autoUpdate === true) object.update(camera);
      } else if (object.isLight) {
        renderList.pushLight(object);
      } else if (object.isSprite) {
        if (!object.frustumCulled || _frustum.intersectsSprite(object)) {
          if (this.parameters.useSort) {
            _vec3.fromMat4Position(object.matrixWorld).applyMat4(_projection);
          }

          const geometry = object.geometry;
          const material = object.material;

          if (material.visible) {
            renderList.push(object, geometry, material, groupOrder, _vec3.z, null);
          }
        }
      } else if (object.isMesh || object.isLine || object.isPoints) {
        if (!object.frustumCulled || _frustum.intersectsObject(object)) {
          const geometry = object.geometry;
          const material = object.material;

          if (this.parameters.useSort) {
            if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

            _vec3.from(geometry.boundingSphere.center).applyMat4(object.matrixWorld).applyMat4(_projection);
          }

          if (Array.isArray(material)) {
            const groups = geometry.groups;

            for (let i = 0, l = groups.length; i < l; i++) {
              const group = groups[i];
              const groupMaterial = material[group.materialIndex];

              if (groupMaterial && groupMaterial.visible) {
                renderList.push(object, geometry, groupMaterial, groupOrder, _vec3.z, group);
              }
            }
          } else if (material.visible) {
            renderList.push(object, geometry, material, groupOrder, _vec3.z, null);
          }
        }
      }
    }

    const children = object.children;

    for (let i = 0, l = children.length; i < l; i++) {
      this._projectObject(children[i], camera, groupOrder, renderList);
    }
  }

  _renderObjects(renderable: RenderItem[], camera: Camera, scene: Scene, lightsNode: LightsNode): void {
    for (let i = 0, il = renderable.length; i < il; i++) {
      const renderItem = renderable[i];

      const { object, geometry, material, group } = renderItem;

      this._activeRenderObjectFn(object, scene, camera, geometry, material, group, lightsNode, 'default');
    }
  }

  renderObject(
    object: Entity,
    scene: Scene,
    camera: Camera,
    geometry: Geometry,
    material: Material,
    group: Group,
    lightsNode: LightsNode,
  ): void {
    let overridePositionNode;
    let overrideFragmentNode;
    object.onBeforeRender(this, scene, camera, geometry, material, group);

    material.onBeforeRender(this, scene, camera, geometry, material, group);

    if (scene.overrideMaterial !== null) {
      const overrideMaterial = scene.overrideMaterial;

      if (material.positionNode && material.positionNode.isNode) {
        overridePositionNode = overrideMaterial.positionNode;

        overrideMaterial.positionNode = material.positionNode;
      }

      if (overrideMaterial.isShadowNodeMaterial) {
        overrideMaterial.side = material.shadowSide === null ? material.side : material.shadowSide;

        if (material.shadowNode && material.shadowNode.isNode) {
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

    if (material.transparent === true && material.side === Side.Double) {
      material.side = Side.Back;
      this._handleObjectFn(object, material, scene, camera, lightsNode, 'backSide');

      material.side = Side.Front;
      this._handleObjectFn(object, material, scene, camera, lightsNode);

      material.side = Side.Double;
    } else {
      this._handleObjectFn(object, material, scene, camera, lightsNode);
    }

    if (overridePositionNode !== undefined) {
      scene.overrideMaterial.positionNode = overridePositionNode;
    }

    if (overrideFragmentNode !== undefined) {
      scene.overrideMaterial.fragmentNode = overrideFragmentNode;
    }
  }

  _compileObject(
    object: Entity,
    material: Material,
    scene: Scene,
    camera: Camera,
    lightsNode: LightsNode,
    passId: string,
  ): void {
    const renderable = this.objects.get(object, material, scene, camera, lightsNode, this.context, passId);

    this.nodes.updateBefore(renderable);
    object.modelViewMatrix.asMul(camera.matrixWorldInverse, object.matrixWorld);
    object.normalMatrix.fromNMat4(object.modelViewMatrix);

    this.nodes.updateForRender(renderable);
    this.geometries.updateForRender(renderable);
    this.bindings.updateForRender(renderable);
    this.pipelines.updateForRender(renderable);
    this.backend.draw(renderable);
  }

  _createObject(
    object: Entity,
    material: Material,
    scene: Scene,
    camera: Camera,
    lightsNode: LightsNode,
    passId: string,
  ): void {
    const renderable = this.objects.get(object, material, scene, camera, lightsNode, this.context, passId);

    this.nodes.updateBefore(renderable);
    this.nodes.updateForRender(renderable);
    this.geometries.updateForRender(renderable);
    this.bindings.updateForRender(renderable);
    this.pipelines.getForRender(renderable);
  }

  postprocess(into: Node) {
    return new HearthPostprocess(this, into).render();
  }
}

export namespace Hearth {
  export interface Options {
    alpha?: boolean;
    antialias?: boolean;
    sampleCount?: number;
    autoClear?: boolean;
    autoClearColor?: boolean;
    autoClearDepth?: boolean;
    autoClearStencil?: boolean;
    canvas?: HTMLCanvasElement;
    clippingPlanes?: Plane[];
    localClippingEnabled?: boolean;
    logarithmicDepthBuffer?: boolean;
    outputColorSpace?: ColorSpace;
    outputEncoding?: string;
    powerPreference?: GPUPowerPreference;

    useSort?: boolean;
    useDepth?: boolean;
    useStencil?: boolean;

    toneMapping?: ToneMapping;
    toneMappingExposure?: number;
    toneMappingNode?: ToneMappingNode | null;
    requiredLimits?: Record<string, GPUSize64>;
    trackTimestamp?: boolean;
    autoinsert?: boolean;
    animate?: AnimationLoopFn;
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
    localClippingEnabled: boolean;
    logarithmicDepthBuffer: boolean;
    outputColorSpace: ColorSpace;
    outputEncoding: string;
    powerPreference: GPUPowerPreference;

    useSort: boolean;
    useDepth: boolean;
    useStencil: boolean;

    toneMapping: ToneMapping;
    toneMappingExposure: number;
    toneMappingNode: ToneMappingNode | null;
    requiredLimits: Record<string, GPUSize64>;
    useTimestamp: boolean;
  }
}

type Options = Hearth.Options;
type Configuration = Hearth.Configuration;

const _scene = new Scene();
const _drawSize = Vec2.new();
const _screen = Vec4.new();
const _frustum = Frustum.new();
const _projection = Mat4.new();
const _vec3 = Vec3.new();

type RenderFn = (
  object: Entity,
  material: Material,
  scene: Scene,
  camera: Camera,
  lightsNode: LightsNode,
  passId: string,
) => void;

const sortPainterAsc: SortFn = (a, b) => {
  if (a.groupOrder !== b.groupOrder) {
    return a.groupOrder - b.groupOrder;
  } else if (a.renderOrder !== b.renderOrder) {
    return a.renderOrder - b.renderOrder;
  } else if (a.material.id !== b.material.id) {
    return a.material.id - b.material.id;
  } else if (a.z !== b.z) {
    return a.z - b.z;
  } else {
    return a.id - b.id;
  }
};

const sortPainterDesc: SortFn = (a, b) => sortPainterAsc(b, a);
