import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

const parseGrid = (lines: string[]): number[][] => {
  const m = lines.length;
  const n = lines[0]?.length ?? 0;

  const grid: number[][] = Array(m);
  for (let x = 0; x < m; ++x) {
    const line = lines[x];
    const row: number[] = Array(n);
    grid[x] = row;

    for (let y = 0; y < m; ++y) {
      row[y] = +line[y];
    }
  }

  return grid;
};

const countVisibleTrees = (grid: number[][]): number => {
  const m = grid.length;
  const n = grid[0]?.length ?? 0;
  const outerEdgeSize = (m * n) - ((m - 2) * (n - 2));

  const mMax = m - 1;
  const nMax = n - 1;

  const createId = (x: number, y: number): string => x.toString() + "," + y.toString();

  const visibles = new Set<string>();
  for (let i = 1; i < mMax; ++i) {
    const row = grid[i];

    let highestLeft = row[0];
    for (let j = 1; j < nMax; ++j) {
      const id = createId(i, j);
      const height = row[j];

      if (height <= highestLeft) continue;
      highestLeft = height;
      visibles.add(id);
    }

    let highestRight = row[nMax];
    for (let j = nMax - 1; j > 0; --j) {
      const id = createId(i, j);
      const height = row[j];

      if (height <= highestRight) continue;
      highestRight = height;
      visibles.add(id);
    }
  }

  for (let j = 1; j < nMax; ++j) {
    let highestTop = grid[0][j];
    for (let i = 1; i < mMax; ++i) {
      const id = createId(i, j);

      const height = grid[i][j];
      if (height <= highestTop) continue;
      highestTop = height;
      visibles.add(id);
    }

    let highestBottom = grid[m - 1][j];
    for (let i = mMax - 1; i > 0; --i) {
      const id = createId(i, j);

      const height = grid[i][j];
      if (height <= highestBottom) continue;
      highestBottom = height;
      visibles.add(id);
    }
  }

  return outerEdgeSize + visibles.size;
};

const maxScenicScore = (grid: number[][]): number => {
  const m = grid.length;
  const n = grid[0]?.length ?? 0;
  const mMax = m - 1;
  const nMax = n - 1;

  const dp = Array(m);

  return 0;
};

export default Puzzle.create({
  prepare: (content: string) => parseGrid(Str.lines(content)),
  easy: countVisibleTrees,
  hard: maxScenicScore,
});
