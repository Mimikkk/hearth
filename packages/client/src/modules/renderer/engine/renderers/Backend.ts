import { Attribute, Color, Entity, RenderTarget, Scene, Texture } from '../engine.js';

import {
  GPUFeature,
  GPUIndexFormatType,
  GPULoadOpType,
  GPUStoreOpType,
  GPUTextureViewDimensionType,
} from './constants.js';

import { BackendUtilities } from './Backend.utilities.js';
import { BackendAttributes } from './Backend.attributes.js';
import { BackendBindings } from './bindings/Backend.bindings.js';
import BackendPipelines from './Backend.pipelines.js';
import { BackendTextures } from './Backend.textures.js';
import type { Forge } from '@modules/renderer/engine/renderers/Forge.js';
import RenderContext from '@modules/renderer/engine/renderers/core/RenderContext.js';
import ComputeNode from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';
import ComputePipeline from '@modules/renderer/engine/renderers/ComputePipeline.js';
import Binding from '@modules/renderer/engine/renderers/bindings/Binding.js';
import RenderObject from '@modules/renderer/engine/renderers/RenderObject.js';
import ProgrammableStage from '@modules/renderer/engine/renderers/ProgrammableStage.js';
import { BackendResourceManager } from './Backend.ResourceManager.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { WeakMemo } from '@modules/renderer/engine/renderers/WeakMemo.js';

export class Backend {
  renderer: Forge;
  memo: WeakMemo<any, any> = new WeakMemo(() => ({}));

  getInstanceCount({ object, geometry }: RenderObject) {
    return Math.max(geometry.instanceCount, object.count, 1);
  }

