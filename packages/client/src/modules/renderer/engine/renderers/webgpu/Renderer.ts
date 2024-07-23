import { Backend } from '@modules/renderer/engine/renderers/webgpu/Backend.js';
import { ColorSpace, Side, ToneMapping } from '@modules/renderer/engine/constants.js';
import ToneMappingNode from '@modules/renderer/engine/nodes/display/ToneMappingNode.js';
import { Info } from '@modules/renderer/engine/renderers/common/Info.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';
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
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import {
  BufferGeometry,
  Color,
  FramebufferTexture,
  Frustum,
  Group,
  Mat4,
  Material,
  Object3D,
  Plane,
  RenderTarget,
  Texture,
} from '@modules/renderer/engine/engine.js';
import { GPUFeatureNameType, GPUTextureFormatType } from '@modules/renderer/engine/renderers/webgpu/utils/constants.js';
import { RenderItem, RenderList, SortFn } from '@modules/renderer/engine/renderers/common/RenderList.js';
import { Attribute } from '@modules/renderer/engine/core/types.js';
import ComputeNode from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';
import RenderContext from '@modules/renderer/engine/renderers/common/RenderContext.js';
import LightsNode from '@modules/renderer/engine/nodes/lighting/LightsNode.js';
import PositionNode from '@modules/renderer/engine/nodes/accessors/PositionNode.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

export class Renderer {
  backend: Backend;
  info: Info;

  _pixelRatio: number;
  _width: number;
  _height: number;

  viewport: Vec4;
  scissor: Vec4;

  useScissor: boolean;

  attributes: Attributes;
  geometries: Geometries;
  nodes: Nodes;
  animation: Animation;
  bindings: Bindings;
  objects: RenderObjects;
  pipelines: Pipelines;
  renderLists: RenderLists;
  renderContexts: RenderContexts;
  _textures: Textures;
  _background: Background;

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
      sortObjects: options?.sortObjects ?? true,
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

    // transform into a class
    this._pixelRatio = window.devicePixelRatio;
    this._width = this.parameters.canvas.width;
    this._height = this.parameters.canvas.height;

    // transform into a class
    this.viewport = new Vec4(0, 0, this._width, this._height);
    // transform into a class
    this.scissor = new Vec4(0, 0, this._width, this._height);

    this.useScissor = false;

    this.backend = new Backend(this);
    this.info = new Info();
    this.nodes = new Nodes(this);
    this.animation = new Animation(this);
    this.attributes = new Attributes(this);
    this._background = new Background(this);
    this.geometries = new Geometries(this);
    this._textures = new Textures(this);
    this.pipelines = new Pipelines(this);
    this.bindings = new Bindings(this);
    this.objects = new RenderObjects(this);
    this.renderLists = new RenderLists();
    this.renderContexts = new RenderContexts();
    this.context = null;

    // transform into a class
    this._clearColor = new Color(0, 0, 0, this.parameters.alpha ? 0 : 1);
    this._clearDepth = 1;
    this._clearStencil = 0;

    // move into rendertarget
    this.target = null;
    this._activeCubeFace = 0;
    this._activeMipmapLevel = 0;

