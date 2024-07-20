import { NodeUpdateType } from './constants.ts';
import { Scene } from '@modules/renderer/engine/scenes/Scene.js';
import { Object3D } from '@modules/renderer/engine/core/Object3D.js';
import { Camera } from '@modules/renderer/engine/cameras/Camera.js';
import { Material } from '@modules/renderer/engine/materials/Material.js';
import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

class NodeFrame {
  time: number;
  deltaTime: number;
  frameId: number;
  renderId: number;
  startTime: number | null;
  updateMap: WeakMap<any, any>;
  updateBeforeMap: WeakMap<any, any>;
  renderer: Renderer | null;
  material: Material | null;
  camera: Camera | null;
  object: Object3D | null;
  scene: Scene | null;

  constructor() {
    this.time = 0;
    this.deltaTime = 0;

    this.frameId = 0;
    this.renderId = 0;

    this.startTime = null;

    this.updateMap = new WeakMap();
    this.updateBeforeMap = new WeakMap();

    this.renderer = null;
    this.material = null;
    this.camera = null;
    this.object = null;
    this.scene = null;
  }

  map(referenceMap: Map<any, any>, nodeRef: Node) {
    let maps = referenceMap.get(nodeRef);

    if (maps === undefined) {
      maps = { renderMap: new WeakMap(), frameMap: new WeakMap() };

      referenceMap.set(nodeRef, maps);
    }

    return maps;
  }

  updateBeforeNode(node: Node) {
    const updateType = node.getUpdateBeforeType();
    const reference = node.setReference(this);

    if (updateType === NodeUpdateType.FRAME) {
      const { frameMap } = this.map(this.updateBeforeMap, reference);

      if (frameMap.get(node) !== this.frameId) {
        if (node.updateBefore(this) !== false) {
          frameMap.set(node, this.frameId);
        }
      }
    } else if (updateType === NodeUpdateType.RENDER) {
      const { renderMap } = this.map(this.updateBeforeMap, reference);

      if (renderMap.get(node) !== this.renderId) {
        if (node.updateBefore(this) !== false) {
          renderMap.set(node, this.renderId);
        }
      }
    } else if (updateType === NodeUpdateType.OBJECT) {
      node.updateBefore(this);
    }
  }

  updateNode(node) {
    const updateType = node.getUpdateType();
    const reference = node.setReference(this);

    if (updateType === NodeUpdateType.FRAME) {
      const { frameMap } = this.map(this.updateMap, reference);

      if (frameMap.get(node) !== this.frameId) {
        if (node.update(this) !== false) {
          frameMap.set(node, this.frameId);
        }
      }
    } else if (updateType === NodeUpdateType.RENDER) {
      const { renderMap } = this.map(this.updateMap, reference);

      if (renderMap.get(node) !== this.renderId) {
        if (node.update(this) !== false) {
          renderMap.set(node, this.renderId);
        }
      }
    } else if (updateType === NodeUpdateType.OBJECT) {
      node.update(this);
    }
  }

  update() {
    this.frameId++;

    if (this.lastTime === undefined) this.lastTime = performance.now();

    this.deltaTime = (performance.now() - this.lastTime) / 1000;

    this.lastTime = performance.now();

    this.time += this.deltaTime;
  }
}

export default NodeFrame;

export class ReferenceMap {
  frameMap: WeakMap<any, any>;
  renderMap: WeakMap<any, any>;

  constructor() {
    this.frameMap = new WeakMap();
    this.renderMap = new WeakMap();
  }
}
