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

  const calcLeftScore = (height: number, i: number, j: number): number => {
    let score = 1;
    let y = j;
    while (--y > 0 && height > grid[i][y]) score += 1;
    return score;
  };

  const calcRightScore = (height: number, i: number, j: number): number => {
    let score = 1;
    let y = j;
    while (++y < mMax && height > grid[i][y]) score += 1;
    return score;
  };

  const calcUpScore = (height: number, i: number, j: number): number => {
    let score = 1;
    let x = i;
    while (--x > 0 && height > grid[x][j]) score += 1;
    return score;
  };

  const calcDownScore = (height: number, i: number, j: number): number => {
    let score = 1;
    let x = i;
    while (++x < nMax && height > grid[x][j]) score += 1;
    return score;
  };

  const calcScore = (height: number, i: number, j: number): number => {
    const left = calcLeftScore(height, i, j);
    const right = calcRightScore(height, i, j);
    const up = calcUpScore(height, i, j);
    const down = calcDownScore(height, i, j);
    return left * right * up * down;
  };

  let maxScore = 0;
  for (let i = 1; i < mMax; ++i) {
    const row = grid[i];
    for (let j = 1; j < nMax; ++j) {
      const height = row[j];
      const score = calcScore(height, i, j);
      if (score > maxScore) maxScore = score;
    }
  }

  return maxScore;
};

export default Puzzle.create({
  prepare: (content: string) => parseGrid(Str.lines(content)),
  easy: countVisibleTrees,
  hard: maxScenicScore,
});
