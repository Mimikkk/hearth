import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

enum Tile {
  Start = "S",
  End = "E",
}

interface Input {
  heights: Board;
  terrain: string[][];
  starts: Vec2[];
  destination: Vec2;
}

const parseInput = (content: string): Input => {
  const terrain = Str.grid(content);
  const n = terrain.length;
  const m = terrain[0]?.length ?? 0;

  const starts = [];
  const destination = Vec2.new();
  const heights = Array(n);
  for (let i = 0; i < n; ++i) {
    const row = terrain[i];

    const height = Array(m);
    heights[i] = height;

    for (let j = 0; j < m; ++j) {
      const tile = row[j];

      if (tile === Tile.Start) {
        starts.push(Vec2.new(i, j));
        height[j] = 0;
      } else if (tile === Tile.End) {
        destination.set(i, j);

        height[j] = 26;
      } else {
        if (tile === "a") {
          starts.push(Vec2.new(i, j));
        }
        height[j] = tile.charCodeAt(0) - 97;
      }
    }
  }

  return { starts, destination, heights: Board.new(heights), terrain };
};

class Board {
  static new(grid: number[][]): Board {
    return new Board(grid, grid.length, grid[0]?.length ?? 0);
  }

  private constructor(
    public grid: number[][],
    public n: number,
    public m: number,
  ) {}

  at(x: number, y: number): number {
    return this.grid[x][y];
  }

  inBounds(x: number, y: number): boolean {
    return x < this.n && y < this.m && x >= 0 && y >= 0;
  }
}

const neighbours = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];
const findShortestPathLength = ({ starts: [from], destination: to, heights }: Input): number => {
  const stack: [x: number, y: number, length: number][] = [[from.x, from.y, 0]];

  const visited = new Set<string>();

  let shortest = Infinity;
  while (stack.length) {
    const [x, y, length] = stack.shift()!;
    const heightFrom = heights.at(x, y);

    if (x === to.x && y === to.y) {
      if (length < shortest) {
        shortest = length;
      }
    }

    for (let i = 0; i < neighbours.length; ++i) {
      const [dx, dy] = neighbours[i];

      const xdx = x + dx;
      const ydy = y + dy;

      const id = xdx + "," + ydy + ":" + i;
      if (visited.has(id)) continue;
      visited.add(id);

      if (!heights.inBounds(xdx, ydy)) continue;

      const heightTo = heights.at(xdx, ydy);
      if (heightTo - heightFrom > 1) continue;

      stack.push([xdx, ydy, length + 1]);
    }
  }

  return shortest;
};
const findShortestPathLengthMS = ({ starts, destination, heights }: Input): number => {
  const stack: [x: number, y: number, length: number][] = starts.map(({ x, y }) => [x, y, 0]);

  const visited = new Set<string>();

  let shortest = Infinity;
  while (stack.length) {
    const [x, y, length] = stack.shift()!;
    const heightFrom = heights.at(x, y);

    if (x === destination.x && y === destination.y) {
      if (length < shortest) {
        shortest = length;
      }
    }

    for (let i = 0; i < neighbours.length; ++i) {
      const [dx, dy] = neighbours[i];

      const xdx = x + dx;
      const ydy = y + dy;

      const id = xdx + "," + ydy + ":" + i;
      if (visited.has(id)) continue;
      visited.add(id);

      if (!heights.inBounds(xdx, ydy)) continue;

      const heightTo = heights.at(xdx, ydy);
      if (heightTo - heightFrom > 1) continue;

      stack.push([xdx, ydy, length + 1]);
    }
  }

  return shortest;
};

export default Puzzle.new({
  prepare: parseInput,
  easy: findShortestPathLength,
  hard: findShortestPathLengthMS,
});
