import { Ids } from "../../types/math/Ids.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

const parseGrid = (content: string): string[][] => Str.lines(content).map((line) => line.split(""));

const orthogonals = [
  // up
  [-1, 0],
  // right
  [0, 1],
  // down
  [1, 0],
  // left
  [0, -1],
] as const;

const diagonals = [
  // up right
  [-1, 1],
  // down right
  [1, 1],
  // down left
  [1, -1],
  // up left
  [-1, -1],
];

const sumPlotPrices = (grid: string[][]) => {
  const n = grid.length;
  const m = grid[0]?.length ?? 0;
  const visited = new Set<number>();
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < m;

  const stack: [x: number, y: number][] = [];

  let sum = 0;
  for (let i = 0; i < n; ++i) {
    const row = grid[i];

    for (let j = 0; j < m; ++j) {
      const value = row[j];
      const id = Ids.xyi32(i, j);

      if (visited.has(id)) continue;

      stack.push([i, j]);
      let area = 0;
      let totalPerimeter = 0;

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;

        const id = Ids.xyi32(x, y);
        if (visited.has(id)) continue;
        visited.add(id);

        area += 1;
        let perimeter = 0;
        for (let k = 0; k < orthogonals.length; ++k) {
          const [dx, dy] = orthogonals[k];
          const xdx = x + dx;
          const ydy = y + dy;

          if (!inBounds(xdx, ydy)) {
            perimeter += 1;
            continue;
          }

          const nval = grid[xdx][ydy];

          if (nval !== value) {
            perimeter += 1;
            continue;
          }

          stack.push([xdx, ydy]);
        }

        totalPerimeter += perimeter;
      }

      sum += area * totalPerimeter;
    }
  }

  return sum;
};

const sumDiscountedPlotPrices = (grid: string[][]) => {
  const n = grid.length;
  const m = grid[0]?.length ?? 0;
  const visited = new Set<number>();
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < m;

  const stack: [x: number, y: number][] = [];

  let sum = 0;
  for (let i = 0; i < n; ++i) {
    const row = grid[i];

    for (let j = 0; j < m; ++j) {
      const value = row[j];
      const id = Ids.xyi32(i, j);

      if (visited.has(id)) continue;

      stack.push([i, j]);
      let area = 0;

      const polygon = new Set<number>();
      const polygonXYs: [number, number][] = [];
      while (stack.length > 0) {
        const [x, y] = stack.pop()!;

        const id = Ids.xyi32(x, y);
        if (visited.has(id)) continue;
        visited.add(id);

        polygonXYs.push([x, y]);
        polygon.add(id);

        area += 1;

        for (let k = 0; k < orthogonals.length; ++k) {
          const [dx, dy] = orthogonals[k];
          const xdx = x + dx;
          const ydy = y + dy;

          if (!inBounds(xdx, ydy)) continue;

          const nval = grid[xdx][ydy];

          if (nval !== value) continue;

          stack.push([xdx, ydy]);
        }
      }

      let corners = 0;
      for (let i = 0; i < polygonXYs.length; ++i) {
        const [x, y] = polygonXYs[i];

        for (let j = 0; j < 4; ++j) {
          const [ox1, oy1] = orthogonals[j];
          const [ox2, oy2] = orthogonals[(j + 1) % 4];
          const [dx, dy] = diagonals[j];

          const hasDiagonal = polygon.has(Ids.xyi32(x + dx, y + dy));
          const hasFirst = polygon.has(Ids.xyi32(x + ox1, y + oy1));
          const hasSecond = polygon.has(Ids.xyi32(x + ox2, y + oy2));

          const isConvex = hasFirst && hasSecond && !hasDiagonal;
          const isConcave = !hasFirst && !hasSecond;

          if (isConvex) corners += 1;
          if (isConcave) corners += 1;
        }
      }

      sum += area * corners;
    }
  }

  return sum;
};

export default Puzzle.new({
  prepare: parseGrid,
  easy: sumPlotPrices,
  hard: sumDiscountedPlotPrices,
});
