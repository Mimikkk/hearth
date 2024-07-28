import { NodeUpdateType } from './constants.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';
import { Camera } from '@modules/renderer/engine/entities/cameras/Camera.js';
import { Material } from '@modules/renderer/engine/entities/materials/Material.js';
import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { Node } from '../core/Node.js';
import { Clock } from '@modules/renderer/engine/core/Clock.js';

export class NodeFrame {
  time: number;
  deltaTime: number;
  lastTime: number;
  frameId: number;
  renderId: number;
  startTime: number;
  updateMap: WeakMap<Node, ReferenceMap>;
  updateBeforeMap: WeakMap<Node, ReferenceMap>;
  renderer: Hearth;
  material: Material;
  camera: Camera;
  object: Entity;
  scene: Scene;
  clock: Clock;

  constructor() {
    this.time = 0;
    this.deltaTime = 0;
    this.frameId = 0;
    this.renderId = 0;

    this.clock = Clock.new();
    this.updateMap = new WeakMap();
    this.updateBeforeMap = new WeakMap();

    this.startTime = null!;
    this.renderer = null!;
    this.material = null!;
    this.camera = null!;
    this.object = null!;
    this.scene = null!;
  }

  map(node: Node, reference: WeakMap<Node, ReferenceMap>): ReferenceMap {
    let maps = reference.get(node);

    if (maps === undefined) {
      maps = ReferenceMap.new();
      reference.set(node, maps);
    }

    return maps;
  }

  updateBeforeNode(node: Node): void {
    const type = node.getUpdateBeforeType();
    const reference = node.updateReference(this);

    if (type === NodeUpdateType.Frame) {
      const { frameMap } = this.map(reference, this.updateBeforeMap);

      if (frameMap.get(node) !== this.frameId) {
        if (node.updateBefore(this) !== false) {
          frameMap.set(node, this.frameId);
        }
      }
    } else if (type === NodeUpdateType.Render) {
      const { renderMap } = this.map(reference, this.updateBeforeMap);

      if (renderMap.get(node) !== this.renderId) {
        if (node.updateBefore(this) !== false) {
          renderMap.set(node, this.renderId);
        }
      }
    } else if (type === NodeUpdateType.Object) {
      node.updateBefore(this);
    }
  }

  updateNode(node: Node): void {
    const updateType = node.getUpdateType();
    const reference = node.updateReference(this);

    if (updateType === NodeUpdateType.Frame) {
      const { frameMap } = this.map(reference, this.updateMap);

      if (frameMap.get(node) !== this.frameId) {
        if (node.update(this) !== false) {
          frameMap.set(node, this.frameId);
        }
      }
    } else if (updateType === NodeUpdateType.Render) {
      const { renderMap } = this.map(reference, this.updateMap);

      if (renderMap.get(node) !== this.renderId) {
        if (node.update(this) !== false) {
          renderMap.set(node, this.renderId);
        }
      }
    } else if (updateType === NodeUpdateType.Object) {
      node.update(this);
    }
  }

  update(): void {
    ++this.frameId;

    this.clock.tick();
    this.deltaTime = this.clock.delta;
    this.lastTime = this.clock.previous;
    this.time = this.clock.total;
  }
}

export default NodeFrame;

export class ReferenceMap {
  frameMap: WeakMap<Node, number>;
  renderMap: WeakMap<Node, number>;

  constructor() {
    this.frameMap = new WeakMap();
    this.renderMap = new WeakMap();
  }

  static new() {
    return new ReferenceMap();
  }
}
