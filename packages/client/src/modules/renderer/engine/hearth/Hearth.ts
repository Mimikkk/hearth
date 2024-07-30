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
  DepthTexture,
  Entity,
  Frustum,
  Geometry,
  Group,
  Mat4,
  Material,
  Plane,
  RenderTarget,
  Texture,
} from '@modules/renderer/engine/engine.js';
import {
  GPUFeature,
  GPUIndexFormatType,
  GPULoadOpType,
  GPUStoreOpType,
  GPUTextureFormatType,
  GPUTextureViewDimensionType,
} from '@modules/renderer/engine/hearth/constants.js';
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
import { HearthResources } from '@modules/renderer/engine/hearth/Hearth.Resources.js';
import { HearthUtilities } from '@modules/renderer/engine/hearth/Hearth.Utilities.js';
import { WeakMemo } from '@modules/renderer/engine/hearth/memo/WeakMemo.js';
import RenderObject from '@modules/renderer/engine/hearth/core/RenderObject.js';
import ComputePipeline from '@modules/renderer/engine/hearth/core/ComputePipeline.js';
import Binding from '@modules/renderer/engine/hearth/bindings/Binding.js';
import ProgrammableStage from '@modules/renderer/engine/hearth/core/ProgrammableStage.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { HearthComputer } from '@modules/renderer/engine/hearth/HearthComputer.js';
import { HearthTimestamp } from '@modules/renderer/engine/hearth/Hearth.Timestamp.js';
import { HearthRenderer } from '@modules/renderer/engine/hearth/Hearth.Renderer.js';

export class Hearth {
  stats: HearthStatistics;

  _pixelRatio: number;
  _width: number;
  _height: number;

  viewport: Vec4;
  scissor: Vec4;

  useViewport: boolean;
  useScissor: boolean;

  attributes: HearthAttributes;
  geometries: HearthGeometries;
  nodes: HearthNodes;
  animation: HearthAnimation;
  bindings: HearthBindings;
  objects: HearthEntities;
  pipelines: HearthPipelines;
  resources: HearthResources;

  renderer: HearthRenderer;
  computer: HearthComputer;
  timestamp: HearthTimestamp;

  renderLists: HearthQueues;
  renderContexts: HearthContexts;
  textures: HearthTextures;
  background: HearthBackground;
  utilities: HearthUtilities;

  renderPassDescriptor: GPURenderPassDescriptor | null = null;
  resolveBufferMap: Map<number, GPUBuffer> = new Map();

  memo: WeakMemo<any, any> = new WeakMemo(() => ({}));
  device: GPUDevice;
  adapter: GPUAdapter;
  colorBuffer: GPUTexture;

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

    this.useViewport = true;
    this.useScissor = false;

    this.stats = new HearthStatistics();
    this.nodes = new HearthNodes(this);
    this.animation = new HearthAnimation(this);
    this.attributes = new HearthAttributes(this);
    this.background = new HearthBackground(this);
    this.geometries = new HearthGeometries(this);
    this.textures = new HearthTextures(this);
    this.utilities = new HearthUtilities(this);
    this.pipelines = new HearthPipelines(this);
    this.resources = new HearthResources(this);
    this.bindings = new HearthBindings(this);
    this.objects = new HearthEntities(this);
    this.renderer = new HearthRenderer(this);
    this.computer = new HearthComputer(this);
    this.timestamp = new HearthTimestamp(this);
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

    const adapter = await navigator.gpu.requestAdapter({ powerPreference: hearth.parameters.powerPreference });
    if (adapter === null) throw Error('Hearth: Unable to create WebGPU adapter.');

    const device = await adapter.requestDevice({
      requiredFeatures: Object.values(GPUFeature).filter(name => adapter.features.has(name)),
      requiredLimits: hearth.parameters.requiredLimits,
    });

