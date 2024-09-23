import { Pipeline } from './Pipeline.js';
import { ProgrammableStage } from '../core/ProgrammableStage.js';

export class RenderPipeline extends Pipeline {
  constructor(
    key: string,
    public vertex: ProgrammableStage,
    public fragment: ProgrammableStage,
  ) {
    super(key);
  }
}