  getClearColor() {
    const renderer = this.renderer;

    const color = Color.new();

    color.from(renderer._clearColor);

    color.getRGB(color, this.renderer.currentColorSpace);

    return color;
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
  resources: BackendResourceManager;

  constructor(renderer: Forge) {
    this.renderer = renderer;

    this.adapter = null!;
    this.device = null!;
    this.colorBuffer = null;
    this.renderPassDescriptor = null;

    this.resources = new BackendResourceManager(this);
    this.utilities = new BackendUtilities(this);
    this.attributes = new BackendAttributes(this);
    this.bindings = new BackendBindings(this);
    this.pipelines = new BackendPipelines(this);
    this.textures = new BackendTextures(this);
    this.resolveBufferMap = new Map();
  }

  async getArrayBuffer(attribute: Attribute) {
    return await this.attributes.read(attribute);
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
          view: this.textures.getDepthBuffer(renderer.parameters.useDepth, renderer.parameters.useStencil).createView(),
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
    const renderTargetData = this.memo.get(renderTarget);

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
        const textureData = this.memo.get(textures[i]);

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

      const depthTextureData = this.memo.get(renderContext.depthTexture);

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
    const renderContextData = this.memo.get(renderContext);

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

    this.initTimestampBuffer(renderContext, descriptor);

    descriptor.occlusionQuerySet = occlusionQuerySet;

    const depthStencilAttachment = descriptor.depthStencilAttachment;

    if (renderContext.textures !== null) {
      const colorAttachments = descriptor.colorAttachments;

      for (let i = 0; i < colorAttachments.length; i++) {
        const colorAttachment = colorAttachments[i];

        if (renderContext.useClearColor) {
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

      if (renderContext.useClearColor) {
        colorAttachment.clearValue = renderContext.clearColorValue;
        colorAttachment.loadOp = GPULoadOpType.Clear;
        colorAttachment.storeOp = GPUStoreOpType.Store;
      } else {
        colorAttachment.loadOp = GPULoadOpType.Load;
        colorAttachment.storeOp = GPUStoreOpType.Store;
      }
    }

    //

    if (renderContext.useDepth) {
      if (renderContext.useClearDepth) {
        depthStencilAttachment.depthClearValue = renderContext.clearDepthValue;
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Clear;
        depthStencilAttachment.depthStoreOp = GPUStoreOpType.Store;
      } else {
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Load;
        depthStencilAttachment.depthStoreOp = GPUStoreOpType.Store;
      }
    }

    if (renderContext.useStencil) {
      if (renderContext.useClearStencil) {
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

    if (renderContext.useViewport) {
      this.updateViewport(renderContext);
    }

    if (renderContext.useScissor) {
      const { x, y, width, height } = renderContext.scissorValue;

      currentPass.setScissorRect(x, renderContext.height - height - y, width, height);
    }
  }

  finishRender(renderContext: RenderContext) {
    const renderContextData = this.memo.get(renderContext);
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

    this.prepareTimestamp(renderContext, renderContextData.encoder);

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

  isOccluded(renderContext: RenderContext, object: Entity) {
    const renderContextData = this.memo.get(renderContext);

    return renderContextData.occluded && renderContextData.occluded.has(object);
  }

  async resolveOccludedAsync(renderContext: RenderContext) {
    const renderContextData = this.memo.get(renderContext);

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
    const { currentPass } = this.memo.get(renderContext);
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
      supportsDepth = renderer.parameters.useDepth;
      supportsStencil = renderer.parameters.useStencil;

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
          const textureData = this.memo.get(texture);
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
        const depthTextureData = this.memo.get(renderTargetData.depthTexture);

        depthStencilAttachment = {
          view: depthTextureData.texture.createView(),
        };
      }
    }

    //

    if (supportsDepth) {
      if (depth) {
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Clear;
        depthStencilAttachment.depthClearValue = renderer._clearDepth;
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
        depthStencilAttachment.stencilClearValue = renderer._clearStencil;
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

  beginCompute(computeGroup: ComputeNode) {
    const groupGPU = this.memo.get(computeGroup);

    const descriptor = {};

    this.initTimestampBuffer(computeGroup, descriptor);

    groupGPU.cmdEncoderGPU = this.device.createCommandEncoder();

    groupGPU.passEncoderGPU = groupGPU.cmdEncoderGPU.beginComputePass(descriptor);
  }

  compute(computeGroup: ComputeNode, computeNode: ComputeNode, bindings: Binding[], pipeline: ComputePipeline) {
    const { passEncoderGPU } = this.memo.get(computeGroup);

    // pipeline

    const pipelineGPU = this.memo.get(pipeline).pipeline;
    passEncoderGPU.setPipeline(pipelineGPU);

    // bind group

    const bindGroupGPU = this.memo.get(bindings).group;
    passEncoderGPU.setBindGroup(0, bindGroupGPU);

    passEncoderGPU.dispatchWorkgroups(computeNode.dispatchCount);
  }

  finishCompute(computeGroup: ComputeNode) {
    const groupData = this.memo.get(computeGroup);

    groupData.passEncoderGPU.end();

    this.prepareTimestamp(computeGroup, groupData.cmdEncoderGPU);

    this.device.queue.submit([groupData.cmdEncoderGPU.finish()]);
  }

  draw(renderObject: RenderObject) {
    const info = this.renderer.info;
    const { object, geometry, context, pipeline } = renderObject;

    const bindingsData = this.memo.get(renderObject.getBindings());
    const contextData = this.memo.get(context);
    const pipelineGPU = this.memo.get(pipeline).pipeline;
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
        const buffer = this.memo.get(index).buffer;
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
        const buffer = this.memo.get(vertexBuffer).buffer;
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

  initTimestampBuffer(context: RenderContext, descriptor: GPURenderPassDescriptor): void {
    if (!this.hasFeature(GPUFeature.TimestampQuery) || !this.renderer.parameters.useTimestamp) return;

    const data = this.memo.get(context);
    if (data.timeStampQuerySet) return;

    const timeStampQuerySet = this.device.createQuerySet({ type: 'timestamp', count: 2 });
    descriptor.timestampWrites = {
      querySet: timeStampQuerySet,
      // Write timestamp in index 0 when pass begins.
      beginningOfPassWriteIndex: 0,
      // Write timestamp in index 1 when pass ends.
      endOfPassWriteIndex: 1,
    };

    data.timeStampQuerySet = timeStampQuerySet;
  }

  prepareTimestamp(context: RenderContext, encoder: GPUCommandEncoder) {
    if (!this.hasFeature(GPUFeature.TimestampQuery) || !this.renderer.parameters.useTimestamp) return;

    const data = this.memo.get(context);

    const size = 2 * BigInt64Array.BYTES_PER_ELEMENT;

    if (data.currentTimestampQueryBuffers === undefined) {
      data.currentTimestampQueryBuffers = {
        resolveBuffer: this.device.createBuffer({
          label: 'timestamp resolve buffer',
          size: size,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        }),
        resultBuffer: this.device.createBuffer({
          label: 'timestamp result buffer',
          size: size,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        }),
        isMappingPending: false,
      };
    }

    const { resolveBuffer, resultBuffer, isMappingPending } = data.currentTimestampQueryBuffers;

    if (isMappingPending === true) return;

    encoder.resolveQuerySet(data.timeStampQuerySet, 0, 2, resolveBuffer, 0);
    encoder.copyBufferToBuffer(resolveBuffer, 0, resultBuffer, 0, size);
  }

  async resolveTimestamp(context: RenderContext, type: 'render' | 'compute') {
    if (!this.hasFeature(GPUFeature.TimestampQuery) || !this.renderer.parameters.useTimestamp) return;

    const data = this.memo.get(context);

    if (data.currentTimestampQueryBuffers === undefined) return;

    const { resultBuffer, isMappingPending } = data.currentTimestampQueryBuffers;
    if (isMappingPending === true) return;

    data.currentTimestampQueryBuffers.isMappingPending = true;

    await resultBuffer.mapAsync(GPUMapMode.READ);
    const times = new BigUint64Array(resultBuffer.getMappedRange());
    const duration = Number(times[1] - times[0]) / 1000000;

    this.renderer.info.stamp(type, duration);
    resultBuffer.unmap();
    data.currentTimestampQueryBuffers.isMappingPending = false;
  }

  createNodeBuilder(object: Entity, renderer: Forge, scene: Scene | null = null) {
    return new NodeBuilder(object, renderer, scene);
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
    this.bindings.update(binding);
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
    this.attributes.update(attribute);
  }

  destroyAttribute(attribute: Attribute) {
    this.attributes.delete(attribute);
  }

  updateSize() {
    this.colorBuffer = this.textures.getColorBuffer();
    this.renderPassDescriptor = null;
  }

  getMaxAnisotropy() {
    return 16;
  }

  hasFeature(name: string) {
    return this.adapter.features.has(name);
  }

  patchTextureAt(texture: Texture, patch: Texture, at: { x: number; y: number; z?: number; level?: number }) {
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
    const context = this.renderer.context!;
    const data = this.memo.get(context);

    const { encoder, descriptor } = data;

    let sourceGPU = null;

    if (context.renderTarget) {
      if (into.isDepthTexture) {
        sourceGPU = this.memo.get(context.depthTexture).texture;
      } else {
        sourceGPU = this.memo.get(context.textures[0]).texture;
      }
    } else {
      if (into.isDepthTexture) {
        sourceGPU = this.textures.getDepthBuffer(context.useDepth, context.useStencil);
      } else {
        sourceGPU = this.renderer.parameters.context.getCurrentTexture();
      }
    }

    const destinationGPU = this.memo.get(into).texture;

    if (sourceGPU.format !== destinationGPU.format) {
      console.error(
        'WebGPUBackend: readFramebuffer: Source and destination formats do not match.',
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
}