    hearth.device = device;
    hearth.adapter = adapter;
    hearth.colorBuffer = hearth.textures.getColorBuffer();

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
    return this.renderer.run(scene, camera);
  }

  async compute(nodes: ComputeNode | ComputeNode[]): Promise<void> {
    return this.computer.run(nodes);
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

    if (!renderContext.clip) renderContext.clip = new ClippingContext();
    renderContext.clip.updateGlobal(this, camera);
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
    this.updateSize();
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
    this.draw(renderable);
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

  createRenderPipeline(renderObject: RenderObject) {
    this.pipelines.createRenderPipeline(renderObject);
  }

  createComputePipeline(computePipeline: ComputePipeline, bindings: Binding[]) {
    this.pipelines.createComputePipeline(computePipeline, bindings);
  }

  createBindings(bindings: Binding[]) {
    this.bindings.create(bindings);
  }

  updateBindings(bindings: Binding[]) {
    this.bindings.create(bindings);
  }

  updateBinding(binding: Binding) {
    this.bindings.updateBinding(binding);
  }

  createProgram(program: ProgrammableStage) {
    const programGPU = this.memo.get(program);

    programGPU.module = {
      module: this.device.createShaderModule({ code: program.code, label: program.stage }),
      entryPoint: 'main',
    };
  }

  destroyProgram(program: ProgrammableStage) {
    this.memo.delete(program);
  }

  hasFeature(name: string) {
    return this.adapter.features.has(name);
  }

  patchTextureAt(texture: Texture, patch: Texture, at: { x: number; y: number; z?: number; level?: number }) {
    this.textures.updateTexture(patch);
    this.textures.updateTexture(texture);

    const encoder = this.device.createCommandEncoder({
      label: 'copyTextureToTexture_' + patch.id + '_' + texture.id,
    });

    encoder.copyTextureToTexture(
      {
        texture: this.memo.get(patch).texture,
        mipLevel: at.level ?? 0,
        origin: { x: 0, y: 0, z: 0 },
      },
      {
        texture: this.memo.get(texture).texture,
        mipLevel: at.level ?? 0,
        origin: at,
      },
      [patch.image.width, patch.image.height],
    );

    this.device.queue.submit([encoder.finish()]);
  }

  readFramebuffer(into: Texture): void {
    this.textures.updateTexture(into);

    const context = this.context!;
    const data = this.memo.get(context);

    const { encoder, descriptor } = data;

    let sourceGPU = null;

    if (context.renderTarget) {
      if (DepthTexture.is(into)) {
        sourceGPU = this.memo.get(context.depthTexture).texture;
      } else {
        sourceGPU = this.memo.get(context.textures[0]).texture;
      }
    } else {
      if (DepthTexture.is(into)) {
        sourceGPU = this.textures.getDepthBuffer(context.useDepth, context.useStencil);
      } else {
        sourceGPU = this.parameters.context.getCurrentTexture();
      }
    }

    const destinationGPU = this.memo.get(into).texture;

    if (sourceGPU.format !== destinationGPU.format) {
      console.error(
        'Hearth: readFramebuffer: Source and destination formats do not match.',
        sourceGPU.format,
        destinationGPU.format,
      );

      return;
    }

    data.currentPass.end();

    encoder.copyTextureToTexture(
      {
        texture: sourceGPU,
        origin: { x: 0, y: 0, z: 0 },
      },
      {
        texture: destinationGPU,
      },
      [into.image.width, into.image.height],
    );

    if (into.generateMipmaps) this.textures.generateMipmaps(into);

    descriptor.colorAttachments[0].loadOp = GPULoadOpType.Load;
    if (context.useDepth) descriptor.depthStencilAttachment.depthLoadOp = GPULoadOpType.Load;
    if (context.useStencil) descriptor.depthStencilAttachment.stencilLoadOp = GPULoadOpType.Load;

    data.currentPass = encoder.beginRenderPass(descriptor);
    data.currentSets = { attributes: {} };
  }

  getMaxAnisotropy() {
    return 16;
  }

  updateSize() {
    this.colorBuffer = this.textures.getColorBuffer();
    this.renderPassDescriptor = null;
  }

  createIndexAttribute(attribute: Attribute) {
    this.attributes.create(attribute, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST);
  }

  createAttribute(attribute: Attribute) {
    this.attributes.create(attribute, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST);
  }

  createStorageAttribute(attribute: Attribute) {
    this.attributes.create(
      attribute,
      GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    );
  }

  updateAttribute(attribute: Attribute) {
    this.attributes.updateAttr(attribute);
  }

  destroyAttribute(attribute: Attribute) {
    this.attributes.deleteAttr(attribute);
  }

  createNodeBuilder(object: Entity, hearth: Hearth, scene: Scene | null = null) {
    return new NodeBuilder(object, hearth, scene);
  }

  copyTextureToBuffer(texture: Texture, x: number, y: number, width: number, height: number) {
    return this.textures.copyTextureToBuffer(texture, x, y, width, height);
  }

  createSampler(texture: Texture) {
    this.textures.createSampler(texture);
  }

  destroySampler(texture: Texture) {
    this.textures.destroySampler(texture);
  }

  createDefaultTexture(texture: Texture) {
    this.textures.createDefaultTexture(texture);
  }

  createTexture(texture: Texture, options) {
    this.textures.createTexture(texture, options);
  }

  updateTexture(texture: Texture, options) {
    this.textures.updateTextureTex(texture, options);
  }

  generateMipmaps(texture: Texture) {
    this.textures.generateMipmaps(texture);
  }

  destroyTexture(texture: Texture) {
    this.textures.destroyTexture(texture);
  }

  getInstanceCount({ object, geometry }: RenderObject) {
    return Math.max(geometry.instanceCount, object.count, 1);
  }

  needsRenderUpdate(renderObject: RenderObject) {
    const data = this.memo.get(renderObject);

    const { object, material } = renderObject;

    const utils = this.utilities;

    const sampleCount = utils.getSampleCount(renderObject.context);
    const colorSpace = utils.getCurrentColorSpace(renderObject.context);
    const colorFormat = utils.getCurrentColorFormat(renderObject.context);
    const depthStencilFormat = utils.getCurrentDepthStencilFormat(renderObject.context);
    const primitiveTopology = utils.getPrimitiveTopology(object, material);

    let needsUpdate = false;

    if (
      data.material !== material ||
      data.materialVersion !== material.version ||
      data.transparent !== material.transparent ||
      data.blending !== material.blending ||
      data.premultipliedAlpha !== material.premultipliedAlpha ||
      data.blendSrc !== material.blendSrc ||
      data.blendDst !== material.blendDst ||
      data.blendEquation !== material.blendEquation ||
      data.blendSrcAlpha !== material.blendSrcAlpha ||
      data.blendDstAlpha !== material.blendDstAlpha ||
      data.blendEquationAlpha !== material.blendEquationAlpha ||
      data.colorWrite !== material.colorWrite ||
      data.depthWrite !== material.depthWrite ||
      data.depthTest !== material.depthTest ||
      data.depthFunc !== material.depthFunc ||
      data.stencilWrite !== material.stencilWrite ||
      data.stencilFunc !== material.stencilFunc ||
      data.stencilFail !== material.stencilFail ||
      data.stencilZFail !== material.stencilZFail ||
      data.stencilZPass !== material.stencilZPass ||
      data.stencilFuncMask !== material.stencilFuncMask ||
      data.stencilWriteMask !== material.stencilWriteMask ||
      data.side !== material.side ||
      data.alphaToCoverage !== material.alphaToCoverage ||
      data.sampleCount !== sampleCount ||
      data.colorSpace !== colorSpace ||
      data.colorFormat !== colorFormat ||
      data.depthStencilFormat !== depthStencilFormat ||
      data.primitiveTopology !== primitiveTopology ||
      data.clippingContextVersion !== renderObject.clippingContextVersion
    ) {
      data.material = material;
      data.materialVersion = material.version;
      data.transparent = material.transparent;
      data.blending = material.blending;
      data.premultipliedAlpha = material.premultipliedAlpha;
      data.blendSrc = material.blendSrc;
      data.blendDst = material.blendDst;
      data.blendEquation = material.blendEquation;
      data.blendSrcAlpha = material.blendSrcAlpha;
      data.blendDstAlpha = material.blendDstAlpha;
      data.blendEquationAlpha = material.blendEquationAlpha;
      data.colorWrite = material.colorWrite;
      data.depthWrite = material.depthWrite;
      data.depthTest = material.depthTest;
      data.depthFunc = material.depthFunc;
      data.stencilWrite = material.stencilWrite;
      data.stencilFunc = material.stencilFunc;
      data.stencilFail = material.stencilFail;
      data.stencilZFail = material.stencilZFail;
      data.stencilZPass = material.stencilZPass;
      data.stencilFuncMask = material.stencilFuncMask;
      data.stencilWriteMask = material.stencilWriteMask;
      data.side = material.side;
      data.alphaToCoverage = material.alphaToCoverage;
      data.sampleCount = sampleCount;
      data.colorSpace = colorSpace;
      data.colorFormat = colorFormat;
      data.depthStencilFormat = depthStencilFormat;
      data.primitiveTopology = primitiveTopology;
      data.clippingContextVersion = renderObject.clippingContextVersion;

      needsUpdate = true;
    }

    return needsUpdate;
  }

  isOccluded(object: Entity) {
    const renderContext = this.context;
    if (renderContext) return false;

    const renderContextData = this.memo.get(renderContext);

    return renderContextData.occluded && renderContextData.occluded.has(object);
  }

  clear(color: boolean = true, depth: boolean = true, stencil: boolean = true) {
    return this.renderer.clear(color, depth, stencil);
  }

  async getArrayBuffer(attribute: Attribute) {
    return await this.attributes.read(attribute);
  }

  draw(renderObject: RenderObject) {
    const info = this.stats;
    const { object, geometry, context, pipeline } = renderObject;

    const bindingsData = this.memo.get(renderObject.getBindings());
    const contextData = this.memo.get(context);
    const pipelineGPU = this.memo.get(pipeline).pipeline;
    const currentSets = contextData.currentSets;

    const passEncoderGPU = contextData.currentPass;

    if (currentSets.pipeline !== pipelineGPU) {
      passEncoderGPU.setPipeline(pipelineGPU);

      currentSets.pipeline = pipelineGPU;
    }

    const bindGroupGPU = bindingsData.group;
    passEncoderGPU.setBindGroup(0, bindGroupGPU);

    const index = renderObject.getIndex();

    const hasIndex = index !== null;

    if (hasIndex === true) {
      if (currentSets.index !== index) {
        const buffer = this.memo.get(index).buffer;
        const indexFormat = index.array instanceof Uint16Array ? GPUIndexFormatType.Uint16 : GPUIndexFormatType.Uint32;

        passEncoderGPU.setIndexBuffer(buffer, indexFormat);

        currentSets.index = index;
      }
    }

    const vertexBuffers = renderObject.getVertexBuffers();

    for (let i = 0, l = vertexBuffers.length; i < l; i++) {
      const vertexBuffer = vertexBuffers[i];

      if (currentSets.attributes[i] !== vertexBuffer) {
        const buffer = this.memo.get(vertexBuffer).buffer;
        passEncoderGPU.setVertexBuffer(i, buffer);

        currentSets.attributes[i] = vertexBuffer;
      }
    }

    if (contextData.occlusionQuerySet !== undefined) {
      const lastObject = contextData.lastOcclusionObject;

      if (lastObject !== object) {
        if (lastObject !== null && lastObject.occlusionTest === true) {
          passEncoderGPU.endOcclusionQuery();
          contextData.occlusionQueryIndex++;
        }

        if (object.occlusionTest === true) {
          passEncoderGPU.beginOcclusionQuery(contextData.occlusionQueryIndex);
          contextData.occlusionQueryObjects[contextData.occlusionQueryIndex] = object;
        }

        contextData.lastOcclusionObject = object;
      }
    }

    const drawRange = geometry.drawRange;
    const firstVertex = drawRange.start;

    const instanceCount = this.getInstanceCount(renderObject);
    if (instanceCount === 0) return;

    if (hasIndex === true) {
      const indexCount = drawRange.count !== Infinity ? drawRange.count : index.count;

      passEncoderGPU.drawIndexed(indexCount, instanceCount, firstVertex, 0, 0);

      info.update(object, indexCount, instanceCount);
    } else {
      const positionAttribute = geometry.attributes.position;
      const vertexCount = drawRange.count !== Infinity ? drawRange.count : positionAttribute.count;

      passEncoderGPU.draw(vertexCount, instanceCount, firstVertex, 0);

      info.update(object, vertexCount, instanceCount);
    }
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
