import ChainMap from './ChainMap.js';
import RenderObject from './RenderObject.js';
import { Forge } from '@modules/renderer/engine/renderers/Forge.js';
import RenderContext from '@modules/renderer/engine/renderers/core/RenderContext.js';
import LightsNode from '@modules/renderer/engine/nodes/lighting/LightsNode.js';
import { Camera } from '@modules/renderer/engine/objects/cameras/Camera.js';
import { Scene } from '@modules/renderer/engine/objects/scenes/Scene.js';
import { Material } from '@modules/renderer/engine/objects/materials/Material.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';

export class ForgeRenderObjects {
  chainMaps: Record<string, ChainMap<any, any>>;

  constructor(public renderer: Forge) {
    this.chainMaps = {};
  }

  get(
    object: Entity,
    material: Material,
    scene: Scene,
    camera: Camera,
    lightsNode: LightsNode,
    renderContext: RenderContext,
    passId: string = 'default',
  ) {
    const chainMap = this.getChainMap(passId);
    const chainArray = [object, material, renderContext, lightsNode];

    let renderObject = chainMap.get(chainArray);

    if (renderObject === undefined) {
      renderObject = this.createRenderObject(object, material, scene, camera, lightsNode, renderContext);

      chainMap.set(chainArray, renderObject);
    } else {
      renderObject.updateClipping(renderContext.clippingContext);

      if (renderObject.version !== material.version || renderObject.needsUpdate) {
        if (renderObject.initialCacheKey !== renderObject.getCacheKey()) {
          renderObject.dispose();

          renderObject = this.get(object, material, scene, camera, lightsNode, renderContext, passId);
        } else {
          renderObject.version = material.version;
        }
      }
    }

    return renderObject;
  }

  getChainMap(passId: string = 'default') {
    return this.chainMaps[passId] || (this.chainMaps[passId] = new ChainMap());
  }

  dispose() {
    this.chainMaps = {};
  }

  createRenderObject(
    object: Entity,
    material: Material,
    scene: Scene,
    camera: Camera,
    lightsNode: LightsNode,
    renderContext: RenderContext,
    passId: string,
  ) {
    const map = this.getChainMap(passId);

    const item = new RenderObject(this.renderer, object, material, scene, camera, lightsNode, renderContext);

    item.onDispose = () => {
      this.renderer.pipelines.delete(item);
      this.renderer.bindings.delete(item);
      this.renderer.nodes.delete(item);

      map.delete(item.getChainArray());
    };

    return item;
  }
}
