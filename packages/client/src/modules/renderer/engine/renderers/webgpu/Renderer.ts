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
import { Color, Light, Mat4, Object3D, Plane, RenderTarget } from '@modules/renderer/engine/engine.js';
import { GPUFeatureNameType, GPUTextureFormatType } from '@modules/renderer/engine/renderers/webgpu/utils/constants.js';
import { Frustum } from '@modules/renderer/engine/math/Frustum.js';
import { throttle } from 'lodash-es';
import { Scissor, Viewport } from '@modules/renderer/engine/renderers/common/RenderContext.js';
import ComputeNode from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';

const _scene = new Scene();
const _drawingBufferSize = Vec3.new();
const _screen = new Vec4();
const _frustum = Frustum.empty();
const _projScreenMatrix = Mat4.new();
const _vector3 = Vec3.new();

export class Renderer {
  backend: Backend;
  info: Info;
  pixelRatio: number;
  width: number;
  height: number;
  viewport: Viewport;
  scissor: Scissor;
  enabledScissor: boolean;
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
  _currentRenderContext: any;
  _opaqueSort: any;
  _transparentSort: any;
  _clearColor: Color;
  _clearDepth: number;
  _clearStencil: number;
  target: RenderTarget | null;
  _activeCubeFace: number;
  _activeMipmapLevel: number;
  _renderObjectFunction: any;
  _currentRenderObjectFunction: any;
  _handleObjectFunction: any;
  _compilationPromises: any;
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
    this.backend = new Backend(this);
    this.info = new Info();
    this.pixelRatio = window.devicePixelRatio;
    this.width = this.parameters.canvas.width;
    this.height = this.parameters.canvas.height;
    this.viewport = Viewport.fromSize(this.width, this.height);
    this.scissor = Scissor.fromSize(this.width, this.height);
    this.enabledScissor = false;
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
    this._currentRenderContext = null;
    this._opaqueSort = null;
    this._transparentSort = null;
    this._clearColor = new Color(0, 0, 0, this.parameters.alpha ? 0 : 1);
    this._clearDepth = 1;
    this._clearStencil = 0;
    this.target = null;
    this._activeCubeFace = 0;
    this._activeMipmapLevel = 0;
    this._renderObjectFunction = null;
    this._currentRenderObjectFunction = null;
    this._handleObjectFunction = this._renderObjectDirect;
    this._compilationPromises = null;
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

    renderer.pixelRatio = window.devicePixelRatio;
    renderer.updateSize(window.innerWidth, window.innerHeight);

    if (parameters?.autoinsert === undefined || parameters.autoinsert) {
      document.body.appendChild(renderer.parameters.canvas);
    }
    if (parameters?.animate) {
      renderer.setAnimationLoop(parameters.animate);
    }

