import { BufferAttribute, CoordinateSystem, Object3D, RenderTarget, Scene, Texture, Vec2, Vec3 } from '../../engine.js';

import {
  GPUFeatureNameType,
  GPUIndexFormatType,
  GPULoadOpType,
  GPUStoreOpType,
  GPUTextureViewDimensionType,
} from './utils/constants.js';

import { BackendUtilities } from './utils/BackendUtilities.js';
import { BackendAttributes } from './utils/BackendAttributes.js';
import { BackendBindings } from './utils/BackendBindings.js';
import BackendPipelines from './utils/BackendPipelines.js';
import { BackendTextures } from './utils/BackendTextures.js';
import type { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import RenderContext from '@modules/renderer/engine/renderers/common/RenderContext.js';
import ComputeNode from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';
import ComputePipeline from '@modules/renderer/engine/renderers/common/ComputePipeline.js';
import Binding from '@modules/renderer/engine/renderers/common/Binding.js';
import { Info } from '@modules/renderer/engine/renderers/common/Info.js';
import RenderObject from '@modules/renderer/engine/renderers/common/RenderObject.js';
import ProgrammableStage from '@modules/renderer/engine/renderers/common/ProgrammableStage.js';
import Color4 from '@modules/renderer/engine/renderers/common/Color4.js';
import { ResourceManager } from './utils/ResourceManager.js';
import { NodeBuilder } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.js';

export class Backend {
  data: WeakMap<any, any>;
  renderer: Renderer;

  getInstanceCount(renderObject: RenderObject) {
    const { object, geometry } = renderObject;

    return geometry.isInstancedBufferGeometry ? geometry.instanceCount : object.isInstancedMesh ? object.count : 1;
  }

  getDrawingBufferSize() {
    const vec2 = new Vec2();

    return this.renderer.getDrawingBufferSize(vec2);
  }

  getClearColor() {
    const renderer = this.renderer;

    const color4 = new Color4(0, 0, 0, 1);

    renderer.getClearColor(color4);

    color4.getRGB(color4, this.renderer.currentColorSpace);

    return color4;
  }

  // resource properties

  set(object: any, value: any) {
    this.data.set(object, value);
  }

  get(object: any) {
    let map = this.data.get(object);

    if (map === undefined) {
      map = {};
      this.data.set(object, map);
    }

    return map;
  }

  has(object: any) {
    return this.data.has(object);
  }

  delete(object: any) {
    this.data.delete(object);
  }

  adapter: GPUAdapter;
  device: GPUDevice;
  colorBuffer: GPUTexture | null;
  renderPassDescriptor: GPURenderPassDescriptor | null;
  utilities: BackendUtilities;
  attributes: BackendAttributes;
  bindings: BackendBindings;
  pipelines: BackendPipelines;
  textures: BackendTextures;
  resolveBufferMap: Map<number, GPUBuffer>;
  resources: ResourceManager;

  constructor(renderer: Renderer) {
    this.data = new WeakMap();
    this.renderer = renderer;

    this.adapter = null!;
    this.device = null!;
    this.colorBuffer = null;
    this.renderPassDescriptor = null;

    this.resources = new ResourceManager(this);
    this.utilities = new BackendUtilities(this);
    this.attributes = new BackendAttributes(this);
    this.bindings = new BackendBindings(this);
    this.pipelines = new BackendPipelines(this);
    this.textures = new BackendTextures(this);
    this.resolveBufferMap = new Map();
  }

  get coordinateSystem() {
    return CoordinateSystem.WebGPU;
  }

  async getArrayBufferAsync(attribute: BufferAttribute<any>) {
    return await this.attributes.getArrayBufferAsync(attribute);
  }

  getContext(): GPUCanvasContext {
    return this.renderer.parameters.context;
  }

  _getDefaultRenderPassDescriptor() {
    let descriptor = this.renderPassDescriptor;

    const antialias = this.renderer.parameters.antialias;

    if (descriptor === null) {
      const renderer = this.renderer;

      descriptor = {
        colorAttachments: [
          {
            view: null,
          },
        ],
        depthStencilAttachment: {
          view: this.textures.getDepthBuffer(renderer.parameters.depth, renderer.parameters.stencil).createView(),
        },
      };

      const colorAttachment = descriptor.colorAttachments[0];

      if (antialias === true) {
        colorAttachment.view = this.colorBuffer.createView();
      } else {
        colorAttachment.resolveTarget = undefined;
      }

      this.renderPassDescriptor = descriptor;
    }

    const colorAttachment = descriptor.colorAttachments[0];

    if (antialias === true) {
      colorAttachment.resolveTarget = this.renderer.parameters.context.getCurrentTexture().createView();
    } else {
      colorAttachment.view = this.renderer.parameters.context.getCurrentTexture().createView();
    }

    return descriptor;
  }

  _getRenderPassDescriptor(renderContext: RenderContext) {
    const renderTarget = renderContext.renderTarget;
    const renderTargetData = this.get(renderTarget);

    let descriptors = renderTargetData.descriptors;

    if (descriptors === undefined) {
      descriptors = [];

      renderTargetData.descriptors = descriptors;
    }

    if (
      renderTargetData.width !== renderTarget.width ||
      renderTargetData.height !== renderTarget.height ||
      renderTargetData.activeMipmapLevel !== renderTarget.activeMipmapLevel ||
      renderTargetData.samples !== renderTarget.samples
    ) {
      descriptors.length = 0;
    }

    let descriptor = descriptors[renderContext.activeCubeFace];

    if (descriptor === undefined) {
      const textures = renderContext.textures;
      const colorAttachments = [];

      for (let i = 0; i < textures.length; i++) {
        const textureData = this.get(textures[i]);

        const textureView = textureData.texture.createView({
          baseMipLevel: renderContext.activeMipmapLevel,
          mipLevelCount: 1,
          baseArrayLayer: renderContext.activeCubeFace,
          dimension: GPUTextureViewDimensionType.TwoD,
        });

        let view, resolveTarget;

        if (textureData.msaaTexture !== undefined) {
          view = textureData.msaaTexture.createView();
          resolveTarget = textureView;
        } else {
          view = textureView;
          resolveTarget = undefined;
        }

        colorAttachments.push({
          view,
          resolveTarget,
          loadOp: GPULoadOpType.Load,
          storeOp: GPUStoreOpType.Store,
        });
      }

      const depthTextureData = this.get(renderContext.depthTexture);

      const depthStencilAttachment = {
        view: depthTextureData.texture.createView(),
      };

      descriptor = {
        colorAttachments,
        depthStencilAttachment,
      };

      descriptors[renderContext.activeCubeFace] = descriptor;

      renderTargetData.width = renderTarget.width;
      renderTargetData.height = renderTarget.height;
      renderTargetData.samples = renderTarget.samples;
      renderTargetData.activeMipmapLevel = renderTarget.activeMipmapLevel;
    }

    return descriptor;
  }

  beginRender(renderContext: RenderContext) {
    const renderContextData = this.get(renderContext);

    const device = this.device;
    const occlusionQueryCount = renderContext.occlusionQueryCount;

    let occlusionQuerySet;

    if (occlusionQueryCount > 0) {
      if (renderContextData.currentOcclusionQuerySet) renderContextData.currentOcclusionQuerySet.destroy();
      if (renderContextData.currentOcclusionQueryBuffer) renderContextData.currentOcclusionQueryBuffer.destroy();

      // Get a reference to the array of objects with queries. The renderContextData property
      // can be changed by another render pass before the buffer.mapAsyc() completes.
      renderContextData.currentOcclusionQuerySet = renderContextData.occlusionQuerySet;
      renderContextData.currentOcclusionQueryBuffer = renderContextData.occlusionQueryBuffer;
      renderContextData.currentOcclusionQueryObjects = renderContextData.occlusionQueryObjects;

      //

      occlusionQuerySet = device.createQuerySet({ type: 'occlusion', count: occlusionQueryCount });

      renderContextData.occlusionQuerySet = occlusionQuerySet;
      renderContextData.occlusionQueryIndex = 0;
      renderContextData.occlusionQueryObjects = new Array(occlusionQueryCount);

      renderContextData.lastOcclusionObject = null;
    }

    let descriptor;

    if (renderContext.textures === null) {
      descriptor = this._getDefaultRenderPassDescriptor();
    } else {
      descriptor = this._getRenderPassDescriptor(renderContext);
    }

    this.initTimestampQuery(renderContext, descriptor);

    descriptor.occlusionQuerySet = occlusionQuerySet;

    const depthStencilAttachment = descriptor.depthStencilAttachment;

    if (renderContext.textures !== null) {
      const colorAttachments = descriptor.colorAttachments;

      for (let i = 0; i < colorAttachments.length; i++) {
        const colorAttachment = colorAttachments[i];

        if (renderContext.clearColor) {
          colorAttachment.clearValue = renderContext.clearColorValue;
          colorAttachment.loadOp = GPULoadOpType.Clear;
          colorAttachment.storeOp = GPUStoreOpType.Store;
        } else {
          colorAttachment.loadOp = GPULoadOpType.Load;
          colorAttachment.storeOp = GPUStoreOpType.Store;
        }
      }
    } else {
      const colorAttachment = descriptor.colorAttachments[0];

      if (renderContext.clearColor) {
        colorAttachment.clearValue = renderContext.clearColorValue;
        colorAttachment.loadOp = GPULoadOpType.Clear;
        colorAttachment.storeOp = GPUStoreOpType.Store;
      } else {
        colorAttachment.loadOp = GPULoadOpType.Load;
        colorAttachment.storeOp = GPUStoreOpType.Store;
      }
    }

    //

    if (renderContext.depth) {
      if (renderContext.clearDepth) {
        depthStencilAttachment.depthClearValue = renderContext.clearDepthValue;
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Clear;
        depthStencilAttachment.depthStoreOp = GPUStoreOpType.Store;
      } else {
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Load;
        depthStencilAttachment.depthStoreOp = GPUStoreOpType.Store;
      }
    }

    if (renderContext.stencil) {
      if (renderContext.clearStencil) {
        depthStencilAttachment.stencilClearValue = renderContext.clearStencilValue;
        depthStencilAttachment.stencilLoadOp = GPULoadOpType.Clear;
        depthStencilAttachment.stencilStoreOp = GPUStoreOpType.Store;
      } else {
        depthStencilAttachment.stencilLoadOp = GPULoadOpType.Load;
        depthStencilAttachment.stencilStoreOp = GPUStoreOpType.Store;
      }
    }

    //

    const encoder = device.createCommandEncoder({ label: 'renderContext_' + renderContext.id });
    const currentPass = encoder.beginRenderPass(descriptor);

    //

    renderContextData.descriptor = descriptor;
    renderContextData.encoder = encoder;
    renderContextData.currentPass = currentPass;
    renderContextData.currentSets = { attributes: {} };

    //

    if (renderContext.viewport) {
      this.updateViewport(renderContext);
    }

    if (renderContext.scissor) {
      const { x, y, width, height } = renderContext.scissorValue;

      currentPass.setScissorRect(x, renderContext.height - height - y, width, height);
    }
  }

  finishRender(renderContext: RenderContext) {
    const renderContextData = this.get(renderContext);
    const occlusionQueryCount = renderContext.occlusionQueryCount;

    if (occlusionQueryCount > renderContextData.occlusionQueryIndex) {
      renderContextData.currentPass.endOcclusionQuery();
    }

    renderContextData.currentPass.end();

    if (occlusionQueryCount > 0) {
      // 8 byte entries for query results
      const bufferSize = occlusionQueryCount * 8;

      //

      let queryResolveBuffer = this.resolveBufferMap.get(bufferSize);

      if (queryResolveBuffer === undefined) {
        queryResolveBuffer = this.device.createBuffer({
          size: bufferSize,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        });

        this.resolveBufferMap.set(bufferSize, queryResolveBuffer);
      }

      //

      const readBuffer = this.device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      // two buffers required here - WebGPU doesn't allow usage of QUERY_RESOLVE & MAP_READ to be combined
      renderContextData.encoder.resolveQuerySet(
        renderContextData.occlusionQuerySet,
        0,
        occlusionQueryCount,
        queryResolveBuffer,
        0,
      );
      renderContextData.encoder.copyBufferToBuffer(queryResolveBuffer, 0, readBuffer, 0, bufferSize);

      renderContextData.occlusionQueryBuffer = readBuffer;

      //

      this.resolveOccludedAsync(renderContext);
    }

    this.prepareTimestampBuffer(renderContext, renderContextData.encoder);

    this.device.queue.submit([renderContextData.encoder.finish()]);

    //

    if (renderContext.textures !== null) {
      const textures = renderContext.textures;

      for (let i = 0; i < textures.length; i++) {
        const texture = textures[i];

        if (texture.generateMipmaps === true) {
          this.textures.generateMipmaps(texture);
        }
      }
    }
  }

  isOccluded(renderContext: RenderContext, object: Object3D) {
    const renderContextData = this.get(renderContext);

    return renderContextData.occluded && renderContextData.occluded.has(object);
  }

  async resolveOccludedAsync(renderContext: RenderContext) {
    const renderContextData = this.get(renderContext);

    // handle occlusion query results

    const { currentOcclusionQueryBuffer, currentOcclusionQueryObjects } = renderContextData;

    if (currentOcclusionQueryBuffer && currentOcclusionQueryObjects) {
      const occluded = new WeakSet();

      renderContextData.currentOcclusionQueryObjects = null;
      renderContextData.currentOcclusionQueryBuffer = null;

      await currentOcclusionQueryBuffer.mapAsync(GPUMapMode.READ);

      const buffer = currentOcclusionQueryBuffer.getMappedRange();
      const results = new BigUint64Array(buffer);

      for (let i = 0; i < currentOcclusionQueryObjects.length; i++) {
        if (results[i] !== 0n) {
          occluded.add(currentOcclusionQueryObjects[i]);
        }
      }

      currentOcclusionQueryBuffer.destroy();

      renderContextData.occluded = occluded;
    }
  }

  updateViewport(renderContext: RenderContext) {
    const { currentPass } = this.get(renderContext);
    const { x, y, width, height, minDepth, maxDepth } = renderContext.viewportValue;

    currentPass.setViewport(x, renderContext.height - height - y, width, height, minDepth, maxDepth);
  }

  clear(color: boolean, depth: boolean, stencil: boolean, renderTargetData: RenderTarget | null = null) {
    const device = this.device;
    const renderer = this.renderer;

    let colorAttachments = [];

    let depthStencilAttachment;
    let clearValue;

    let supportsDepth;
    let supportsStencil;

    if (color) {
      const clearColor = this.getClearColor();

      clearValue = { r: clearColor.r, g: clearColor.g, b: clearColor.b, a: clearColor.a };
    }

    if (renderTargetData === null) {
      supportsDepth = renderer.parameters.depth;
      supportsStencil = renderer.parameters.stencil;

      const descriptor = this._getDefaultRenderPassDescriptor();

      if (color) {
        colorAttachments = descriptor.colorAttachments;

        const colorAttachment = colorAttachments[0];

        colorAttachment.clearValue = clearValue;
        colorAttachment.loadOp = GPULoadOpType.Clear;
        colorAttachment.storeOp = GPUStoreOpType.Store;
      }

      if (supportsDepth || supportsStencil) {
        depthStencilAttachment = descriptor.depthStencilAttachment;
      }
    } else {
      supportsDepth = renderTargetData.depth;
      supportsStencil = renderTargetData.stencil;

      if (color) {
        for (const texture of renderTargetData.textures) {
          const textureData = this.get(texture);
          const textureView = textureData.texture.createView();

          let view, resolveTarget;

          if (textureData.msaaTexture !== undefined) {
            view = textureData.msaaTexture.createView();
            resolveTarget = textureView;
          } else {
            view = textureView;
            resolveTarget = undefined;
          }

          colorAttachments.push({
            view,
            resolveTarget,
            clearValue,
            loadOp: GPULoadOpType.Clear,
            storeOp: GPUStoreOpType.Store,
          });
        }
      }

      if (supportsDepth || supportsStencil) {
        const depthTextureData = this.get(renderTargetData.depthTexture);

        depthStencilAttachment = {
          view: depthTextureData.texture.createView(),
        };
      }
    }

    //

    if (supportsDepth) {
      if (depth) {
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Clear;
        depthStencilAttachment.depthClearValue = renderer.getClearDepth();
        depthStencilAttachment.depthStoreOp = GPUStoreOpType.Store;
      } else {
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Load;
        depthStencilAttachment.depthStoreOp = GPUStoreOpType.Store;
      }
    }

    //

    if (supportsStencil) {
      if (stencil) {
        depthStencilAttachment.stencilLoadOp = GPULoadOpType.Clear;
        depthStencilAttachment.stencilClearValue = renderer.getClearStencil();
        depthStencilAttachment.stencilStoreOp = GPUStoreOpType.Store;
      } else {
        depthStencilAttachment.stencilLoadOp = GPULoadOpType.Load;
        depthStencilAttachment.stencilStoreOp = GPUStoreOpType.Store;
      }
    }

    //

    const encoder = device.createCommandEncoder({});
    const currentPass = encoder.beginRenderPass({
      colorAttachments,
      depthStencilAttachment,
    });

    currentPass.end();

    device.queue.submit([encoder.finish()]);
  }

  // compute

  beginCompute(computeGroup: ComputeNode) {
    const groupGPU = this.get(computeGroup);

    const descriptor = {};

    this.initTimestampQuery(computeGroup, descriptor);

    groupGPU.cmdEncoderGPU = this.device.createCommandEncoder();

    groupGPU.passEncoderGPU = groupGPU.cmdEncoderGPU.beginComputePass(descriptor);
  }

  compute(computeGroup: ComputeNode, computeNode: ComputeNode, bindings: Binding[], pipeline: ComputePipeline) {
    const { passEncoderGPU } = this.get(computeGroup);

    // pipeline

    const pipelineGPU = this.get(pipeline).pipeline;
    passEncoderGPU.setPipeline(pipelineGPU);

    // bind group

    const bindGroupGPU = this.get(bindings).group;
    passEncoderGPU.setBindGroup(0, bindGroupGPU);

    passEncoderGPU.dispatchWorkgroups(computeNode.dispatchCount);
  }

  finishCompute(computeGroup: ComputeNode) {
    const groupData = this.get(computeGroup);

    groupData.passEncoderGPU.end();

    this.prepareTimestampBuffer(computeGroup, groupData.cmdEncoderGPU);

    this.device.queue.submit([groupData.cmdEncoderGPU.finish()]);
  }

  // render object

  draw(renderObject: RenderObject, info: Info) {
    const { object, geometry, context, pipeline } = renderObject;

    const bindingsData = this.get(renderObject.getBindings());
    const contextData = this.get(context);
    const pipelineGPU = this.get(pipeline).pipeline;
    const currentSets = contextData.currentSets;

    // pipeline

    const passEncoderGPU = contextData.currentPass;

    if (currentSets.pipeline !== pipelineGPU) {
      passEncoderGPU.setPipeline(pipelineGPU);

      currentSets.pipeline = pipelineGPU;
    }

    // bind group

    const bindGroupGPU = bindingsData.group;
    passEncoderGPU.setBindGroup(0, bindGroupGPU);

    // attributes

    const index = renderObject.getIndex();

    const hasIndex = index !== null;

    // index

    if (hasIndex === true) {
      if (currentSets.index !== index) {
        const buffer = this.get(index).buffer;
        const indexFormat = index.array instanceof Uint16Array ? GPUIndexFormatType.Uint16 : GPUIndexFormatType.Uint32;

        passEncoderGPU.setIndexBuffer(buffer, indexFormat);

        currentSets.index = index;
      }
    }

    // vertex buffers

    const vertexBuffers = renderObject.getVertexBuffers();

    for (let i = 0, l = vertexBuffers.length; i < l; i++) {
      const vertexBuffer = vertexBuffers[i];

      if (currentSets.attributes[i] !== vertexBuffer) {
        const buffer = this.get(vertexBuffer).buffer;
        passEncoderGPU.setVertexBuffer(i, buffer);

        currentSets.attributes[i] = vertexBuffer;
      }
    }

    // occlusion queries - handle multiple consecutive draw calls for an object

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

    // draw

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

  // cache key

  needsRenderUpdate(renderObject: RenderObject) {
    const data = this.get(renderObject);

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

  getRenderCacheKey(renderObject: RenderObject) {
    const { object, material } = renderObject;

    const utils = this.utilities;
    const renderContext = renderObject.context;

    return [
      material.transparent,
      material.blending,
      material.premultipliedAlpha,
      material.blendSrc,
      material.blendDst,
      material.blendEquation,
      material.blendSrcAlpha,
      material.blendDstAlpha,
      material.blendEquationAlpha,
      material.colorWrite,
      material.depthWrite,
      material.depthTest,
      material.depthFunc,
      material.stencilWrite,
      material.stencilFunc,
      material.stencilFail,
      material.stencilZFail,
      material.stencilZPass,
      material.stencilFuncMask,
      material.stencilWriteMask,
      material.side,
      utils.getSampleCount(renderContext),
      utils.getCurrentColorSpace(renderContext),
      utils.getCurrentColorFormat(renderContext),
      utils.getCurrentDepthStencilFormat(renderContext),
      utils.getPrimitiveTopology(object, material),
      renderObject.clippingContextVersion,
    ].join();
  }

  // textures

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
    this.textures.updateTexture(texture, options);
  }

  generateMipmaps(texture: Texture) {
    this.textures.generateMipmaps(texture);
  }

  destroyTexture(texture: Texture) {
    this.textures.destroyTexture(texture);
  }

  copyTextureToBuffer(texture: Texture, x: number, y: number, width: number, height: number) {
    return this.textures.copyTextureToBuffer(texture, x, y, width, height);
  }

  initTimestampQuery(renderContext: RenderContext, descriptor) {
    if (!this.hasFeature(GPUFeatureNameType.TimestampQuery) || !this.renderer.parameters.trackTimestamp) return;

    const renderContextData = this.get(renderContext);

    if (!renderContextData.timeStampQuerySet) {
      // Create a GPUQuerySet which holds 2 timestamp query results: one for the
      // beginning and one for the end of compute pass execution.
      const timeStampQuerySet = this.device.createQuerySet({ type: 'timestamp', count: 2 });

      const timestampWrites = {
        querySet: timeStampQuerySet,
        beginningOfPassWriteIndex: 0, // Write timestamp in index 0 when pass begins.
        endOfPassWriteIndex: 1, // Write timestamp in index 1 when pass ends.
      };

      Object.assign(descriptor, {
        timestampWrites,
      });

      renderContextData.timeStampQuerySet = timeStampQuerySet;
    }
  }

  // timestamp utils

  prepareTimestampBuffer(renderContext: RenderContext, encoder) {
    if (!this.hasFeature(GPUFeatureNameType.TimestampQuery) || !this.renderer.parameters.trackTimestamp) return;

    const renderContextData = this.get(renderContext);

    const size = 2 * BigInt64Array.BYTES_PER_ELEMENT;
    const resolveBuffer = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
    });

    const resultBuffer = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    encoder.resolveQuerySet(renderContextData.timeStampQuerySet, 0, 2, resolveBuffer, 0);
    encoder.copyBufferToBuffer(resolveBuffer, 0, resultBuffer, 0, size);

    renderContextData.currentTimestampQueryBuffer = resultBuffer;
  }

  async resolveTimestampAsync(renderContext: RenderContext, type: 'render' | 'compute' = 'render') {
    if (!this.hasFeature(GPUFeatureNameType.TimestampQuery) || !this.renderer.parameters.trackTimestamp) return;

    const renderContextData = this.get(renderContext);
    const { currentTimestampQueryBuffer } = renderContextData;

    if (currentTimestampQueryBuffer === undefined) return;

    const buffer = currentTimestampQueryBuffer;

    try {
      await buffer.mapAsync(GPUMapMode.READ);
      const times = new BigUint64Array(buffer.getMappedRange());
      const duration = Number(times[1] - times[0]) / 1000000;
      this.renderer.info.updateTimestamp(type, duration);
    } catch (error) {
      console.error(`Error mapping buffer: ${error}`);
      // Optionally handle the error, e.g., re-queue the buffer or skip it
    } finally {
      buffer.unmap();
    }
  }

  // node builder

  createNodeBuilder(object: Object3D, renderer: Renderer, scene: Scene | null = null) {
    return new NodeBuilder(object, renderer, scene);
  }

  // program

  createProgram(program: ProgrammableStage) {
    const programGPU = this.get(program);

    programGPU.module = {
      module: this.device.createShaderModule({ code: program.code, label: program.stage }),
      entryPoint: 'main',
    };
  }

  destroyProgram(program: ProgrammableStage) {
    this.delete(program);
  }

  // pipelines

  createRenderPipeline(renderObject: RenderObject, promises: Promise<void>[] | null = null) {
    this.pipelines.createRenderPipeline(renderObject, promises);
  }

  createComputePipeline(computePipeline: ComputePipeline, bindings: Binding[]) {
    this.pipelines.createComputePipeline(computePipeline, bindings);
  }

  // bindings

  createBindings(bindings: Binding[]) {
    this.bindings.createBindings(bindings);
  }

  updateBindings(bindings: Binding[]) {
    this.bindings.createBindings(bindings);
  }

  updateBinding(binding: Binding) {
    this.bindings.updateBinding(binding);
  }

  // attributes

  createIndexAttribute(attribute: BufferAttribute<any>) {
    this.attributes.createAttribute(
      attribute,
      GPUBufferUsage.INDEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    );
  }

  createAttribute(attribute: BufferAttribute<any>) {
    this.attributes.createAttribute(
      attribute,
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    );
  }

  createStorageAttribute(attribute: BufferAttribute<any>) {
    this.attributes.createAttribute(
      attribute,
      GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    );
  }

  updateAttribute(attribute: BufferAttribute<any>) {
    this.attributes.updateAttribute(attribute);
  }

  destroyAttribute(attribute: BufferAttribute<any>) {
    this.attributes.destroyAttribute(attribute);
  }

  // canvas

  updateSize() {
    this.colorBuffer = this.textures.getColorBuffer();
    this.renderPassDescriptor = null;
  }

  // utils public

  getMaxAnisotropy() {
    return 16;
  }

  hasFeature(name: string) {
    return this.adapter.features.has(name);
  }

  copyTextureToTexture(position: Vec3, srcTexture: Texture, dstTexture: Texture, level: number = 0) {
    const encoder = this.device.createCommandEncoder({
      label: 'copyTextureToTexture_' + srcTexture.id + '_' + dstTexture.id,
    });

    const sourceGPU = this.get(srcTexture).texture;
    const destinationGPU = this.get(dstTexture).texture;

    encoder.copyTextureToTexture(
      {
        texture: sourceGPU,
        mipLevel: level,
        origin: { x: 0, y: 0, z: 0 },
      },
      {
        texture: destinationGPU,
        mipLevel: level,
        origin: { x: position.x, y: position.y, z: position.z },
      },
      [srcTexture.image.width, srcTexture.image.height],
    );

    this.device.queue.submit([encoder.finish()]);
  }

  copyFramebufferToTexture(texture: Texture, renderContext: RenderContext) {
    const renderContextData = this.get(renderContext);

    const { encoder, descriptor } = renderContextData;

    let sourceGPU = null;

    if (renderContext.renderTarget) {
      if (texture.isDepthTexture) {
        sourceGPU = this.get(renderContext.depthTexture).texture;
      } else {
        sourceGPU = this.get(renderContext.textures[0]).texture;
      }
    } else {
      if (texture.isDepthTexture) {
        sourceGPU = this.textures.getDepthBuffer(renderContext.depth, renderContext.stencil);
      } else {
        sourceGPU = this.renderer.parameters.context.getCurrentTexture();
      }
    }

    const destinationGPU = this.get(texture).texture;

    if (sourceGPU.format !== destinationGPU.format) {
      console.error(
        'WebGPUBackend: copyFramebufferToTexture: Source and destination formats do not match.',
        sourceGPU.format,
        destinationGPU.format,
      );

      return;
    }

    renderContextData.currentPass.end();

    encoder.copyTextureToTexture(
      {
        texture: sourceGPU,
        origin: { x: 0, y: 0, z: 0 },
      },
      {
        texture: destinationGPU,
      },
      [texture.image.width, texture.image.height],
    );

    if (texture.generateMipmaps) this.textures.generateMipmaps(texture);

    descriptor.colorAttachments[0].loadOp = GPULoadOpType.Load;
    if (renderContext.depth) descriptor.depthStencilAttachment.depthLoadOp = GPULoadOpType.Load;
    if (renderContext.stencil) descriptor.depthStencilAttachment.stencilLoadOp = GPULoadOpType.Load;

    renderContextData.currentPass = encoder.beginRenderPass(descriptor);
    renderContextData.currentSets = { attributes: {} };
  }
}
