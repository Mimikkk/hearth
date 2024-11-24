export interface Challenge<R, T1, T2 = T1> {
  prepare?: (value: T1) => T2;
  task: (value: T2) => R;
}

export interface PuzzleConfiguration<T, R1, R2, I1 = T, I2 = T> {
  prepare: (content: string) => T;
  easy: Challenge<R1, T, I1>;
  hard: Challenge<R2, T, I2>;
}

export class Puzzle<T, R1, R2> {
  static create<T, R1, R2>(configuration: PuzzleConfiguration<T, R1, R2>): Puzzle<T, R1, R2> {
    return new this(configuration);
  }

  constructor(private readonly configuration: PuzzleConfiguration<T, R1, R2>) {}

  easy(content: string): R1 {
    const { configuration: { prepare, easy } } = this;

    const prepared = prepare(content);
    return easy.task(easy.prepare?.(prepared) ?? prepared);
  }

  hard(content: string): R2 {
    const { configuration: { prepare, hard } } = this;

    const prepared = prepare(content);
    return hard.task(hard.prepare?.(prepared) ?? prepared);
  }
}
