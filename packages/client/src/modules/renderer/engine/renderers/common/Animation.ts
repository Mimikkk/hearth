import type { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { Clock } from '@modules/renderer/engine/core/Clock.js';
export type AnimationLoopFn = (time: number, frame?: number) => void;

export class Animation {
  animationLoop: AnimationLoopFn | null = null;
  requestId: number | null = null;

  constructor(public renderer: Renderer) {
    this.animationLoop = null;

    let previousTime = 0;

    const update = (time: number, frame?: number) => {
      const delta = (time - previousTime) / 1000;
      previousTime = time;
      this.requestId = self.requestAnimationFrame(update);

      if (this.renderer.info.autoReset) this.renderer.info.reset();

      this.renderer._nodes.nodeFrame.update();

      this.renderer.info.frame = this.renderer._nodes.nodeFrame.frameId;

      if (this.animationLoop !== null) this.animationLoop(delta, frame);
    };

    update(0);
  }

  dispose() {
    self.cancelAnimationFrame(this.requestId!);
  }

  setAnimationLoop(callback: AnimationLoopFn) {
    this.animationLoop = callback;
  }
}
