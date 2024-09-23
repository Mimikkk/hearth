import { UniformNode } from '../core/UniformNode.js';
import { NodeUpdateStage } from '../core/constants.js';
import { NodeFrame } from '../../nodes/core/NodeFrame.js';

export class TimerNode extends UniformNode<number> {
  constructor(
    public scope: TimerType,
    public scale: number = 1,
    value: number = 0,
  ) {
    super(value);
    this.stage = NodeUpdateStage.Frame;
  }

  update(frame: NodeFrame): void {
    const { scope, scale } = this;

    switch (scope) {
      case TimerType.Local:
        this.value += frame.clock.delta * scale;
        break;
      case TimerType.Delta:
        this.value = frame.clock.delta * scale;
        break;
      case TimerType.Frame:
        this.value = frame.frameId;
        break;
      case TimerType.Total:
        this.value = frame.clock.total * scale;
        break;
    }
  }
}

export enum TimerType {
  Local = 'local',
  Total = 'global',
  Delta = 'delta',
  Frame = 'frame',
}

export const timerLocal = (scale: number = 1, value: number = 0) => new TimerNode(TimerType.Local, scale, value);
export const timerGlobal = (scale: number = 1, value: number = 0) => new TimerNode(TimerType.Total, scale, value);
export const timerDelta = (scale: number = 1, value: number = 0) => new TimerNode(TimerType.Delta, scale, value);
export const frameId = new TimerNode(TimerType.Frame).u32();
