import { GPUIndexFormatType, GPULoadOpType, GPUStoreOpType } from './constants.js';
import type { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import RenderContext from '@modules/renderer/engine/hearth/core/RenderContext.js';
import ComputeNode from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';
import ComputePipeline from '@modules/renderer/engine/hearth/core/ComputePipeline.js';
import Binding from '@modules/renderer/engine/hearth/bindings/Binding.js';
import RenderObject from '@modules/renderer/engine/hearth/core/RenderObject.js';

export class Backend {
  constructor(public hearth: Hearth) {}

  beginRender(renderContext: RenderContext) {
    const renderContextData = this.hearth.memo.get(renderContext);

    const device = this.hearth.device;
    const occlusionQueryCount = renderContext.occlusionQueryCount;

    let occlusionQuerySet;

    if (occlusionQueryCount > 0) {
      if (renderContextData.currentOcclusionQuerySet) renderContextData.currentOcclusionQuerySet.destroy();
      if (renderContextData.currentOcclusionQueryBuffer) renderContextData.currentOcclusionQueryBuffer.destroy();

      renderContextData.currentOcclusionQuerySet = renderContextData.occlusionQuerySet;
      renderContextData.currentOcclusionQueryBuffer = renderContextData.occlusionQueryBuffer;
      renderContextData.currentOcclusionQueryObjects = renderContextData.occlusionQueryObjects;

      occlusionQuerySet = device.createQuerySet({ type: 'occlusion', count: occlusionQueryCount });

      renderContextData.occlusionQuerySet = occlusionQuerySet;
      renderContextData.occlusionQueryIndex = 0;
      renderContextData.occlusionQueryObjects = new Array(occlusionQueryCount);

      renderContextData.lastOcclusionObject = null;
    }

    let descriptor;

    if (renderContext.textures === null) {
      descriptor = this.hearth._getDefaultRenderPassDescriptor();
    } else {
      descriptor = this.hearth._getRenderPassDescriptor(renderContext);
    }

    this.hearth.initTimestampBuffer(renderContext, descriptor);

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

    const encoder = device.createCommandEncoder({ label: 'renderContext_' + renderContext.id });
    const currentPass = encoder.beginRenderPass(descriptor);

    renderContextData.descriptor = descriptor;
    renderContextData.encoder = encoder;
    renderContextData.currentPass = currentPass;
    renderContextData.currentSets = { attributes: {} };

    if (renderContext.useViewport) {
      this.hearth.updateViewport(renderContext);
    }

    if (renderContext.useScissor) {
      const { x, y, width, height } = renderContext.scissorValue;

      currentPass.setScissorRect(x, renderContext.height - height - y, width, height);
    }
  }

  async finishRender(renderContext: RenderContext) {
    const renderContextData = this.hearth.memo.get(renderContext);
    const occlusionQueryCount = renderContext.occlusionQueryCount;

    if (occlusionQueryCount > renderContextData.occlusionQueryIndex) {
      renderContextData.currentPass.endOcclusionQuery();
    }

    renderContextData.currentPass.end();

    if (occlusionQueryCount > 0) {
      const bufferSize = occlusionQueryCount * 8;

      let queryResolveBuffer = this.hearth.resolveBufferMap.get(bufferSize);

      if (queryResolveBuffer === undefined) {
        queryResolveBuffer = this.hearth.device.createBuffer({
          size: bufferSize,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        });

        this.hearth.resolveBufferMap.set(bufferSize, queryResolveBuffer);
      }

      const readBuffer = this.hearth.device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      renderContextData.encoder.resolveQuerySet(
        renderContextData.occlusionQuerySet,
        0,
        occlusionQueryCount,
        queryResolveBuffer,
        0,
      );
      renderContextData.encoder.copyBufferToBuffer(queryResolveBuffer, 0, readBuffer, 0, bufferSize);

      renderContextData.occlusionQueryBuffer = readBuffer;

      await this.hearth.resolveOccludedAsync(renderContext);
    }

    this.hearth.prepareTimestamp(renderContext, renderContextData.encoder);

    this.hearth.device.queue.submit([renderContextData.encoder.finish()]);

    if (renderContext.textures !== null) {
      const textures = renderContext.textures;

      for (let i = 0; i < textures.length; i++) {
        const texture = textures[i];

        if (texture.generateMipmaps === true) {
          this.hearth.textures.generateMipmaps(texture);
        }
      }
    }
  }

  beginCompute(computeGroup: ComputeNode) {
    const groupGPU = this.hearth.memo.get(computeGroup);

    const descriptor = {};

    this.hearth.initTimestampBuffer(computeGroup, descriptor);

    groupGPU.cmdEncoderGPU = this.hearth.device.createCommandEncoder();

    groupGPU.passEncoderGPU = groupGPU.cmdEncoderGPU.beginComputePass(descriptor);
  }

  compute(computeGroup: ComputeNode, computeNode: ComputeNode, bindings: Binding[], pipeline: ComputePipeline) {
    const { passEncoderGPU } = this.hearth.memo.get(computeGroup);

    const pipelineGPU = this.hearth.memo.get(pipeline).pipeline;
    passEncoderGPU.setPipeline(pipelineGPU);

    const bindGroupGPU = this.hearth.memo.get(bindings).group;
    passEncoderGPU.setBindGroup(0, bindGroupGPU);

    passEncoderGPU.dispatchWorkgroups(computeNode.dispatchCount);
  }

  finishCompute(computeGroup: ComputeNode) {
    const groupData = this.hearth.memo.get(computeGroup);

    groupData.passEncoderGPU.end();

    this.hearth.prepareTimestamp(computeGroup, groupData.cmdEncoderGPU);

    this.hearth.device.queue.submit([groupData.cmdEncoderGPU.finish()]);
  }

  draw(renderObject: RenderObject) {
    const info = this.hearth.info;
    const { object, geometry, context, pipeline } = renderObject;

    const bindingsData = this.hearth.memo.get(renderObject.getBindings());
    const contextData = this.hearth.memo.get(context);
    const pipelineGPU = this.hearth.memo.get(pipeline).pipeline;
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
        const buffer = this.hearth.memo.get(index).buffer;
        const indexFormat = index.array instanceof Uint16Array ? GPUIndexFormatType.Uint16 : GPUIndexFormatType.Uint32;

        passEncoderGPU.setIndexBuffer(buffer, indexFormat);

        currentSets.index = index;
      }
    }

    const vertexBuffers = renderObject.getVertexBuffers();

    for (let i = 0, l = vertexBuffers.length; i < l; i++) {
      const vertexBuffer = vertexBuffers[i];

      if (currentSets.attributes[i] !== vertexBuffer) {
        const buffer = this.hearth.memo.get(vertexBuffer).buffer;
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

    const instanceCount = this.hearth.getInstanceCount(renderObject);
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
