import type { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

export type AnimationLoopFn = (time: number, frame?: number) => void;

export class HearthAnimation {
  loop: AnimationLoopFn | null = null;
  requestId: number | null = null;

  constructor(public hearth: Hearth) {
    this.loop = null;

    const update = (time: number, frame?: number) => {
      this.requestId = self.requestAnimationFrame(update);

      if (this.hearth.info.useAutoTick) this.hearth.info.tick();

      this.hearth.nodes.nodeFrame.update();

      this.hearth.info.frame = this.hearth.nodes.nodeFrame.frameId;

      if (this.loop !== null) this.loop(time, frame);
    };

    update(0);
  }

  dispose() {
    self.cancelAnimationFrame(this.requestId!);
  }
}
