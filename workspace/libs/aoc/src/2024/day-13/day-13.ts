import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

const re = {
  ints: /(\d+)/g,
};

interface ClawMachine {
  a: Vec2;
  b: Vec2;
  prize: Vec2;
}

const parse = (content: string) => {
  const lines = Str.lines(content);

  const claws: ClawMachine[] = [];
  for (let i = 0; i < lines.length; i += 4) {
    const a = Vec2.fromArray(lines[i].match(re.ints)!.map(Number));
    const b = Vec2.fromArray(lines[i + 1].match(re.ints)!.map(Number));
    const prize = Vec2.fromArray(lines[i + 2].match(re.ints)!.map(Number));

    claws.push({ a, b, prize });
  }

  return claws;
};

const PushACost = 3;
const PushBCost = 1;
const findCostToClawAPrize = (
  { a: { x: ax, y: ay }, b: { x: bx, y: by }, prize: { x: px, y: py } }: ClawMachine,
): number | undefined => {
  // Calculate determinant of matrix formed by button vectors
  const det = (ax * by) - (bx * ay);
  // Solve for number of B button presses using Cramer's rule
  const bCount = ((ax * py) - (px * ay)) / det;
  // Solve for number of A button presses using substitution
  const aCount = (px - bx * bCount) / ax;

  if (!Number.isInteger(aCount) || !Number.isInteger(bCount) || aCount < 0 || bCount < 0) return;

  return (aCount * PushACost) + (bCount * PushBCost);
};

const totalCostToClawAPrize = (claws: ClawMachine[]) => {
  let total = 0;

  for (let i = 0; i < claws.length; ++i) {
    const cost = findCostToClawAPrize(claws[i]);
    if (cost === undefined) continue;

    total += cost;
  }
  return total;
};

const totalCostToClawErrorPrize = (claws: ClawMachine[]) => {
  for (let i = 0; i < claws.length; ++i) {
    claws[i].prize.addXY(1e13, 1e13);
  }

  return totalCostToClawAPrize(claws);
};

export default Puzzle.new({
  prepare: parse,
  easy: totalCostToClawAPrize,
  hard: totalCostToClawErrorPrize,
});
