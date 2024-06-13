import Pipeline from './Pipeline.js';
import ProgrammableStage from '@modules/renderer/engine/renderers/common/ProgrammableStage.js';

export class ComputePipeline extends Pipeline {
  declare isComputePipeline: true;

  constructor(
    cacheKey: string,
    public computeProgram: ProgrammableStage,
  ) {
    super(cacheKey);

    this.isComputePipeline = true;
  }
}

export default ComputePipeline;
