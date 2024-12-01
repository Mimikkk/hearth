import { Str } from "../../mod.ts";
import { Puzzle } from "../../types/puzzle.ts";

type Move = [count: number, from: number, to: number];
type Stack = string[];

const parseMoves = (lines: string[]): Move[] =>
  lines.map((line) => {
    const [, who, , from, , to] = line.split(" ");

    return [+who, +from - 1, +to - 1] as Move;
  });

const parseStacks = (lines: string[]): Stack[] => {
  const stackCount = (lines[0].length + 1) / 4;
  const stacks: string[][] = Array(stackCount).fill(0).map(() => []);

  for (let i = 1; i < lines[0].length; i += 4) {
    const stack = stacks[(i - 1) / 4];

    for (let j = 0; j < lines.length; ++j) {
      const item = lines[j][i];
      if (item === " ") continue;
      stack.push(item);
    }

    stack.reverse();
  }

  return stacks;
};

const splitLines = (lines: string[]): [stacksLines: string[], movesLines: string[]] => {
  const splitIndex = lines.findIndex((line) => line === "");
  const stacksLines = lines.splice(0, splitIndex + 1);
  stacksLines.pop();
  stacksLines.pop();

  return [stacksLines, lines] as const;
};

type HandleMove = (stacks: Stack[], [count, fromIndex, toIndex]: Move) => void;
const applyMoveSingleAtATime: HandleMove = (stacks, [count, fromIndex, toIndex]) => {
  const from = stacks[fromIndex];
  const to = stacks[toIndex];

  for (let i = 0; i < count; ++i) {
    const item = from.pop();
    if (!item) break;
    to.push(item);
  }
};
const applyMoveMultipleAtATime: HandleMove = (stacks, [count, fromIndex, toIndex]) => {
  const from = stacks[fromIndex];
  const to = stacks[toIndex];

  to.push(...from.splice(-count));
};

const readTopAfterMoves = (stacks: Stack[], moves: Move[], onMove: HandleMove): string => {
  for (let i = 0; i < moves.length; ++i) {
    onMove(stacks, moves[i]);
  }

  return readTop(stacks);
};

const readTop = (stacks: Stack[]): string => stacks.map((stack) => stack[stack.length - 1]).join("");

export default Puzzle.create({
  prepare(content) {
    const [stacksLines, moveLines] = splitLines(Str.lines(content));
    return [parseStacks(stacksLines), parseMoves(moveLines)] as const;
  },
  easy: ([stacks, moves]) => readTopAfterMoves(stacks, moves, applyMoveSingleAtATime),
  hard: ([stacks, moves]) => readTopAfterMoves(stacks, moves, applyMoveMultipleAtATime),
});
