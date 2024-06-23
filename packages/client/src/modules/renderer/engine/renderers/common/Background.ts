import DataMap from './DataMap.js';
import Color4 from './Color4.js';
import { Camera, Mesh, Scene, Side, SphereGeometry } from '@modules/renderer/engine/engine.js';
import {
  backgroundBlurriness,
  backgroundIntensity,
  context,
  modelViewProjection,
  NodeMaterial,
  normalWorld,
  vec4,
} from '../../nodes/Nodes.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import RenderContext from '@modules/renderer/engine/renderers/common/RenderContext.js';
import RenderList from '@modules/renderer/engine/renderers/common/RenderList.js';

const _clearColor = new Color4(0, 0, 0, 1);

class Background extends DataMap<any, any> {
  constructor(public renderer: Renderer) {
    super();
  }

  update(scene: Scene, renderList: RenderList, renderContext: RenderContext) {
    const renderer = this.renderer;
    const background = this.renderer._nodes.getBackgroundNode(scene) || scene.background;

    let forceClear = false;

    if (background === null) {
      // no background settings, use clear color configuration from the renderer

      renderer._clearColor.getRGB(_clearColor, this.renderer.currentColorSpace);
      _clearColor.a = renderer._clearColor.a;
    } else if (background.isColor === true) {
      // background is an opaque color

      background.getRGB(_clearColor, this.renderer.currentColorSpace);
      _clearColor.a = 1;

      forceClear = true;
    } else if (background.isNode === true) {
      const sceneData = this.get(scene);
      const backgroundNode = background;

      _clearColor.copy(renderer._clearColor);

      let backgroundMesh = sceneData.backgroundMesh;

      if (backgroundMesh === undefined) {
        const backgroundMeshNode = context(vec4(backgroundNode).mul(backgroundIntensity), {
          getUV: () => normalWorld,
          getTextureLevel: () => backgroundBlurriness,
        });

        let viewProj = modelViewProjection();
        viewProj = viewProj.setZ(viewProj.w);

        const nodeMaterial = new NodeMaterial();
        nodeMaterial.side = Side.Back;
        nodeMaterial.depthTest = false;
        nodeMaterial.depthWrite = false;
        nodeMaterial.fog = false;
        nodeMaterial.vertexNode = viewProj;
        nodeMaterial.fragmentNode = backgroundMeshNode;

        sceneData.backgroundMeshNode = backgroundMeshNode;
        sceneData.backgroundMesh = backgroundMesh = new Mesh(new SphereGeometry(1, 32, 32), nodeMaterial);
        backgroundMesh.frustumCulled = false;

        backgroundMesh.onBeforeRender = function (renderer: Renderer, scene: Scene, camera: Camera) {
          this.matrixWorld.copyPosition(camera.matrixWorld);
        };
      }

      const backgroundCacheKey = backgroundNode.getCacheKey();

      if (sceneData.backgroundCacheKey !== backgroundCacheKey) {
        sceneData.backgroundMeshNode.node = vec4(backgroundNode);

        backgroundMesh.material.needsUpdate = true;

        sceneData.backgroundCacheKey = backgroundCacheKey;
      }

      renderList.unshift(backgroundMesh, backgroundMesh.geometry, backgroundMesh.material, 0, 0, null);
    } else {
      console.error('engine.Renderer: Unsupported background configuration.', background);
    }

    //

    if (renderer.parameters.autoClear === true || forceClear === true) {
      _clearColor.multiplyScalar(_clearColor.a);

      const clearColorValue = renderContext.clearColorValue;

      clearColorValue.r = _clearColor.r;
      clearColorValue.g = _clearColor.g;
      clearColorValue.b = _clearColor.b;
      clearColorValue.a = _clearColor.a;

      renderContext.depthClearValue = renderer._clearDepth;
      renderContext.stencilClearValue = renderer._clearStencil;

      renderContext.clearColor = renderer.parameters.autoClearColor === true;
      renderContext.clearDepth = renderer.parameters.autoClearDepth === true;
      renderContext.clearStencil = renderer.parameters.autoClearStencil === true;
    } else {
      renderContext.clearColor = false;
      renderContext.clearDepth = false;
      renderContext.clearStencil = false;
    }
  }
}

export default Background;
