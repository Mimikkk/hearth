import DataMap from './DataMap.js';
import { Camera, Color, Mesh, Scene, Side, SphereGeometry } from '@modules/renderer/engine/engine.js';
import {
  backgroundBlurriness,
  backgroundIntensity,
  context,
  modelViewProjection,
  NodeMaterial,
  normalWorld,
  vec4,
} from '../nodes/Nodes.js';
import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';
import RenderContext from '@modules/renderer/engine/renderers/RenderContext.js';
import RenderList from '@modules/renderer/engine/renderers/RenderList.js';

const _clearColor = Color.new(0, 0, 0, 1);

class Background extends DataMap<any, any> {
  constructor(public renderer: Renderer) {
    super();
  }

  update(scene: Scene, renderList: RenderList, context: RenderContext) {
    const renderer = this.renderer;
    const background = this.renderer.nodes.getBackgroundNode(scene) || scene.background;

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

      _clearColor.from(renderer._clearColor);

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
          this.matrixWorld.fromMat4Position(camera.matrixWorld);
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

    if (renderer.parameters.autoClear || forceClear) {
      _clearColor.scale(_clearColor.a);

      const color = context.clearColor;
      color.r = _clearColor.r;
      color.g = _clearColor.g;
      color.b = _clearColor.b;
      color.a = _clearColor.a;

      context.clearDepth = renderer.clearDepth;
      context.clearStencil = renderer.clearStencil;

      context.useClearColor = renderer.parameters.autoClearColor;
      context.useClearDepth = renderer.parameters.autoClearDepth;
      context.useClearStencil = renderer.parameters.autoClearStencil;
    } else {
      context.useClearColor = false;
      context.useClearDepth = false;
      context.useClearStencil = false;
    }
  }
}

export default Background;
