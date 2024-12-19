import type { Const } from "../../../../types/const.ts";
import type { Cloneable } from "../classes/Cloneable.ts";
import { PuzzleInput } from "../classes/PuzzleInput.ts";
import type { Direction } from "../enums/direction.enum.ts";

export class HistoryRecord implements Cloneable<HistoryRecord> {
  static new(input: PuzzleInput = PuzzleInput.new(), moves: Direction[] = []): self {
    return new Self(input, moves);
  }

  static from(other: Const<self>, into = Self.new()): self {
    return into.from(other);
  }

  private constructor(public input: PuzzleInput, public moves: Direction[]) {}

  from({ input, moves }: Const<self>): this {
    return this.set(input.clone(), moves.slice());
  }

  set(input: PuzzleInput, moves: Direction[]): this {
    this.input = input;
    this.moves = moves;
    return this;
  }

  clone(into = Self.new()): self {
    return into.from(this);
  }
}

type self = HistoryRecord;
const Self = HistoryRecord;
