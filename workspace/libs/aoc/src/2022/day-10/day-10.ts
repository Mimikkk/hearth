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

const readCrtMessage = (instructions: Instruction[]): string => {
  let spritePosition = 1;

  const width = 40;
  const lines: string[] = [];

  let cycle = 0;
  let line = Array(width).fill(".");
  const incrementCycle = (n?: number) => {
    if (n !== undefined) {
      while (n--) incrementCycle();
      return;
    }

    const needlePosition = cycle % width;

    const isVisible = needlePosition === spritePosition - 1 ||
      needlePosition === spritePosition ||
      needlePosition === spritePosition + 1;

    if (isVisible) line[needlePosition] = "#";

    if (needlePosition === width - 1) {
      lines.push(line.join(""));
      line = Array(width).fill(".");
    }

    cycle += 1;
  };

  for (let i = 0; i < instructions.length; ++i) {
    const instruction = instructions[i];

    if (isNoop(instruction)) {
      incrementCycle(1);
    } else {
      incrementCycle(2);
      spritePosition += instruction;
    }
  }

  return lines.join("\n");
};

export default Puzzle.new({
  prepare: parseInstructions,
  easy: sumSignalStrength,
  hard: readCrtMessage,
});
