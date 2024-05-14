import ChainMap from './ChainMap.js';
import RenderList from './RenderList.js';
import { Scene } from '@modules/renderer/threejs/scenes/Scene.js';
import { Camera } from '@modules/renderer/threejs/cameras/Camera.js';

class RenderLists {
  lists: ChainMap<any, any>;

  constructor() {
    this.lists = new ChainMap();
  }

  get(scene: Scene, camera: Camera) {
    const lists = this.lists;
    const keys = [scene, camera];

    let list = lists.get(keys);
    if (list === undefined) {
      list = new RenderList();
      lists.set(keys, list);
    }

    return list;
  }

  dispose() {
    this.lists = new ChainMap();
  }
}

export default RenderLists;
