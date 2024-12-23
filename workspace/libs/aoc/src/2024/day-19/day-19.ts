import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

interface PuzzleInput {
  patterns: string[];
  designs: string[];
}

const parseInput = (content: string): PuzzleInput => {
  const lines = Str.lines(content);

  let i = 0;
  const patterns = lines[i++].split(", ");

  const designs = [];
  while (lines[++i]) designs.push(lines[i]);

  return { patterns, designs };
};

const countPossibleDesigns = ({ patterns, designs }: PuzzleInput) => {
  const available = new Set(patterns);

  const canMakeDesign = (patterns: string[], design: string) => {
    const stack = [...available].filter((pattern) => design.startsWith(pattern));

    while (stack.length) {
      const partial = stack.pop()!;

      if (available.has(design)) return true;
      if (partial === design) return true;

      for (const pattern of patterns) {
        const next = partial + pattern;
        if (next.length > design.length) continue;

        stack.push(next);
      }
    }

    return false;
  };

  let count = 0;

  for (let i = 0; i < designs.length; ++i) {
    if (canMakeDesign(patterns, designs[i])) ++count;
  }

  return count;
};

export default Puzzle.new({
  prepare: parseInput,
  easy: countPossibleDesigns,
  hard: () => 0,
});