    return renderer;
  }

  async compile(scene: Scene, camera: Camera, targetScene: Scene | null = null) {
    // preserve render tree

    const nodeFrame = this._nodes.frame;

    const previousRenderId = nodeFrame.renderId;
    const previousRenderContext = this._currentRenderContext;
    const previousRenderObjectFunction = this._currentRenderObjectFunction;
    const previousCompilationPromises = this._compilationPromises;

    //

    const sceneRef = scene.isScene === true ? scene : _scene;

    if (targetScene === null) targetScene = scene;

    const renderTarget = this.target;
    const renderContext = this._renderContexts.get(targetScene, camera, renderTarget);
    const activeMipmapLevel = this._activeMipmapLevel;

    const compilationPromises: any[] = [];

    this._currentRenderContext = renderContext;
    this._currentRenderObjectFunction = this.renderObject;

    this._handleObjectFunction = this._createObjectPipeline;

    this._compilationPromises = compilationPromises;

    nodeFrame.renderId++;

    //

    nodeFrame.update();

    //

    renderContext.depth = this.parameters.depth;
    renderContext.stencil = this.parameters.stencil;

    if (!renderContext.clippingContext) renderContext.clippingContext = new ClippingContext();
    renderContext.clippingContext.updateGlobal(this, camera);

    //

    sceneRef.onBeforeRender(this, scene, camera, renderTarget);

    //

    const renderList = this._renderLists.get(scene, camera);
    renderList.begin();

    this._projectObject(scene, camera, 0, renderList);

    // include lights from target scene
    if (targetScene !== scene) {
      targetScene.traverseVisible(object => {
        if (Light.is(object) && object.layers.test(camera.layers)) {
          renderList.pushLight(object);
        }
      });
    }

    renderList.finish();

    //

    if (renderTarget !== null) {
      this._textures.updateRenderTarget(renderTarget, activeMipmapLevel);

      const renderTargetData = this._textures.get(renderTarget);

      renderContext.textures = renderTargetData.textures;
      renderContext.depthTexture = renderTargetData.depthTexture;
    } else {
      renderContext.textures = null;
      renderContext.depthTexture = null;
    }

    //

    this._nodes.updateScene(sceneRef);

    //

    this._background.update(sceneRef, renderList, renderContext);

    // process render lists

    const opaqueObjects = renderList.opaque;
    const transparentObjects = renderList.transparent;
    const lightsNode = renderList.lightsNode;

    if (opaqueObjects.length > 0) this._renderObjects(opaqueObjects, camera, sceneRef, lightsNode);
    if (transparentObjects.length > 0) this._renderObjects(transparentObjects, camera, sceneRef, lightsNode);

    // restore render tree

    nodeFrame.renderId = previousRenderId;

    this._currentRenderContext = previousRenderContext;
    this._currentRenderObjectFunction = previousRenderObjectFunction;
    this._compilationPromises = previousCompilationPromises;

    this._handleObjectFunction = this._renderObjectDirect;

    // wait for all promises setup by backends awaiting compilation/linking/pipeline creation to complete

    await Promise.all(compilationPromises);
  }

  render(scene: Object3D, camera: Camera) {
    const nodeFrame = this._nodes.frame;
    const previousRenderId = nodeFrame.renderId;
    const previousRenderContext = this._currentRenderContext;
    const previousRenderObjectFunction = this._currentRenderObjectFunction;

    const target = this.target;
    const context = this._renderContexts.get(scene, camera, target);
    const activeCubeFace = this._activeCubeFace;
    const activeMipmapLevel = this._activeMipmapLevel;

    this._currentRenderContext = context;
    this._currentRenderObjectFunction = this._renderObjectFunction || this.renderObject;

    //

    this.info.updateRender();
    nodeFrame.renderId = this.info.passes;

    if (scene.matrixWorldAutoUpdate) scene.updateMatrixWorld();

    if (camera.parent === null && camera.matrixWorldAutoUpdate) camera.updateMatrixWorld();

    //

    let viewport = this.viewport;
    let scissor = this.scissor;
    let pixelRatio = this.pixelRatio;

    if (target !== null) {
      viewport = target.viewport;
      scissor = target.scissor;
      pixelRatio = 1;
    }

    this.getDrawingBufferSize(_drawingBufferSize);

    _screen.set(0, 0, _drawingBufferSize.x, _drawingBufferSize.y);

    const minDepth = viewport.minDepth === undefined ? 0 : viewport.minDepth;
    const maxDepth = viewport.maxDepth === undefined ? 1 : viewport.maxDepth;

    context.viewport.set(
      ~~(viewport.x * pixelRatio),
      ~~(viewport.y * pixelRatio),
      context.viewport.width >> activeMipmapLevel,
      context.viewport.height >> activeMipmapLevel,
      minDepth,
      maxDepth,
      context.viewport.equals(_screen),
    );

    context.scissor.set(
      scissor.x * pixelRatio,
      scissor.y * pixelRatio,
      context.scissor.width >> activeMipmapLevel,
      context.scissor.height >> activeMipmapLevel,
      this.enabledScissor && !context.scissor.equals(_screen),
    );

    if (!context.clippingContext) context.clippingContext = new ClippingContext();
    context.clippingContext.updateGlobal(this, camera);

    //

    const sceneRef = Scene.is(scene) ? scene : _scene;
    sceneRef.onBeforeRender(this, scene, camera, target);

    //

    _projScreenMatrix.from(camera.projectionMatrix).mul(camera.matrixWorldInverse);
    _frustum.fromProjection(_projScreenMatrix);

    const list = this._renderLists.get(scene, camera);

    list.begin();
    this._projectObject(scene, camera, 0, list);
    list.finish();

    if (this.parameters.sortObjects) list.sort(this._opaqueSort, this._transparentSort);

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
    context.occlusionQueryCount = list.occlusionQueryCount;

    this._nodes.updateScene(sceneRef);
    this._background.update(sceneRef, list, context);

    this.backend.beginRender(context);
    const opaqueObjects = list.opaque;
    const transparentObjects = list.transparent;
    const lightsNode = list.lightsNode;

    if (opaqueObjects.length > 0) this._renderObjects(opaqueObjects, camera, sceneRef, lightsNode);
    if (transparentObjects.length > 0) this._renderObjects(transparentObjects, camera, sceneRef, lightsNode);

    this.backend.finishRender(context);

    nodeFrame.renderId = previousRenderId;
    this._currentRenderContext = previousRenderContext;
    this._currentRenderObjectFunction = previousRenderObjectFunction;

    //

    sceneRef.onAfterRender(this, scene, camera, target);

    //
    this.backend.resolveTimestampAsync(context, 'render');

    return context;
  }

  async compute(computeNodes: ComputeNode | ComputeNode[]) {
    console.log(computeNodes);
    const frame = this._nodes.frame;

    const previousRenderId = frame.renderId;

    //
    this.info.updateCompute();

    frame.renderId = this.info.passes;

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

    frame.renderId = previousRenderId;
  }

  getMaxAnisotropy() {
    return this.backend.getMaxAnisotropy();
  }

  getActiveCubeFace() {
    return this._activeCubeFace;
  }

  getActiveMipmapLevel() {
    return this._activeMipmapLevel;
  }

  setAnimationLoop(loop: AnimationLoopFn | null) {
    this._animation.loop = loop;
  }

  getDrawingBufferSize(target: Vec3) {
    return target.set(this.width * this.pixelRatio, this.height * this.pixelRatio, 0).floor();
  }

  updateSize(width: number, height: number, pixelRatio = this.pixelRatio): this {
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;

    this.parameters.canvas.width = Math.floor(width * this.pixelRatio);
    this.parameters.canvas.height = Math.floor(height * this.pixelRatio);
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

  get currentColorSpace() {
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
    this.setAnimationLoop(null);
  }

  setRenderTarget(target: RenderTarget | null, face: number = 0, mipmap: number = 0) {
    this.target = target;
    this._activeCubeFace = face;
    this._activeMipmapLevel = mipmap;
  }

  setRenderObjectFunction(renderObjectFunction) {
    this._renderObjectFunction = renderObjectFunction;
  }

  getRenderObjectFunction() {
    return this._renderObjectFunction;
  }

  renderObject(object, scene, camera, geometry, material, group, lightsNode) {
    let overridePositionNode;
    let overrideFragmentNode;

    //

    object.onBeforeRender(this, scene, camera, geometry, material, group);

    material.onBeforeRender(this, scene, camera, geometry, material, group);

    //

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

    //

    if (material.transparent === true && material.side === Side.Double && material.forceSinglePass === false) {
      material.side = Side.Back;
      this._handleObjectFunction(object, material, scene, camera, lightsNode, 'backSide'); // create backSide pass id

      material.side = Side.Front;
      this._handleObjectFunction(object, material, scene, camera, lightsNode); // use default pass id

      material.side = Side.Double;
    } else {
      this._handleObjectFunction(object, material, scene, camera, lightsNode);
    }

    //

    if (overridePositionNode !== undefined) {
      scene.overrideMaterial.positionNode = overridePositionNode;
    }

    if (overrideFragmentNode !== undefined) {
      scene.overrideMaterial.fragmentNode = overrideFragmentNode;
    }

    //

    object.onAfterRender(this, scene, camera, geometry, material, group);
  }

  _projectObject(object, camera, groupOrder, renderList) {
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
        if (!object.frustumCulled || _frustum.intersectsSphere(object)) {
          if (this.parameters.sortObjects) {
            _vector3.fromMat4Position(object.matrixWorld).applyMat4(_projScreenMatrix);
          }

          const geometry = object.geometry;
          const material = object.material;

          if (material.visible) {
            renderList.push(object, geometry, material, groupOrder, _vector3.z, null);
          }
        }
      } else if (object.isLineLoop) {
        console.error(
          'engine.Renderer: Objects of type engine.LineLoop are not supported. Please use engine.Line or engine.LineSegments.',
        );
      } else if (object.isMesh || object.isLine || object.isPoints) {
        if (!object.frustumCulled || _frustum.intersectsObject(object)) {
          const geometry = object.geometry;
          const material = object.material;

          if (this.parameters.sortObjects) {
            if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

            _vector3.from(geometry.boundingSphere.center).applyMat4(object.matrixWorld).applyMat4(_projScreenMatrix);
          }

          if (Array.isArray(material)) {
            const groups = geometry.groups;

            for (let i = 0, l = groups.length; i < l; i++) {
              const group = groups[i];
              const groupMaterial = material[group.materialIndex];

              if (groupMaterial && groupMaterial.visible) {
                renderList.push(object, geometry, groupMaterial, groupOrder, _vector3.z, group);
              }
            }
          } else if (material.visible) {
            renderList.push(object, geometry, material, groupOrder, _vector3.z, null);
          }
        }
      }
    }

    const children = object.children;

    for (let i = 0, l = children.length; i < l; i++) {
      this._projectObject(children[i], camera, groupOrder, renderList);
    }
  }

  _renderObjects(renderList, camera, scene, lightsNode) {
    for (let i = 0, il = renderList.length; i < il; i++) {
      const renderItem = renderList[i];

      const { object, geometry, material, group } = renderItem;

      this._currentRenderObjectFunction(object, scene, camera, geometry, material, group, lightsNode);
    }
  }

  _renderObjectDirect(object, material, scene, camera, lightsNode, passId) {
    const renderObject = this._objects.get(
      object,
      material,
      scene,
      camera,
      lightsNode,
      this._currentRenderContext,
      passId,
    );

    //

    this._nodes.updateBefore(renderObject);

    //

    object.modelViewMatrix.from(camera.matrixWorldInverse).mul(object.matrixWorld);
    object.normalMatrix.fromMat4Normal(object.modelViewMatrix);

    //

    this._nodes.updateForRender(renderObject);
    this._geometries.updateForRender(renderObject);
    this._bindings.updateForRender(renderObject);
    this._pipelines.updateForRender(renderObject);

    //

    this.backend.draw(renderObject, this.info);
  }

  _createObjectPipeline(object, material, scene, camera, lightsNode, passId) {
    const renderObject = this._objects.get(
      object,
      material,
      scene,
      camera,
      lightsNode,
      this._currentRenderContext,
      passId,
    );

    //

    this._nodes.updateBefore(renderObject);

    //

    this._nodes.updateForRender(renderObject);
    this._geometries.updateForRender(renderObject);
    this._bindings.updateForRender(renderObject);

    this._pipelines.getForRender(renderObject, this._compilationPromises);
  }
}

const col = throttle(console.log, 1000);

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
