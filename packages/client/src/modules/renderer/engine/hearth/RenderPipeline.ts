import Pipeline from './Pipeline.js';
import ProgrammableStage from '@modules/renderer/engine/hearth/ProgrammableStage.js';

class RenderPipeline extends Pipeline {
  constructor(
    cacheKey: string,
    public vertexProgram: ProgrammableStage,
    public fragmentProgram: ProgrammableStage,
  ) {
    super(cacheKey);
  }
}

export default RenderPipeline;
