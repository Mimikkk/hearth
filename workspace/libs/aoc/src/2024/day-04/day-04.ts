import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

export const parseGrid = (content: string): string[][] => Str.lines(content).map((s) => s.split(""));

const neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, -1], [-1, 1]] as const;
type ConnectionKey = "X" | "M" | "A" | "S";
const connections = new Map<ConnectionKey, ConnectionKey>([
  ["X", "M"],
  ["M", "A"],
  ["A", "S"],
]);

const countXmas = (grid: string[][]): number => {
  const n = grid.length;
  const m = grid[0]?.length ?? 0;

  let count = 0;
  for (let i = 0; i < n; ++i) {
    const row = grid[i];
    for (let j = 0; j < m; ++j) {
      if (row[j] !== "X") continue;

      const x = i;
      const y = j;
      for (let i = 0; i < neighbours.length; ++i) {
        const [dx, dy] = neighbours[i];

        let key: ConnectionKey | undefined = "M";
        let xi = dx + x;
        let xj = dy + y;
        while (grid[xi]?.[xj] === key) {
          xi += dx;
          xj += dy;
          key = connections.get(key);
          if (key) continue;
          count += 1;
          break;
        }
      }
    }
  }

  return count;
};

const count2mas = (grid: string[][]): number => {
  const n = grid.length;
  const nMax = n - 1;
  const m = grid[0]?.length ?? 0;
  const mMax = m - 1;

  const isPattern = (
    i: number,
    j: number,
    topLeft: string,
    topRight: string,
    bottomLeft: string,
    bottomRight: string,
  ): boolean => (
    grid[i - 1][j - 1] === topLeft &&
    grid[i - 1][j + 1] === topRight &&
    grid[i + 1][j - 1] === bottomLeft &&
    grid[i + 1][j + 1] === bottomRight
  );

  let count = 0;
  for (let i = 1; i < nMax; ++i) {
    for (let j = 1; j < mMax; ++j) {
      if (
        grid[i][j] === "A" && (
          isPattern(i, j, "S", "S", "M", "M") ||
          isPattern(i, j, "M", "S", "M", "S") ||
          isPattern(i, j, "M", "M", "S", "S") ||
          isPattern(i, j, "S", "M", "S", "M")
        )
      ) ++count;
    }
  }

  return count;
};

export default Puzzle.new({
  prepare: parseGrid,
  easy: countXmas,
  hard: count2mas,
});
