let _id = 0;

export type StageType = 'compute' | 'vertex' | 'fragment';

class ProgrammableStage {
  usedTimes: number = 0;
  id: number;

  constructor(
    public code: string,
    public stage: StageType,
    public attributes: any = null,
  ) {
    this.id = _id++;
  }
}

export default ProgrammableStage;
