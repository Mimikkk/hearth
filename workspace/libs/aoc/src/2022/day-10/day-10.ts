import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

type Noop = "noop";
type Addx = number;
type Instruction = Noop | Addx;

const isNoop = (instruction: Instruction): instruction is Noop => instruction === "noop";

const parseInstructions = (content: string): Instruction[] =>
  Str.lines(content).map((r) => r.split(" ")).map(([type, value]) => type === "noop" ? "noop" : +value);

const sumSignalStrength = (instructions: Instruction[]): number => {
  let registry = 1;
  let sum = 0;

  let cycle = 0;
  const incrementCycle = (n?: number) => {
    if (n === undefined || n === 1) {
      cycle += 1;
      if (cycle % 40 === 20) sum += cycle * registry;
      return;
    }

    while (n--) {
      cycle += 1;
      if (cycle % 40 === 20) sum += cycle * registry;
    }
  };

  for (let i = 0; i < instructions.length; ++i) {
    const instruction = instructions[i];

    if (isNoop(instruction)) {
      incrementCycle(1);
    } else {
      incrementCycle(2);
      registry += instruction;
    }
  }

  return sum;
};

export default Puzzle.new({
  prepare: parseInstructions,
  easy: sumSignalStrength,
  // hard: () => "",
});
