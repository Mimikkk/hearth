import { Ids } from "../../types/math/Ids.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

const createHeightMap = (content: string): number[][] => Str.lines(content).map((line) => line.split("").map(Number));

const neighbours = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const sumTrailheadScores = (heights: number[][]): number => {
  const n = heights.length;
  const m = heights[0]?.length ?? 0;
  const inBounds = (x: number, y: number) => x >= 0 && x < n && y >= 0 && y < m;

  const stack: [number, number, number][] = [];
  const trails = new Set();
  let score = 0;
  for (let i = 0; i < n; ++i) {
    for (let j = 0; j < m; ++j) {
      if (heights[i][j] !== 0) continue;

      trails.clear();
      stack.push([i, j, 1]);

      while (stack.length) {
        const [x, y, target] = stack.pop()!;

        for (let i = 0; i < neighbours.length; ++i) {
          const [dx, dy] = neighbours[i];
          const xdx = x + dx;
          const ydy = y + dy;

          if (!inBounds(xdx, ydy)) continue;

          const height = heights[xdx][ydy];

          if (height !== target) continue;
          if (height !== 9) {
            stack.push([xdx, ydy, target + 1]);
            continue;
          }

          trails.add(Ids.xyi32(xdx, ydy));
        }
      }

      score += trails.size;
    }
  }

  return score;
};

const countTrails = (heights: number[][]): number => {
  const n = heights.length;
  const m = heights[0]?.length ?? 0;
  const inBounds = (x: number, y: number) => x >= 0 && x < n && y >= 0 && y < m;

  const stack: [number, number, number][] = [];
  const trails = new Set();
  let score = 0;
  for (let i = 0; i < n; ++i) {
    for (let j = 0; j < m; ++j) {
      if (heights[i][j] !== 0) continue;

      trails.clear();
      stack.push([i, j, 1]);

      while (stack.length) {
        const [x, y, target] = stack.pop()!;

        for (let i = 0; i < neighbours.length; ++i) {
          const [dx, dy] = neighbours[i];
          const xdx = x + dx;
          const ydy = y + dy;

          if (!inBounds(xdx, ydy)) continue;

          const height = heights[xdx][ydy];

          if (height !== target) continue;
          if (height !== 9) {
            stack.push([xdx, ydy, target + 1]);
            continue;
          }

          score += 1;
        }
      }
    }
  }

  return score;
};

export default Puzzle.new({
  prepare: createHeightMap,
  easy: sumTrailheadScores,
  hard: countTrails,
});
