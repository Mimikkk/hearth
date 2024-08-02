import UniformNode from '../core/UniformNode.js';
import { NodeUpdateStage } from '../core/constants.js';
import { fixedNode, asNode } from '../shadernode/ShaderNodes.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';

export class TimerNode extends UniformNode<number> {
  static type = 'TimerNode';

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

export default TimerNode;

export const timerLocal = (timeScale: number, value: number = 0) =>
  asNode(new TimerNode(TimerType.Local, timeScale, value));
export const timerGlobal = (timeScale: number, value: number = 0) =>
  asNode(new TimerNode(TimerType.Total, timeScale, value));
export const timerDelta = (timeScale: number, value: number = 0) =>
  asNode(new TimerNode(TimerType.Delta, timeScale, value));
export const frameId = fixedNode(TimerNode, TimerType.Frame).u32();
