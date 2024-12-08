import { Ids } from "../../types/math/Ids.ts";
import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

type PositionsMap = Map<string, Vec2[]>;
class Board {
  static new(grid: string[][] = [], n: number = 0, m: number = 0): Board {
    return new Board(grid, n, m);
  }

  static fromGrid(grid: string[][], into: Board = Board.new()): Board {
    return into.fromGrid(grid);
  }

  private constructor(
    public grid: string[][],
    public n: number,
    public m: number,
  ) {}

  fromGrid(grid: string[][]): this {
    this.grid = grid;
    this.n = grid.length;
    this.m = grid[0]?.length ?? 0;
    return this;
  }

  inBounds(x: number, y: number): boolean {
    return x < this.n && y < this.m && x >= 0 && y >= 0;
  }

  findNodePositions(): PositionsMap {
    const { grid, n, m } = this;

    const map: PositionsMap = new Map();

    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < m; ++j) {
        const node = grid[i][j];
        if (node === ".") continue;

        let positions = map.get(node);
        if (positions === undefined) {
          positions = [];

          map.set(node, positions);
        }

        positions.push(Vec2.new(i, j));
      }
    }

    return map;
  }
}

const parseGrid = (content: string): Board => Board.fromGrid(Str.grid(content));

const countAntinodes = (board: Board) => {
  const positionsMap = board.findNodePositions();

  const visited = new Set<number>();
  for (const positions of positionsMap.values()) {
    for (let i = 0; i < positions.length - 1; ++i) {
      const a = positions[i];
      for (let j = i + 1; j < positions.length; ++j) {
        const b = positions[j];

        const dx = a.x - b.x;
        const dy = b.y - a.y;

        const bdx = b.x - dx;
        const bdy = b.y + dy;
        if (board.inBounds(bdx, bdy)) {
          const id = Ids.xyi32(bdx, bdy);
          visited.add(id);
        }

        const adx = a.x + dx;
        const ady = a.y - dy;
        if (board.inBounds(adx, ady)) {
          const id = Ids.xyi32(adx, ady);
          visited.add(id);
        }
      }
    }
  }

  return visited.size;
};

const countInfiniteAntinodes = (board: Board) => {
  const positionsMap = board.findNodePositions();

  const visited = new Set<number>();
  for (const positions of positionsMap.values()) {
    for (let i = 0; i < positions.length - 1; ++i) {
      const { x: ax, y: ay } = positions[i];
      for (let j = i + 1; j < positions.length; ++j) {
        const { x: bx, y: by } = positions[j];

        const dx = ax - bx;
        const dy = by - ay;

        let adx = bx;
        let ady = by;
        do {
          const id = Ids.xyi32(adx, ady);
          visited.add(id);
          adx -= dx;
          ady += dy;
        } while (board.inBounds(adx, ady));

        let bdx = ax;
        let bdy = ay;
        do {
          const id = Ids.xyi32(bdx, bdy);
          visited.add(id);
          bdx += dx;
          bdy -= dy;
        } while (board.inBounds(bdx, bdy));
      }
    }
  }

  return visited.size;
};

export default Puzzle.new({
  prepare: parseGrid,
  easy: countAntinodes,
  hard: countInfiniteAntinodes,
});
