import type { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { Clock } from '@modules/renderer/engine/core/Clock.js';

export type AnimationLoopFn = (time: number, frame: number, clock: Clock) => void;

export class HearthAnimation {
  loop: AnimationLoopFn | null = null;
  requestId: number | null = null;
  before: AnimationLoopFn[] = [];
  after: AnimationLoopFn[] = [];
  clock: Clock;

  constructor(public hearth: Hearth) {
    this.clock = new Clock();
    this.loop = null;

    const update = () => {
      this.requestId = self.requestAnimationFrame(update);

      if (this.hearth.stats.useAutoTick) this.hearth.stats.tick();
      this.clock.tick();

      this.hearth.nodes.nodeFrame.step();
      this.hearth.stats.frame = this.hearth.nodes.nodeFrame.frameId;

      this.#loop();
    };

    update();
  }

  #loop(): void {
    const delta = this.clock.delta;

    for (let i = 0, it = this.before.length; i < it; ++i) {
      this.before[i](delta, this.hearth.stats.frame, this.clock);
    }

    this.loop?.(delta, this.hearth.stats.frame, this.clock);

    for (let i = 0, it = this.after.length; i < it; ++i) {
      this.after[i](delta, this.hearth.stats.frame, this.clock);
    }
  };

  dispose() {
    self.cancelAnimationFrame(this.requestId!);
  }
}
