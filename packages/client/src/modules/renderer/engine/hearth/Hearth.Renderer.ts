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
    this.hearth.info.passes++;
    this.hearth.info.render.passes++;
    nodeFrame.renderId = this.hearth.info.passes;

    if (scene.matrixWorldAutoUpdate) scene.updateMatrixWorld();

    if (camera.parent === null && camera.matrixWorldAutoUpdate) camera.updateMatrixWorld();
    let viewport = this.hearth.viewport;
    let scissor = this.hearth.scissor;
    let pixelRatio = this.hearth._pixelRatio;

    if (target !== null) {
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
    context.useViewport = context.viewportValue.equals(_screen) === false;

    context.scissorValue.from(scissor).scale(pixelRatio).floor();
    context.useScissor = this.hearth.useScissor && context.scissorValue.equals(_screen) === false;
    context.scissorValue.width >>= activeMipmapLevel;
    context.scissorValue.height >>= activeMipmapLevel;

    if (!context.clippingContext) context.clippingContext = new ClippingContext();
    context.clippingContext.updateGlobal(this.hearth, camera);
    sceneRef.onBeforeRender(this.hearth, scene, camera, target);
    _projection.asMul(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.fromProjection(_projection);

    const renderList = this.hearth.renderLists.get(scene, camera);
    renderList.begin();

    this.hearth._projectObject(scene, camera, 0, renderList);

    renderList.finish();

    if (this.hearth.parameters.useSort) {
      renderList.sort(this.hearth.opaqueSort, this.hearth.transparentSort);
    }
    if (target !== null) {
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
    this.hearth.beginRender(context);

    const opaque = renderList.opaque;
    const transparent = renderList.transparent;
    const lightsNode = renderList.lightsNode;

    if (opaque.length > 0) this.hearth._renderObjects(opaque, camera, sceneRef, lightsNode);
    if (transparent.length > 0) this.hearth._renderObjects(transparent, camera, sceneRef, lightsNode);

    this.hearth.finishRender(context);

    nodeFrame.renderId = previousRenderId;
    this.hearth.context = previousRenderContext;
    this.hearth._activeRenderObjectFn = previousRenderObjectFunction;

    sceneRef.onAfterRender(this.hearth, scene, camera, target);
    await this.hearth.timestamp.resolve(context, 'render');

    return context;
  }
}

const _scene = new Scene();
const _drawSize = Vec2.new();
const _screen = Vec4.new();
const _frustum = Frustum.new();
const _projection = Mat4.new();
const _vec3 = Vec3.new();
