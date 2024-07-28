import ChainMap from './memo/ChainMap.js';
import RenderContext from './core/RenderContext.js';
import { Scene } from '@modules/renderer/engine/entities/scenes/Scene.js';
import { Camera } from '@modules/renderer/engine/entities/cameras/Camera.js';
import { RenderTarget } from '@modules/renderer/engine/hearth/core/RenderTarget.js';
import { Entity } from '@modules/renderer/engine/core/Entity.js';

export class HearthContexts {
  chainMaps: Map<string, ChainMap<Entity, RenderContext>> = new Map();

  constructor() {}

  get(scene: Scene, camera: Camera, target: RenderTarget | null = null): RenderContext {
    const key = [scene, camera];

    let state: string;
    if (target === null) {
      state = 'default';
    } else {
      state = `${target.count}:${target.texture.format}:${target.samples}:${target.depthBuffer}:${target.stencilBuffer}`;
    }

    const map = this.mapOf(state);

    let context = map.get(key);
    if (context === undefined) {
      context = new RenderContext();
      map.set(key, context);
    }

    if (target) context.sampleCount = target.samples === 0 ? 1 : target.samples;

    return context;
  }

  mapOf(state: string): ChainMap<Entity, RenderContext> {
    let chainMap = this.chainMaps.get(state);

    if (chainMap === undefined) {
      chainMap = new ChainMap();
      this.chainMaps.set(state, chainMap);
    }

    return chainMap;
  }

  dispose(): void {
    this.chainMaps.clear();
  }
}
