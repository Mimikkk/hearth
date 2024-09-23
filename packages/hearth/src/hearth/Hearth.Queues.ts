import ChainMap from './memo/ChainMap.js';
import { RenderQueue } from './core/RenderQueue.js';
import { Scene } from '../entities/scenes/Scene.js';
import { Camera } from '../entities/cameras/Camera.js';

export class HearthQueues {
  lists: ChainMap<any, any>;

  constructor() {
    this.lists = new ChainMap();
  }

  get(scene: Scene, camera: Camera) {
    const lists = this.lists;
    const keys = [scene, camera];

    let list = lists.get(keys);
    if (list === undefined) {
      list = new RenderQueue();
      lists.set(keys, list);
    }

    return list;
  }

  dispose() {
    this.lists = new ChainMap();
  }
}
