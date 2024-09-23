import { ShaderStage } from '../../nodes/builder/NodeBuilder.types.js';

let _id = 0;

export class ProgrammableStage {
  usedTimes: number = 0;
  id: number;

  constructor(
    public code: string,
    public stage: ShaderStage,
    public attributes: any = null,
  ) {
    this.id = _id++;
  }
}
