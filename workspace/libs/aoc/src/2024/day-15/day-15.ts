import type { Const } from "../../types/const.ts";
import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

enum Tile {
  Player = "@",
  Obstacle = "O",
  Wall = "#",
  Empty = ".",
}

enum Direction {
  Left = "<",
  Right = ">",
  Up = "^",
  Down = "v",
}

namespace Direction {
  export const opposite = (direction: Direction): Direction => {
    switch (direction) {
      case Direction.Left:
        return Direction.Right;
      case Direction.Right:
        return Direction.Left;
      case Direction.Up:
        return Direction.Down;
      case Direction.Down:
        return Direction.Up;
    }
  };
}

class Board {
  static new(grid: Tile[][] = [], n: number = 0, m: number = 0): Board {
    return new Board(grid, n, m);
  }

  static from(grid: Tile[][], into: Board = Board.new()): Board {
    return into.from(grid);
  }

  private constructor(public grid: Tile[][], public n: number, public m: number) {}

  from(grid: Tile[][]): this {
    this.grid = grid;
    this.n = grid.length;
    this.m = grid[0]?.length ?? 0;
    return this;
  }

  get({ x, y }: Const<Vec2>): Tile {
    return this.getXY(x, y);
  }

  getXY(x: number, y: number): Tile {
    return this.grid[x][y];
  }

  set({ x, y }: Const<Vec2>, tile: Tile): this {
    return this.setXY(x, y, tile);
  }

  setXY(x: number, y: number, tile: Tile): this {
    this.grid[x][y] = tile;
    return this;
  }

  inBounds({ x, y }: Const<Vec2>): boolean {
    return x >= 0 && x < this.n && y >= 0 && y < this.m;
  }

  isWall(position: Const<Vec2>): boolean {
    return !this.inBounds(position) || this.get(position) === Tile.Wall;
  }

  isEmpty(position: Const<Vec2>): boolean {
    return this.get(position) === Tile.Empty;
  }

  isObstacle(position: Const<Vec2>): boolean {
    return this.get(position) === Tile.Obstacle;
  }

  isPlayer(position: Const<Vec2>): boolean {
    return this.get(position) === Tile.Player;
  }

  findPlayer(): Vec2 | undefined {
    const location = Vec2.new();
    for (let i = 0; i < this.n; ++i) {
      for (let j = 0; j < this.m; ++j) {
        if (this.isPlayer(location.fromParams(i, j))) return location;
      }
    }
    return;
  }
}

interface InputResult {
  board: Board;
  moves: Direction[];
}

const parseInput = (content: string): InputResult => {
  const lines = Str.lines(content);

  const grid: Tile[][] = [];

  let i = 1;
  while (true) {
    const line = lines[i++];

    if (!line) break;

    grid.push(line.substring(1, line.length - 1).split("") as Tile[]);
  }
  grid.pop();

  const moves: Direction[] = [];
  while (true) {
    const line = lines[i++];

    if (!line) break;

    moves.push(...line.split("") as Direction[]);
  }

  return { board: Board.from(grid), moves };
};

const moves = {
  [Direction.Left]: Vec2.new(0, -1),
  [Direction.Right]: Vec2.new(0, 1),
  [Direction.Up]: Vec2.new(-1, 0),
  [Direction.Down]: Vec2.new(1, 0),
};

const location = Vec2.new();
const performMove = (player: Vec2, board: Board, move: Direction): void => {
  const direction = moves[move];

  Vec2.add(player, direction, location);
  if (board.isWall(location)) {
    return;
  }

  if (board.isEmpty(location)) {
    board.set(player, Tile.Empty);
    player.from(location);
    board.set(player, Tile.Player);
    return;
  }

  if (board.isObstacle(location)) {
    const last = Vec2.from(location);

    while (true) {
      last.add(direction);
      if (board.isWall(last)) return;
      if (board.isEmpty(last)) break;
    }

    const opposite = Direction.opposite(move);
    const oppositeDirection = moves[opposite];

    const toMove = [];
    while (true) {
      toMove.push(last.clone());
      last.add(oppositeDirection);
      if (board.isPlayer(last)) break;
    }

    for (let i = 0; i < toMove.length - 1; ++i) {
      board.set(toMove[i], Tile.Obstacle);
    }

    player.from(toMove[toMove.length - 1]);
    board.set(player, Tile.Player);
    board.set(last, Tile.Empty);
  }
};

const performMoves = (board: Board, moves: Direction[]): void => {
  const player = board.findPlayer();
  if (!player) return;

  for (let i = 0; i < moves.length; ++i) {
    performMove(player, board, moves[i]);
  }
};

const calculateObstanceScore = (i: number, j: number): number => 100 * (i + 1) + (j + 1);

const calculateTotalObstanceScore = (board: Board): number => {
  let score = 0;

  for (let i = 0; i < board.n; ++i) {
    for (let j = 0; j < board.m; ++j) {
      if (board.getXY(i, j) !== Tile.Obstacle) continue;
      score += calculateObstanceScore(i, j);
    }
  }

  return score;
};

const calculateTotalObstanceScoreAfterMoves = ({ board, moves }: InputResult): number => {
  performMoves(board, moves);
  return calculateTotalObstanceScore(board);
};

export default Puzzle.new({
  prepare: parseInput,
  easy: calculateTotalObstanceScoreAfterMoves,
  hard: () => 0,
});
