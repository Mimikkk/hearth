import { Backend } from '@modules/renderer/engine/renderers/webgpu/Backend.js';
import { ColorSpace, Side, ToneMapping } from '@modules/renderer/engine/constants.js';
import ToneMappingNode from '@modules/renderer/engine/nodes/display/ToneMappingNode.js';
import { Info } from '@modules/renderer/engine/renderers/common/Info.js';
import { Vector4 } from '@modules/renderer/engine/math/Vector4.js';
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
import Color4 from '@modules/renderer/engine/renderers/common/Color4.js';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { Camera } from '@modules/renderer/engine/cameras/Camera.js';
import ClippingContext from '@modules/renderer/engine/renderers/common/ClippingContext.js';
import { BufferAttribute } from '@modules/renderer/engine/core/BufferAttribute.js';
import { Vector3 } from '@modules/renderer/engine/math/Vector3.js';
import { Vector2 } from '@modules/renderer/engine/math/Vector2.js';
import { Frustum, Matrix4, Object3D, Plane } from '@modules/renderer/engine/engine.js';
import { GPUFeatureNameType, GPUTextureFormatType } from '@modules/renderer/engine/renderers/webgpu/utils/constants.js';

const _scene = new Scene();
const _drawingBufferSize = new Vector2();
const _screen = new Vector4();
const _frustum = new Frustum();
const _projScreenMatrix = new Matrix4();
const _vector3 = new Vector3();

export class Renderer {
  backend: Backend;
  info: Info;
  _pixelRatio: number;
  _width: number;
  _height: number;
  _viewport: Vector4;
  _scissor: Vector4;
  _scissorTest: boolean;
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
  _clearColor: Color4;
  _clearDepth: number;
  _clearStencil: number;
  _renderTarget: any;
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
    this._pixelRatio = window.devicePixelRatio;
    this._width = this.parameters.canvas.width;
    this._height = this.parameters.canvas.height;
    this._viewport = new Vector4(0, 0, this._width, this._height);
    this._scissor = new Vector4(0, 0, this._width, this._height);
    this._scissorTest = false;
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
    this._clearColor = new Color4(0, 0, 0, this.parameters.alpha ? 0 : 1);
    this._clearDepth = 1;
    this._clearStencil = 0;
    this._renderTarget = null;
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

