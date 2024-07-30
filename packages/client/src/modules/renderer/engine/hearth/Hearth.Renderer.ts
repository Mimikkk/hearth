import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { Camera } from '@modules/renderer/engine/entities/cameras/Camera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import ClippingContext from '@modules/renderer/engine/hearth/core/ClippingContext.js';
import RenderContext from './core/RenderContext.ts';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';
import { Frustum } from '@modules/renderer/engine/math/Frustum.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import {
  GPULoadOpType,
  GPUStoreOpType,
  GPUTextureViewDimensionType,
} from '@modules/renderer/engine/hearth/constants.js';
import RenderList from '@modules/renderer/engine/hearth/core/RenderList.js';
import { Color } from '@modules/renderer/engine/math/Color.js';

export class HearthRenderer extends HearthComponent {
  async run(scene: Entity, camera: Camera): Promise<RenderContext> {
    const nodeFrame = this.hearth.nodes.nodeFrame;
    const previousRenderId = nodeFrame.renderId;
    const previousRenderContext = this.hearth.context;
    const previousRenderObjectFunction = this.hearth._activeRenderObjectFn;
    const sceneRef = Scene.is(scene) ? scene : _scene;

    const target = this.hearth.target;
    const context = this.hearth.renderContexts.get(scene, camera, target);
    const activeCubeFace = this.hearth._activeCubeFace;
    const activeMipmapLevel = this.hearth._activeMipmapLevel;

    this.hearth.context = context;
    this.hearth._activeRenderObjectFn = this.hearth._renderObjectFn || this.hearth.renderObject;
    this.hearth.stats.passes++;
    this.hearth.stats.render.passes++;
    nodeFrame.renderId = this.hearth.stats.passes;

    if (scene.useWorldAutoUpdate) scene.updateMatrixWorld();
    if (camera.parent === null && camera.useWorldAutoUpdate) camera.updateMatrixWorld();

    let viewport = this.hearth.viewport;
    let scissor = this.hearth.scissor;
    let pixelRatio = this.hearth._pixelRatio;

    if (target) {
      viewport = target.viewport;
      scissor = target.scissor;
      pixelRatio = 1;
    }

    this.hearth.getDrawSize(_drawSize);

    _screen.set(0, 0, _drawSize.width, _drawSize.height);

    context.viewportValue.from(viewport).scale(pixelRatio).floor();
    context.viewportValue.width >>= activeMipmapLevel;
    context.viewportValue.height >>= activeMipmapLevel;
    context.viewportValue.minDepth = 0;
    context.viewportValue.maxDepth = 1;
    context.useUpdateViewport = this.hearth.useScissor && !context.viewportValue.equals(_screen);

    context.scissorValue.from(scissor).scale(pixelRatio).floor();
    context.scissorValue.width >>= activeMipmapLevel;
    context.scissorValue.height >>= activeMipmapLevel;
    context.useUpdateScissor = this.hearth.useScissor && !context.scissorValue.equals(_screen);

    if (!context.clippingContext) context.clippingContext = new ClippingContext();

    context.clippingContext.updateGlobal(this.hearth, camera);
    sceneRef.onBeforeRender(this.hearth, scene, camera, target);

    _projection.asMul(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.fromProjection(_projection);

    const renderList = this.hearth.renderLists.get(scene, camera);
    renderList.begin();

    this._projectObject(scene, camera, 0, renderList);

    renderList.finish();

    if (this.hearth.parameters.useSort) {
      renderList.sort(this.hearth.opaqueSort, this.hearth.transparentSort);
    }

    if (target) {
      this.hearth.textures.updateRenderTarget(target, activeMipmapLevel);

      const data = this.hearth.textures.get(target);
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
      context.width = this.hearth.parameters.canvas.width;
      context.height = this.hearth.parameters.canvas.height;
      context.useDepth = this.hearth.parameters.useDepth;
      context.useStencil = this.hearth.parameters.useStencil;
    }

    context.width >>= activeMipmapLevel;
    context.height >>= activeMipmapLevel;
    context.activeCubeFace = activeCubeFace;
    context.activeMipmapLevel = activeMipmapLevel;
    context.occlusionQueryCount = renderList.occlusionQueryCount;

    this.hearth.nodes.updateScene(sceneRef);
    this.hearth.background.update(sceneRef, renderList, context);

    const renderContextData = this.hearth.memo.get(context);

    const device = this.hearth.device;
    const occlusionQueryCount = context.occlusionQueryCount;

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

    if (context.textures === null) {
      descriptor = this._getDefaultRenderPassDescriptor();
    } else {
      descriptor = this._getRenderPassDescriptor(context);
    }

    this.hearth.timestamp.meter(context, descriptor);

    descriptor.occlusionQuerySet = occlusionQuerySet;

    const depthStencilAttachment = descriptor.depthStencilAttachment;

    if (context.textures !== null) {
      const colorAttachments = descriptor.colorAttachments;

      for (let i = 0; i < colorAttachments.length; i++) {
        const colorAttachment = colorAttachments[i];

        if (context.useClearColor) {
          colorAttachment.clearValue = context.clearColorValue;
          colorAttachment.loadOp = GPULoadOpType.Clear;
          colorAttachment.storeOp = GPUStoreOpType.Store;
        } else {
          colorAttachment.loadOp = GPULoadOpType.Load;
          colorAttachment.storeOp = GPUStoreOpType.Store;
        }
      }
    } else {
      const colorAttachment = descriptor.colorAttachments[0];

      if (context.useClearColor) {
        colorAttachment.clearValue = context.clearColorValue;
        colorAttachment.loadOp = GPULoadOpType.Clear;
        colorAttachment.storeOp = GPUStoreOpType.Store;
      } else {
        colorAttachment.loadOp = GPULoadOpType.Load;
        colorAttachment.storeOp = GPUStoreOpType.Store;
      }
    }

    if (context.useDepth) {
      if (context.useClearDepth) {
        depthStencilAttachment.depthClearValue = context.clearDepthValue;
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Clear;
        depthStencilAttachment.depthStoreOp = GPUStoreOpType.Store;
      } else {
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Load;
        depthStencilAttachment.depthStoreOp = GPUStoreOpType.Store;
      }
    }
    if (context.useStencil) {
      if (context.useClearStencil) {
        depthStencilAttachment.stencilClearValue = context.clearStencilValue;
        depthStencilAttachment.stencilLoadOp = GPULoadOpType.Clear;
        depthStencilAttachment.stencilStoreOp = GPUStoreOpType.Store;
      } else {
        depthStencilAttachment.stencilLoadOp = GPULoadOpType.Load;
        depthStencilAttachment.stencilStoreOp = GPUStoreOpType.Store;
      }
    }

    const encoder = device.createCommandEncoder({ label: 'renderContext_' + context.id });
    const currentPass = encoder.beginRenderPass(descriptor);

    renderContextData.descriptor = descriptor;
    renderContextData.encoder = encoder;
    renderContextData.currentPass = currentPass;
    renderContextData.currentSets = { attributes: {} };

    if (context.useUpdateViewport) {
      this.updateViewport(context);
    }
    if (context.useUpdateScissor) {
      const { x, y, width, height } = context.scissorValue;

      currentPass.setScissorRect(x, context.height - height - y, width, height);
    }

    const opaque = renderList.opaque;
    const transparent = renderList.transparent;
    const lightsNode = renderList.lightsNode;

    if (opaque.length > 0) this.hearth._renderObjects(opaque, camera, sceneRef, lightsNode);
    if (transparent.length > 0) this.hearth._renderObjects(transparent, camera, sceneRef, lightsNode);

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

      const { currentOcclusionQueryBuffer, currentOcclusionQueryObjects } = renderContextData;

      if (currentOcclusionQueryBuffer && currentOcclusionQueryObjects) {
        const occluded = new WeakSet();

        renderContextData.currentOcclusionQueryObjects = null;
        renderContextData.currentOcclusionQueryBuffer = null;

        await currentOcclusionQueryBuffer.mapAsync(GPUMapMode.READ);
        const buffer = currentOcclusionQueryBuffer.getMappedRange();
        const results = new BigUint64Array(buffer);

        for (let i = 0; i < currentOcclusionQueryObjects.length; i++) {
          if (results[i] !== 0n) occluded.add(currentOcclusionQueryObjects[i]);
        }

        currentOcclusionQueryBuffer.destroy();

        renderContextData.occluded = occluded;
      }
    }

    this.hearth.timestamp.encode(context, renderContextData.encoder);
    this.hearth.device.queue.submit([renderContextData.encoder.finish()]);

    if (context.textures) {
      for (const texture of context.textures) {
        if (!texture.generateMipmaps) continue;
        this.hearth.textures.generateMipmaps(texture);
      }
    }

    nodeFrame.renderId = previousRenderId;
    this.hearth.context = previousRenderContext;
    this.hearth._activeRenderObjectFn = previousRenderObjectFunction;

    sceneRef.onAfterRender(this.hearth, scene, camera, target);
    await this.hearth.timestamp.resolve(context, 'render');

    return context;
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

          if (this.hearth.parameters.useSort) {
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

  updateViewport(renderContext: RenderContext) {
    const { currentPass } = this.hearth.memo.get(renderContext);
    const { x, y, width, height, minDepth, maxDepth } = renderContext.viewportValue;

    currentPass.setViewport(x, renderContext.height - height - y, width, height, minDepth, maxDepth);
  }

  clear(color: boolean = true, depth: boolean = true, stencil: boolean = true) {
    const target = this.hearth.target;

    let renderTargetData = null;
    if (target) {
      this.hearth.textures.updateRenderTarget(target);

      renderTargetData = this.hearth.textures.get(target);
    }

    const device = this.hearth.device;
    const hearth = this.hearth;

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
      supportsDepth = hearth.parameters.useDepth;
      supportsStencil = hearth.parameters.useStencil;

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
          const textureData = this.hearth.memo.get(texture);
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
        const depthTextureData = this.hearth.memo.get(renderTargetData.depthTexture);

        depthStencilAttachment = {
          view: depthTextureData.texture.createView(),
        };
      }
    }

    if (supportsDepth) {
      if (depth) {
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Clear;
        depthStencilAttachment.depthClearValue = hearth._clearDepth;
        depthStencilAttachment.depthStoreOp = GPUStoreOpType.Store;
      } else {
        depthStencilAttachment.depthLoadOp = GPULoadOpType.Load;
        depthStencilAttachment.depthStoreOp = GPUStoreOpType.Store;
      }
    }

    if (supportsStencil) {
      if (stencil) {
        depthStencilAttachment.stencilLoadOp = GPULoadOpType.Clear;
        depthStencilAttachment.stencilClearValue = hearth._clearStencil;
        depthStencilAttachment.stencilStoreOp = GPUStoreOpType.Store;
      } else {
        depthStencilAttachment.stencilLoadOp = GPULoadOpType.Load;
        depthStencilAttachment.stencilStoreOp = GPUStoreOpType.Store;
      }
    }

    const encoder = device.createCommandEncoder({});
    const currentPass = encoder.beginRenderPass({
      colorAttachments,
      depthStencilAttachment,
    });

    currentPass.end();

    device.queue.submit([encoder.finish()]);
  }

