import { Pipeline } from './Pipeline.js';
import { ProgrammableStage } from '@modules/renderer/engine/hearth/core/ProgrammableStage.js';

export class ComputePipeline extends Pipeline {
  declare isComputePipeline: true;

  constructor(
    key: string,
    public program: ProgrammableStage,
  ) {
    super(key);
  }
}

ComputePipeline.prototype.isComputePipeline = true;
