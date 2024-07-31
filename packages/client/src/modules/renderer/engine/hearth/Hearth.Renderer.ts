import { HearthComponent } from '@modules/renderer/engine/hearth/Hearth.Component.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { Camera } from '@modules/renderer/engine/entities/cameras/Camera.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
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
import RenderList, { SortFn } from '@modules/renderer/engine/hearth/core/RenderList.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Material } from '@modules/renderer/engine/entities/materials/Material.js';
import LightsNode from '../nodes/lighting/LightsNode.ts';

export class HearthRenderer extends HearthComponent {
  async run(scene: Entity, camera: Camera): Promise<RenderContext> {
    const nodeFrame = this.hearth.nodes.nodeFrame;
    const previousRenderId = nodeFrame.renderId;
    const previousRenderContext = this.hearth.context;
    const previousRenderObjectFunction = this.hearth._activeRenderObjectFn;
    const sceneRef = Scene.is(scene) ? scene : _scene;

    const target = this.hearth.target;
    const context = this.hearth.renderContexts.get(scene, camera, target);

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

    this.updateScreen();
    this.updateViewport(context, viewport, pixelRatio);
    this.updateScissor(context, scissor, pixelRatio);
    context.clip.updateGlobal(this.hearth, camera);

    sceneRef.onBeforeRender(this.hearth, scene, camera, target);

    _projection.asMul(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.fromProjection(_projection);

    const list = this.hearth.renderLists.get(scene, camera);

    list.begin();
    this._projectObject(scene, camera, 0, list);
    list.finish();

    if (this.hearth.parameters.useSort) {
      list.sort(this.opaqueSort, this.transparentSort);
    }

    const activeMipmapLevel = this.hearth.activeMipmapLevel;
    if (target) {
      this.hearth.textures.updateRenderTarget(target);

      const data = this.hearth.textures.get(target);
      context.textures = data.textures;
      context.depthTexture = data.depthTexture;

      context.width = data.width >> activeMipmapLevel;
      context.height = data.height >> activeMipmapLevel;
      context.renderTarget = target;
      context.useDepth = target.depthBuffer;
      context.useStencil = target.stencilBuffer;
    } else {
      context.textures = null;
      context.depthTexture = null;

      context.width = this.hearth.parameters.canvas.width >> activeMipmapLevel;
      context.height = this.hearth.parameters.canvas.height >> activeMipmapLevel;
      context.useDepth = this.hearth.parameters.useDepth;
      context.useStencil = this.hearth.parameters.useStencil;
    }

    context.activeCubeFace = this.hearth.activeCubeFace;
    context.activeMipmapLevel = activeMipmapLevel;

    this.hearth.occlusion.sizes.set(context, list.occlusionQueryCount);

    this.hearth.nodes.updateScene(sceneRef);
    this.hearth.background.update(sceneRef, list, context);

    const data = this.hearth.memo.get(context);

    const device = this.hearth.device;

    let descriptor: GPURenderPassDescriptor;
    if (context.textures) {
      descriptor = this._getRenderPassDescriptor(context);
    } else {
      descriptor = this._getDefaultRenderPassDescriptor();
    }

    this.hearth.timestamp.attach(context, descriptor);
    this.hearth.occlusion.attach(context, descriptor);

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
    const pass = encoder.beginRenderPass(descriptor);

    data.descriptor = descriptor;
    data.encoder = encoder;
    data.pass = pass;
    data.currentSets = { attributes: {} };

    if (context.useUpdateViewport) {
      this.passViewport(context);
    }
    if (context.useUpdateScissor) {
      const { x, y, width, height } = context.scissor;

      pass.setScissorRect(x, context.height - height - y, width, height);
    }

    const opaque = list.opaque;
    const transparent = list.transparent;
    const lightsNode = list.lightsNode;

    if (opaque.length > 0) this.hearth._renderObjects(opaque, camera, sceneRef, lightsNode);
    if (transparent.length > 0) this.hearth._renderObjects(transparent, camera, sceneRef, lightsNode);

    this.hearth.occlusion.encodeEnd(context, data.pass);
    data.pass.end();

    this.hearth.occlusion.encodeTransfer(context, data.encoder);
    this.hearth.timestamp.encodeTransfer(context, data.encoder);
    this.hearth.device.queue.submit([data.encoder.finish()]);

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
    await this.hearth.occlusion.resolve(context);
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

  passViewport(renderContext: RenderContext) {
    const { pass } = this.hearth.memo.get(renderContext);
    const { x, y, width, height, minDepth, maxDepth } = renderContext.viewport;

    pass.setViewport(x, renderContext.height - height - y, width, height, minDepth, maxDepth);
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
    const pass = encoder.beginRenderPass({
      colorAttachments,
      depthStencilAttachment,
    });

    pass.end();

    device.queue.submit([encoder.finish()]);
  }

  _getDefaultRenderPassDescriptor(): GPURenderPassDescriptor {
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

  _getRenderPassDescriptor(context: RenderContext): GPURenderPassDescriptor {
    const renderTarget = context.renderTarget;
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

    let descriptor = descriptors[context.activeCubeFace];

    if (descriptor === undefined) {
      const textures = context.textures;
      const colorAttachments = [];

      for (let i = 0; i < textures.length; i++) {
        const textureData = this.hearth.memo.get(textures[i]);

        const textureView = textureData.texture.createView({
          baseMipLevel: context.activeMipmapLevel,
          mipLevelCount: 1,
          baseArrayLayer: context.activeCubeFace,
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

      const depthTextureData = this.hearth.memo.get(context.depthTexture);

      const depthStencilAttachment = {
        view: depthTextureData.texture.createView(),
      };

      descriptor = {
        colorAttachments,
        depthStencilAttachment,
      };

      descriptors[context.activeCubeFace] = descriptor;

      renderTargetData.width = renderTarget.width;
      renderTargetData.height = renderTarget.height;
      renderTargetData.samples = renderTarget.samples;
      renderTargetData.activeMipmapLevel = renderTarget.activeMipmapLevel;
    }

    return descriptor;
  }

  getClearColor(): Color {
    const color = Color.from(this.hearth._clearColor);
    color.getRGB(color, this.hearth.currentColorSpace);
    return color;
  }

  updateScreen(): void {
    const drawSize = this.hearth.getDrawSize(_drawSize);
    _screen.set(0, 0, drawSize.x, drawSize.y);
  }

  updateViewport(context: RenderContext, { x, y, z: width, w: height }: Vec4, pixelRatio: number): void {
    const activeMipmapLevel = this.hearth.activeMipmapLevel;

    context.viewport.set(
      ~~(x * pixelRatio),
      ~~(y * pixelRatio),
      ~~(width * pixelRatio) >> activeMipmapLevel,
      ~~(height * pixelRatio) >> activeMipmapLevel,
      0,
      1,
    );
    context.useUpdateViewport = this.hearth.useScissor && !context.viewport.equalsVec(_screen);
  }

  updateScissor(context: RenderContext, { x, y, z: width, w: height }: Vec4, pixelRatio: number): void {
    const activeMipmapLevel = this.hearth.activeMipmapLevel;

    context.scissor.set(
      ~~(x * pixelRatio),
      ~~(y * pixelRatio),
      ~~(width * pixelRatio) >> activeMipmapLevel,
      ~~(height * pixelRatio) >> activeMipmapLevel,
    );

    context.useUpdateScissor = this.hearth.useScissor && !context.scissor.equalsVec(_screen);
  }

  opaqueSort: SortFn = sortPainterAsc;
  transparentSort: SortFn = sortPainterDesc;
}

const maxlog = (max: number) => {
  return (...params: any) => {
    if (--max > 0) console.log(params);
  };
};
const log = maxlog(10);

const _scene = new Scene();
const _drawSize = Vec2.new();
const _screen = Vec4.new();
const _frustum = Frustum.new();
const _projection = Mat4.new();
const _vec3 = Vec3.new();
const _vec4 = Vec4.new();

const sortPainterAsc: SortFn = (a, b) => {
  if (a.groupOrder !== b.groupOrder) return a.groupOrder - b.groupOrder;
  if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
  if (a.material.id !== b.material.id) return a.material.id - b.material.id;
  if (a.z !== b.z) return a.z - b.z;
  return a.id - b.id;
};

const sortPainterDesc: SortFn = (a, b) => sortPainterAsc(b, a);

export type RenderFn = (
  object: Entity,
  material: Material,
  scene: Scene,
  camera: Camera,
  lightsNode: LightsNode,
  passId: string,
) => void;
