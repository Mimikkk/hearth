import ChainMap from './ChainMap.js';
import RenderContext from './RenderContext.js';
import { Scene } from '@modules/renderer/threejs/scenes/Scene.js';
import { Camera } from '@modules/renderer/threejs/cameras/Camera.js';
import { RenderTarget } from '@modules/renderer/threejs/core/RenderTarget.js';

class RenderContexts {
  chainMaps: Record<string, ChainMap<any, any>>;

  constructor() {
    this.chainMaps = {};
  }

  get(scene: Scene, camera: Camera, renderTarget: RenderTarget | null = null) {
    const chainKey = [scene, camera];

    let attachmentState;

    if (renderTarget === null) {
      attachmentState = 'default';
    } else {
      const format = renderTarget.texture.format;
      const count = renderTarget.count;

      attachmentState = `${count}:${format}:${renderTarget.samples}:${renderTarget.depthBuffer}:${renderTarget.stencilBuffer}`;
    }

    const chainMap = this.getChainMap(attachmentState);

    let renderState = chainMap.get(chainKey);

    if (renderState === undefined) {
      renderState = new RenderContext();

      chainMap.set(chainKey, renderState);
    }

    if (renderTarget !== null) renderState.sampleCount = renderTarget.samples === 0 ? 1 : renderTarget.samples;

    return renderState;
  }

  getChainMap(attachmentState: string) {
    return this.chainMaps[attachmentState] || (this.chainMaps[attachmentState] = new ChainMap());
  }

  dispose() {
    this.chainMaps = {};
  }
}

export default RenderContexts;