    this._renderObjectFn = null;
    this._activeRenderObjectFn = this.renderObject;
    this._handleObjectFn = this._compileObject;
  }

  static async create(parameters?: Options): Promise<Renderer> {
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

    renderer.setSize(window.innerWidth, window.innerHeight);
    if (parameters?.autoinsert === undefined || parameters.autoinsert) {
      document.body.appendChild(renderer.parameters.canvas);
    }
    if (parameters?.animate) renderer.animation.loop = parameters.animate;

    return renderer;
  }

  async render(scene: Object3D, camera: Camera): Promise<RenderContext> {
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
    this.info.calls++;
    this.info.render.calls++;

    nodeFrame.renderId = this.info.calls;
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

    const minDepth = viewport.minDepth === undefined ? 0 : viewport.minDepth;
    const maxDepth = viewport.maxDepth === undefined ? 1 : viewport.maxDepth;

    context.viewportValue.from(viewport).scale(pixelRatio).floor();
    context.viewportValue.width >>= activeMipmapLevel;
    context.viewportValue.height >>= activeMipmapLevel;
    context.viewportValue.minDepth = minDepth;
    context.viewportValue.maxDepth = maxDepth;
    context.viewport = context.viewportValue.equals(_screen) === false;

    context.scissorValue.from(scissor).scale(pixelRatio).floor();
    context.scissor = this.useScissor && context.scissorValue.equals(_screen) === false;
    context.scissorValue.width >>= activeMipmapLevel;
    context.scissorValue.height >>= activeMipmapLevel;

    if (!context.clippingContext) context.clippingContext = new ClippingContext();
    context.clippingContext.updateGlobal(this, camera);
    sceneRef.onBeforeRender(this, scene, camera, target);
    _projection.asMul(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_projection);

    const renderList = this.renderLists.get(scene, camera);
    renderList.begin();

    this._projectObject(scene, camera, 0, renderList);

    renderList.finish();

    if (this.parameters.sortObjects) {
      renderList.sort(this.opaqueSort, this.transparentSort);
    }
    if (target !== null) {
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
    context.occlusionQueryCount = renderList.occlusionQueryCount;

    this.nodes.updateScene(sceneRef);
    this._background.update(sceneRef, renderList, context);
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
    this.backend.resolveTimestampAsync(context, 'render');

    return context;
  }

  async compute(computeNodes: ComputeNode | ComputeNode[]): Promise<void> {
    const frame = this.nodes.nodeFrame;

    const previousRenderId = frame.renderId;
    this.info.calls++;
    this.info.compute.calls++;
    this.info.compute.computeCalls++;
    frame.renderId = this.info.calls;

    const backend = this.backend;
    const pipelines = this.pipelines;
    const bindings = this.bindings;
    const nodes = this.nodes;
    backend.beginCompute(computeNodes);

    const computes = Array.isArray(computeNodes) ? computeNodes : [computeNodes];
    for (const computeNode of computes) {
      if (!pipelines.has(computeNode)) computeNode.onInit({ renderer: this });

      nodes.updateForCompute(computeNode);
      bindings.updateForCompute(computeNode);

      const computeBindings = bindings.getForCompute(computeNode);
      const computePipeline = pipelines.getForCompute(computeNode, computeBindings);

      backend.compute(computeNodes, computeNode, computeBindings, computePipeline);
    }

    backend.finishCompute(computeNodes);

    await this.backend.resolveTimestampAsync(computeNodes, 'compute');
    frame.renderId = previousRenderId;
  }

  async compile(scene: Scene, camera: Camera, targetScene: Scene | null = null): Promise<void> {
    // preserve render tree

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

    this._handleObjectFn = this._renderObject;

    nodeFrame.renderId++;
    nodeFrame.update();
    renderContext.depth = this.parameters.depth;
    renderContext.stencil = this.parameters.stencil;

    if (!renderContext.clippingContext) renderContext.clippingContext = new ClippingContext();
    renderContext.clippingContext.updateGlobal(this, camera);
    sceneRef.onBeforeRender(this, scene, camera, renderTarget);
    const renderList = this.renderLists.get(scene, camera);
    renderList.begin();

    this._projectObject(scene, camera, 0, renderList);

    // include lights from target scene
    if (targetScene !== scene) {
      targetScene.traverseVisible(object => {
        if (object.isLight && object.layers.test(camera.layers)) {
          renderList.pushLight(object);
        }
      });
    }

    renderList.finish();
    if (renderTarget !== null) {
      this._textures.updateRenderTarget(renderTarget, activeMipmapLevel);

      const renderTargetData = this._textures.get(renderTarget);

      renderContext.textures = renderTargetData.textures;
      renderContext.depthTexture = renderTargetData.depthTexture;
    } else {
      renderContext.textures = null;
      renderContext.depthTexture = null;
    }
    this.nodes.updateScene(sceneRef);
    this._background.update(sceneRef, renderList, renderContext);

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

  getDrawSize(target: Vec2) {
    return target.set(this._width * this._pixelRatio, this._height * this._pixelRatio).floor();
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

  isOccluded(object: Object3D): boolean {
    const renderContext = this.context;

    return renderContext && this.backend.isOccluded(renderContext, object);
  }

  clear(color: boolean = true, depth: boolean = true, stencil: boolean = true) {
    const target = this.target;

    let data = null;
    if (target) {
      this._textures.updateRenderTarget(target);

      data = this._textures.get(target);
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
    this._textures.updateTexture(texture);

    this.backend.readFramebuffer(texture, this.context);
  }

  patchTextureAt(texture: Texture, patch: Texture, at: { x: number; y: number; z?: number; level?: number }): void {
    this._textures.updateTexture(patch);
    this._textures.updateTexture(texture);

    this.backend.patchTextureAt(texture, patch, at);
  }

  _projectObject(object: Object3D, camera: Camera, groupOrder: number, renderList: RenderList): void {
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
          if (this.parameters.sortObjects) {
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

          if (this.parameters.sortObjects) {
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
    object: Object3D,
    scene: Scene,
    camera: Camera,
    geometry: BufferGeometry,
    material: Material,
    group: Group,
    lightsNode: LightsNode,
  ): void {
    object.onBeforeRender(this, scene, camera, geometry, material, group);
    material.onBeforeRender(this, scene, camera, geometry, material, group);

    let overridePositionNode: PositionNode | undefined;
    let overrideFragmentNode: ToneMappingNode | undefined;
    if (scene.overrideMaterial) {
      const overrideMaterial = scene.overrideMaterial;

      if (Node.is(material.positionNode)) {
        overridePositionNode = overrideMaterial.positionNode;

        overrideMaterial.positionNode = material.positionNode;
      }

      if (overrideMaterial.isShadowNodeMaterial) {
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

    if (material.transparent && material.side === Side.Double) {
      material.side = Side.Back;
      this._handleObjectFn(object, material, scene, camera, lightsNode, 'backSide');
      material.side = Side.Front;
      this._handleObjectFn(object, material, scene, camera, lightsNode, 'default');

      material.side = Side.Double;
    } else {
      this._handleObjectFn(object, material, scene, camera, lightsNode, 'default');
    }

    if (scene.overrideMaterial) {
      if (overridePositionNode) scene.overrideMaterial.positionNode = overridePositionNode;
      if (overrideFragmentNode) scene.overrideMaterial.fragmentNode = overrideFragmentNode;
    }

    object.onAfterRender(this, scene, camera, geometry, material, group);
  }

  _compileObject(
    object: Object3D,
    material: Material,
    scene: Scene,
    camera: Camera,
    lightsNode: LightsNode,
    passId: string,
  ): void {
    const renderObject = this.objects.get(object, material, scene, camera, lightsNode, this.context, passId);

    this.nodes.updateBefore(renderObject);
    object.modelViewMatrix.asMul(camera.matrixWorldInverse, object.matrixWorld);
    object.normalMatrix.fromNMat4(object.modelViewMatrix);
    this.nodes.updateForRender(renderObject);
    this.geometries.updateForRender(renderObject);
    this.bindings.updateForRender(renderObject);
    this.pipelines.updateForRender(renderObject);
    this.backend.draw(renderObject, this.info);
  }

  _renderObject(
    object: Object3D,
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
}

export namespace Renderer {
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
    depth: boolean;
    localClippingEnabled: boolean;
    logarithmicDepthBuffer: boolean;
    outputColorSpace: ColorSpace;
    outputEncoding: string;
    powerPreference: GPUPowerPreference;
    sortObjects: boolean;
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

const _scene = new Scene();
const _drawSize = new Vec2();
const _screen = new Vec4();
const _frustum = new Frustum();
const _projection = new Mat4();
const _vec3 = new Vec3();

class RenderSize {
  constructor(
    public width: number,
    public height: number,
    public pixelRatio: number,
  ) {}

  static new(width: number, height: number, pixelRatio: number): RenderSize {
    return new RenderSize(width, height, pixelRatio);
  }

  set(width: number, height: number, pixelRatio: number): this {
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;

    return this;
  }
}

type RenderFn = (
  object: Object3D,
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