    return renderer;
  }

  get coordinateSystem() {
    return this.backend.coordinateSystem;
  }

  async compileAsync(scene: Scene, camera: Camera, targetScene: Scene | null = null) {
    // preserve render tree

    const nodeFrame = this._nodes.nodeFrame;

    const previousRenderId = nodeFrame.renderId;
    const previousRenderContext = this._currentRenderContext;
    const previousRenderObjectFunction = this._currentRenderObjectFunction;
    const previousCompilationPromises = this._compilationPromises;

    //

    const sceneRef = scene.isScene === true ? scene : _scene;

    if (targetScene === null) targetScene = scene;

    const renderTarget = this._renderTarget;
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
        if (object.isLight && object.layers.test(camera.layers)) {
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

  async renderAsync(scene: Scene, camera: Camera) {
    this._renderScene(scene, camera);
  }

  render(scene: Object3D, camera: Camera) {
    this._renderScene(scene, camera);
  }

  _renderScene(scene: Object3D, camera: Camera) {
    // preserve render tree

    const nodeFrame = this._nodes.nodeFrame;

    const previousRenderId = nodeFrame.renderId;
    const previousRenderContext = this._currentRenderContext;
    const previousRenderObjectFunction = this._currentRenderObjectFunction;

    //

    const sceneRef = scene.isScene === true ? scene : _scene;

    const renderTarget = this._renderTarget;
    const renderContext = this._renderContexts.get(scene, camera, renderTarget);
    const activeCubeFace = this._activeCubeFace;
    const activeMipmapLevel = this._activeMipmapLevel;

    this._currentRenderContext = renderContext;
    this._currentRenderObjectFunction = this._renderObjectFunction || this.renderObject;

    //

    this.info.calls++;
    this.info.render.calls++;

    nodeFrame.renderId = this.info.calls;

    //

    const coordinateSystem = this.coordinateSystem;

    if (camera.coordinateSystem !== coordinateSystem) {
      camera.coordinateSystem = coordinateSystem;

      camera.updateProjectionMatrix();
    }

    //

    if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();

    if (camera.parent === null && camera.matrixWorldAutoUpdate === true) camera.updateMatrixWorld();

    //

    let viewport = this._viewport;
    let scissor = this._scissor;
    let pixelRatio = this._pixelRatio;

    if (renderTarget !== null) {
      viewport = renderTarget.viewport;
      scissor = renderTarget.scissor;
      pixelRatio = 1;
    }

    this.getDrawingBufferSize(_drawingBufferSize);

    _screen.set(0, 0, _drawingBufferSize.width, _drawingBufferSize.height);

    const minDepth = viewport.minDepth === undefined ? 0 : viewport.minDepth;
    const maxDepth = viewport.maxDepth === undefined ? 1 : viewport.maxDepth;

    renderContext.viewportValue.copy(viewport).multiplyScalar(pixelRatio).floor();
    renderContext.viewportValue.width >>= activeMipmapLevel;
    renderContext.viewportValue.height >>= activeMipmapLevel;
    renderContext.viewportValue.minDepth = minDepth;
    renderContext.viewportValue.maxDepth = maxDepth;
    renderContext.viewport = renderContext.viewportValue.equals(_screen) === false;

    renderContext.scissorValue.copy(scissor).multiplyScalar(pixelRatio).floor();
    renderContext.scissor = this._scissorTest && renderContext.scissorValue.equals(_screen) === false;
    renderContext.scissorValue.width >>= activeMipmapLevel;
    renderContext.scissorValue.height >>= activeMipmapLevel;

    if (!renderContext.clippingContext) renderContext.clippingContext = new ClippingContext();
    renderContext.clippingContext.updateGlobal(this, camera);

    //

    sceneRef.onBeforeRender(this, scene, camera, renderTarget);

    //

    _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_projScreenMatrix, coordinateSystem);

    const renderList = this._renderLists.get(scene, camera);
    renderList.begin();

    this._projectObject(scene, camera, 0, renderList);

    renderList.finish();

    if (this.parameters.sortObjects) {
      renderList.sort(this._opaqueSort, this._transparentSort);
    }

    //

    if (renderTarget !== null) {
      this._textures.updateRenderTarget(renderTarget, activeMipmapLevel);

      const renderTargetData = this._textures.get(renderTarget);

      renderContext.textures = renderTargetData.textures;
      renderContext.depthTexture = renderTargetData.depthTexture;
      renderContext.width = renderTargetData.width;
      renderContext.height = renderTargetData.height;
      renderContext.renderTarget = renderTarget;
      renderContext.depth = renderTarget.depthBuffer;
      renderContext.stencil = renderTarget.stencilBuffer;
    } else {
      renderContext.textures = null;
      renderContext.depthTexture = null;
      renderContext.width = this.parameters.canvas.width;
      renderContext.height = this.parameters.canvas.height;
      renderContext.depth = this.parameters.depth;
      renderContext.stencil = this.parameters.stencil;
    }

    renderContext.width >>= activeMipmapLevel;
    renderContext.height >>= activeMipmapLevel;
    renderContext.activeCubeFace = activeCubeFace;
    renderContext.activeMipmapLevel = activeMipmapLevel;
    renderContext.occlusionQueryCount = renderList.occlusionQueryCount;

    //

    this._nodes.updateScene(sceneRef);

    //

    this._background.update(sceneRef, renderList, renderContext);

    //

    this.backend.beginRender(renderContext);

    // process render lists

    const opaqueObjects = renderList.opaque;
    const transparentObjects = renderList.transparent;
    const lightsNode = renderList.lightsNode;

    if (opaqueObjects.length > 0) this._renderObjects(opaqueObjects, camera, sceneRef, lightsNode);
    if (transparentObjects.length > 0) this._renderObjects(transparentObjects, camera, sceneRef, lightsNode);

    // finish render pass

    this.backend.finishRender(renderContext);

    // restore render tree

    nodeFrame.renderId = previousRenderId;

    this._currentRenderContext = previousRenderContext;
    this._currentRenderObjectFunction = previousRenderObjectFunction;

    //

    sceneRef.onAfterRender(this, scene, camera, renderTarget);

    //
    this.backend.resolveTimestampAsync(renderContext, 'render');

    return renderContext;
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

  async setAnimationLoop(callback: AnimationLoopFn) {
    this._animation.setAnimationLoop(callback);
  }

  getArrayBuffer(attribute: BufferAttribute<any>) {
    return this.getArrayBufferAsync(attribute);
  }

  async getArrayBufferAsync(attribute: BufferAttribute<any>) {
    return await this.backend.getArrayBufferAsync(attribute);
  }

  getContext() {
    return this.backend.getContext();
  }

  getPixelRatio() {
    return this._pixelRatio;
  }

  getDrawingBufferSize(target: Vector3) {
    return target.set(this._width * this._pixelRatio, this._height * this._pixelRatio).floor();
  }

  getSize(target: Vector2) {
    return target.set(this._width, this._height);
  }

  setPixelRatio(value: number = 1) {
    this._pixelRatio = value;

    this.setSize(this._width, this._height, false);
  }

  setDrawingBufferSize(width, height, pixelRatio) {
    this._width = width;
    this._height = height;

    this._pixelRatio = pixelRatio;

    this.parameters.canvas.width = Math.floor(width * pixelRatio);
    this.parameters.canvas.height = Math.floor(height * pixelRatio);

    this.setViewport(0, 0, width, height);

    this.backend.updateSize();
  }

  setSize(width, height, updateStyle = true) {
    this._width = width;
    this._height = height;

    this.parameters.canvas.width = Math.floor(width * this._pixelRatio);
    this.parameters.canvas.height = Math.floor(height * this._pixelRatio);

    if (updateStyle === true) {
      this.parameters.canvas.style.width = width + 'px';
      this.parameters.canvas.style.height = height + 'px';
    }

    this.setViewport(0, 0, width, height);

    this.backend.updateSize();
  }

  setOpaqueSort(method) {
    this._opaqueSort = method;
  }

  setTransparentSort(method) {
    this._transparentSort = method;
  }

  getScissor(target) {
    const scissor = this._scissor;

    target.x = scissor.x;
    target.y = scissor.y;
    target.width = scissor.width;
    target.height = scissor.height;

    return target;
  }

  setScissor(x, y, width, height) {
    const scissor = this._scissor;

    if (x.isVector4) {
      scissor.copy(x);
    } else {
      scissor.set(x, y, width, height);
    }
  }

  getScissorTest() {
    return this._scissorTest;
  }

  setScissorTest(boolean) {
    this._scissorTest = boolean;

    this.backend.setScissorTest(boolean);
  }

  getViewport(target) {
    return target.copy(this._viewport);
  }

  setViewport(x, y, width, height, minDepth = 0, maxDepth = 1) {
    const viewport = this._viewport;

    if (x.isVector4) {
      viewport.copy(x);
    } else {
      viewport.set(x, y, width, height);
    }

    viewport.minDepth = minDepth;
    viewport.maxDepth = maxDepth;
  }

  getClearColor(target) {
    return target.copy(this._clearColor);
  }

  setClearColor(color, alpha = 1) {
    this._clearColor.set(color);
    this._clearColor.a = alpha;
  }

  getClearAlpha() {
    return this._clearColor.a;
  }

  setClearAlpha(alpha) {
    this._clearColor.a = alpha;
  }

  getClearDepth() {
    return this._clearDepth;
  }

  setClearDepth(depth) {
    this._clearDepth = depth;
  }

  getClearStencil() {
    return this._clearStencil;
  }

  setClearStencil(stencil) {
    this._clearStencil = stencil;
  }

  isOccluded(object) {
    const renderContext = this._currentRenderContext;

    return renderContext && this.backend.isOccluded(renderContext, object);
  }

  clear(color = true, depth = true, stencil = true) {
    let renderTargetData = null;
    const renderTarget = this._renderTarget;

    if (renderTarget !== null) {
      this._textures.updateRenderTarget(renderTarget);

      renderTargetData = this._textures.get(renderTarget);
    }

    this.backend.clear(color, depth, stencil, renderTargetData);
  }

  clearColor() {
    return this.clear(true, false, false);
  }

  clearDepth() {
    return this.clear(false, true, false);
  }

  clearStencil() {
    return this.clear(false, false, true);
  }

  get currentColorSpace() {
    const renderTarget = this._renderTarget;

    if (renderTarget !== null) {
      const texture = renderTarget.texture;

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

    this.setRenderTarget(null);
    this.setAnimationLoop(null);
  }

  setRenderTarget(renderTarget, activeCubeFace = 0, activeMipmapLevel = 0) {
    this._renderTarget = renderTarget;
    this._activeCubeFace = activeCubeFace;
    this._activeMipmapLevel = activeMipmapLevel;
  }

  getRenderTarget() {
    return this._renderTarget;
  }

  setRenderObjectFunction(renderObjectFunction) {
    this._renderObjectFunction = renderObjectFunction;
  }

  getRenderObjectFunction() {
    return this._renderObjectFunction;
  }

  async computeAsync(computeNodes) {
    const nodeFrame = this._nodes.nodeFrame;

    const previousRenderId = nodeFrame.renderId;

    //

    this.info.calls++;
    this.info.compute.calls++;
    this.info.compute.computeCalls++;

    nodeFrame.renderId = this.info.calls;

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

    nodeFrame.renderId = previousRenderId;
  }

  copyFramebufferToTexture(framebufferTexture) {
    const renderContext = this._currentRenderContext;

    this._textures.updateTexture(framebufferTexture);

    this.backend.copyFramebufferToTexture(framebufferTexture, renderContext);
  }

  copyTextureToTexture(position, srcTexture, dstTexture, level = 0) {
    this._textures.updateTexture(srcTexture);
    this._textures.updateTexture(dstTexture);

    this.backend.copyTextureToTexture(position, srcTexture, dstTexture, level);
  }

  readRenderTargetPixelsAsync(renderTarget, x, y, width, height) {
    return this.backend.copyTextureToBuffer(renderTarget.texture, x, y, width, height);
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
        if (!object.frustumCulled || _frustum.intersectsSprite(object)) {
          if (this.parameters.sortObjects) {
            _vector3.setFromMatrixPosition(object.matrixWorld).applyMatrix4(_projScreenMatrix);
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

            _vector3
              .copy(geometry.boundingSphere.center)
              .applyMatrix4(object.matrixWorld)
              .applyMatrix4(_projScreenMatrix);
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

    object.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
    object.normalMatrix.getNormalMatrix(object.modelViewMatrix);

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
