import DataMap from './memo/DataMap.js';
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
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { RenderContext } from '@modules/renderer/engine/hearth/core/RenderContext.js';
import { RenderQueue } from '@modules/renderer/engine/hearth/core/RenderQueue.js';

const _clearColor = Color.new(0, 0, 0, 1);

export class HearthBackground extends DataMap<any, any> {
  constructor(public hearth: Hearth) {
    super();
  }

  update(scene: Scene, renderList: RenderQueue, renderContext: RenderContext) {
    const hearth = this.hearth;
    const background = this.hearth.nodes.getBackgroundNode(scene) || scene.background;

    let forceClear = false;

    if (background === null) {
      hearth._clearColor.getRGB(_clearColor, this.hearth.currentColorSpace);
      _clearColor.a = hearth._clearColor.a;
    } else if (background.isColor === true) {
      background.getRGB(_clearColor, this.hearth.currentColorSpace);
      _clearColor.a = 1;

      forceClear = true;
    } else if (background.isNode === true) {
      const sceneData = this.get(scene);
      const backgroundNode = background;

      _clearColor.from(hearth._clearColor);

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

        backgroundMesh.onBeforeRender = function (hearth: Hearth, scene: Scene, camera: Camera) {
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
      console.error('Hearth: Unsupported background configuration.', background);
    }

    if (hearth.parameters.autoClear || forceClear) {
      _clearColor.scale(_clearColor.a);

      const clearColorValue = renderContext.clearColor;

      clearColorValue.r = _clearColor.r;
      clearColorValue.g = _clearColor.g;
      clearColorValue.b = _clearColor.b;
      clearColorValue.a = _clearColor.a;

      renderContext.depthClear = hearth._clearDepth;
      renderContext.stencilClear = hearth._clearStencil;

      renderContext.useClearColor = hearth.parameters.autoClearColor;
      renderContext.useClearDepth = hearth.parameters.autoClearDepth;
      renderContext.useClearStencil = hearth.parameters.autoClearStencil;
    } else {
      renderContext.useClearColor = false;
      renderContext.useClearDepth = false;
      renderContext.useClearStencil = false;
    }
  }
}