  _getDefaultRenderPassDescriptor() {
    let descriptor = this.hearth.renderPassDescriptor;

    const antialias = this.hearth.parameters.antialias;

    if (descriptor === null) {
      descriptor = {
        colorAttachments: [
          {
            view: null!,
          },
        ],
        depthStencilAttachment: {
          view: this.hearth.textures
            .getDepthBuffer(this.hearth.parameters.useDepth, this.hearth.parameters.useStencil)
            .createView(),
        },
      };

      const colorAttachment = descriptor.colorAttachments[0];

      if (antialias === true) {
        colorAttachment.view = this.hearth.colorBuffer.createView();
      } else {
        colorAttachment.resolveTarget = undefined;
      }

      this.hearth.renderPassDescriptor = descriptor;
    }

    const colorAttachment = descriptor.colorAttachments[0];

    if (antialias === true) {
      colorAttachment.resolveTarget = this.hearth.parameters.context.getCurrentTexture().createView();
    } else {
      colorAttachment.view = this.hearth.parameters.context.getCurrentTexture().createView();
    }

    return descriptor;
  }

  _getRenderPassDescriptor(renderContext: RenderContext) {
    const renderTarget = renderContext.renderTarget;
    const renderTargetData = this.hearth.memo.get(renderTarget);

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
        const textureData = this.hearth.memo.get(textures[i]);

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

      const depthTextureData = this.hearth.memo.get(renderContext.depthTexture);

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

  getClearColor() {
    const color = Color.from(this.hearth._clearColor);
    color.getRGB(color, this.hearth.currentColorSpace);
    return color;
  }
}

const _scene = new Scene();
const _drawSize = Vec2.new();
const _screen = Vec4.new();
const _frustum = Frustum.new();
const _projection = Mat4.new();
const _vec3 = Vec3.new();

class RenderViewport {
  constructor(width: number, height: number, minDepth: number, maxDepth: number) {}

  update() {
    context.viewportValue.from(viewport).scale(pixelRatio).floor();
    context.viewportValue.width >>= activeMipmapLevel;
    context.viewportValue.height >>= activeMipmapLevel;
    context.viewportValue.minDepth = 0;
    context.viewportValue.maxDepth = 1;
    context.useViewport = !context.viewportValue.equals(_screen);
  }
}

class RenderScissor {}
