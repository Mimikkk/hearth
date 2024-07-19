import type { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import { Clock } from '@modules/renderer/engine/core/Clock.js';
export type AnimationLoopFn = (time: number, frame?: number) => void;

export class Animation {
  loop: AnimationLoopFn | null = null;
  requestId: number | null = null;

  constructor(public renderer: Renderer) {
    this.loop = null;

    let previousTime = 0;

    const update = (time: number, frame?: number) => {
      const delta = (time - previousTime) / 1000;
      previousTime = time;
      this.requestId = self.requestAnimationFrame(update);

      if (this.renderer.info.autoReset) this.renderer.info.reset();

      this.renderer._nodes.frame.update();

      this.renderer.info.frame = this.renderer._nodes.frame.frameId;

      if (this.loop) this.loop(delta, frame);
    };

    update(0);
  }

  dispose() {
    self.cancelAnimationFrame(this.requestId!);
  }
}
