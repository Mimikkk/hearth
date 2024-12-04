export interface Challenge<R, T1, T2 = T1> {
  prepare?: (value: T1) => T2;
  task: (value: T2) => R;
}

export interface PuzzleConfiguration<T, R1, R2, I1 = T, I2 = T> {
  prepare: (content: string) => T;
  easy?: Challenge<R1, T, I1> | ((content: T) => R1);
  hard?: Challenge<R2, T, I2> | ((content: T) => R2);
}

export class Puzzle<T, R1, R2, I1 = T, I2 = T> {
  static new<R1, R2, T = string, I1 = T, I2 = T>(
    configuration: Partial<PuzzleConfiguration<T, R1, R2, I1, I2>>,
  ): Puzzle<T, R1, R2, I1, I2> {
    return new this({
      prepare: configuration.prepare ?? ((content) => content as T),
      easy: configuration.easy,
      hard: configuration.hard,
    });
  }

  constructor(public readonly configuration: PuzzleConfiguration<T, R1, R2, I1, I2>) {}

  easy(content: string): R1 {
    const { configuration: { prepare, easy } } = this;
    if (!easy) throw Error("Easy task is not defined");

    const prepared = prepare(content);
    if (typeof easy === "function") return easy(prepared);

    return easy.task((easy.prepare?.(prepared) ?? prepared) as I1);
  }

  hard(content: string): R2 {
    const { configuration: { prepare, hard } } = this;
    if (!hard) throw Error("Hard task is not defined");

    const prepared = prepare(content);
    if (typeof hard === "function") return hard(prepared);
    return hard.task((hard.prepare?.(prepared) ?? prepared) as I2);
  }

  with(configuration: Partial<PuzzleConfiguration<T, R1, R2, I1, I2>>): Puzzle<T, R1, R2, I1, I2> {
    return new Puzzle({
      prepare: configuration.prepare ?? this.configuration.prepare,
      easy: configuration.easy ?? this.configuration.easy,
      hard: configuration.hard ?? this.configuration.hard,
    });
  }
}
