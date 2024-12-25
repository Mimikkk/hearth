import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";
import { Ids } from "../../types/math/Ids.ts";
import { memoize } from "../../utils/memoize.ts";
import { sumBy } from "../../utils/maths.ts";

interface PuzzleInput {
  patterns: string[];
  designs: string[];
}

const parseInput = (content: string): PuzzleInput => {
  const lines = Str.lines(content);

  let i = 0;
  const patterns = lines[i++].split(", ");

  const designs: string[] = [];
  while (lines[++i]) designs.push(lines[i]);

  return { patterns, designs };
};

const countPossibleDesigns = ({ patterns, designs }: PuzzleInput) => {
  const possible = new Set();

  const canMakeDesign = (patterns: string[], design: string) => {
    if (possible.has(design)) return true;

    const stack: [design: string, position: number][] = patterns
      .filter((pattern) => design.startsWith(pattern))
      .map((pattern) => [pattern, pattern.length]);

    const length = design.length;
    while (stack.length) {
      const [pattern, position] = stack.pop()!;

      if (position === length) {
        possible.add(pattern);
        return true;
      }

      for (let i = 0; i < patterns.length; ++i) {
        const nextPattern = patterns[i];
        const nextPosition = position + nextPattern.length;

        if (!design.startsWith(nextPattern, position)) continue;

        stack.push([nextPattern, nextPosition]);
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

const countPossibleDesignVariants = ({ patterns, designs }: PuzzleInput) => {
  const indices = new Map<string, number>(designs.map((design, index) => [design, index]));

  const findMatches = memoize(
    (design: string, position: number): number[] => {
      const matches = [];

      for (let i = 0; i < patterns.length; ++i) {
        const pattern = patterns[i];
        if (!design.startsWith(pattern, position)) continue;
        matches.push(pattern.length);
      }

      return matches;
    },
    (design, position) => Ids.xyi32(indices.get(design)!, position),
  );

  const countVariants = (design: string) => {
    const counts = new Map<number, number>();
    const positions = new Set<number>();

    const stack: number[] = [0];
    while (stack.length > 0) {
      const position = stack.pop()!;

      if (positions.has(position) || position > design.length) continue;
      positions.add(position);

      const matches = findMatches(design, position);
      for (const length of matches) {
        stack.push(position + length);
      }
    }

    const sorted = Array.from(positions).sort((a, b) => b - a);

    for (const position of sorted) {
      if (position === design.length) {
        counts.set(design.length, 1);
        continue;
      }

      counts.set(
        position,
        sumBy(findMatches(design, position), (length) => counts.get(position + length) ?? 0),
      );
    }

    return counts.get(0) ?? 0;
  };

  return sumBy(designs, countVariants);
};

export default Puzzle.new({
  prepare: parseInput,
  easy: countPossibleDesigns,
  hard: countPossibleDesignVariants,
});
