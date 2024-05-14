import type { Renderer } from '@modules/renderer/threejs/renderers/common/Renderer.js';

type AnimationLoopFn = (time: number, frame?: number) => void;

export class Animation {
  animationLoop: AnimationLoopFn | null = null;
  requestId: number | null = null;

  constructor(public renderer: Renderer) {
    this.animationLoop = null;

    const update = (time: number, frame?: number) => {
      this.requestId = self.requestAnimationFrame(update);

      if (this.renderer.info.autoReset) this.renderer.info.reset();

      this.renderer._nodes.nodeFrame.update();

      this.renderer.info.frame = this.renderer._nodes.nodeFrame.frameId;

      if (this.animationLoop !== null) this.animationLoop(time, frame);
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
