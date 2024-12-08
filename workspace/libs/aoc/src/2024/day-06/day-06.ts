import type { Const } from "../../types/const.ts";
import { Ids } from "../../types/math/Ids.ts";
import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

export enum Tile {
  GuardStart = "^",
  Obstacle = "#",
  Empty = ".",
}

export enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export namespace Direction {
  export const rightOf = (direction: Direction): Direction => {
    switch (direction) {
      case Direction.Up:
        return Direction.Right;
      case Direction.Down:
        return Direction.Left;
      case Direction.Left:
        return Direction.Up;
      case Direction.Right:
        return Direction.Down;
    }
  };
}

export class Board {
  static new(grid: Tile[][]): Board {
    return new Board(grid, grid.length, grid[0]?.length ?? 0);
  }

  private constructor(
    public readonly grid: Tile[][],
    public readonly n: number,
    public readonly m: number,
  ) {}

  findGuard(): Guard | undefined {
    const { n, m, grid } = this;

    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < m; ++j) {
        if (grid[i][j] === Tile.GuardStart) return Guard.new(Vec2.new(i, j), Direction.Up);
      }
    }
  }

  inBounds({ x, y }: Const<Vec2>): boolean {
    return this.inBoundsXY(x, y);
  }

  inBoundsXY(x: number, y: number): boolean {
    return x < this.n && y < this.m && x >= 0 && y >= 0;
  }

  at({ x, y }: Const<Vec2>): Tile | undefined {
    return this.atXY(x, y);
  }

  atXY(x: number, y: number): Tile | undefined {
    return this.grid[x]?.[y];
  }

  offset({ x, y }: Const<Vec2>, { x: ox, y: oy }: Const<Vec2>): Tile | undefined {
    return this.atXY(x + ox, y + oy);
  }
}

export class Guard {
  static new(position: Vec2 = Vec2.new(), direction: Direction = Direction.Up): Guard {
    return new Guard(position, direction);
  }

  static from(guard: Const<Guard>, into: Guard = Guard.new()): Guard {
    return into.from(guard);
  }

  from({ position, direction }: Const<Guard>): this {
    this.position.from(position);
    this.direction = direction;
    return this;
  }

  private constructor(public readonly position: Vec2, public direction: Direction) {}

  setDirection(direction: Direction): this {
    this.direction = direction;
    return this;
  }

  static equals(first: Const<Guard>, second: Const<Guard>): boolean {
    return first.equals(second);
  }

  equals({ position, direction }: Const<Guard>): boolean {
    return this.position.equals(position) && this.direction === direction;
  }
}

export namespace Movement {
  export const steps: Record<Direction, Vec2> = {
    [Direction.Up]: Vec2.new(-1, 0),
    [Direction.Down]: Vec2.new(1, 0),
    [Direction.Right]: Vec2.new(0, 1),
    [Direction.Left]: Vec2.new(0, -1),
  };

  export const step = (guard: Guard, board: Board): void => {
    const { direction, position } = guard;

    const step = steps[direction];
    if (board.offset(position, step) === Tile.Obstacle) {
      guard.direction = Direction.rightOf(direction);
    } else {
      position.add(step);
    }
  };

  export const isLoop = (start: Guard, { x, y }: Vec2, board: Board) => {
    const previous = board.grid[x][y];
    board.grid[x][y] = Tile.Obstacle;

    const slow = Guard.from(start);
    const fast = Guard.from(start);

    while (true) {
      Movement.step(slow, board);
      Movement.step(fast, board);

      if (!board.inBounds(fast.position)) break;

      Movement.step(fast, board);
      if (!board.inBounds(fast.position)) break;

      if (fast.equals(slow)) {
        board.grid[x][y] = previous;
        return true;
      }
    }

    board.grid[x][y] = previous;
    return false;
  };
}

const parseBoard = (content: string): Board => Board.new(Str.lines(content).map((line) => line.split("")) as Tile[][]);

const countStepsTillOutOfBounds = (board: Board): number => {
  const guard = board.findGuard();
  if (!guard) return 0;

  const visited = new Set<number>();
  while (board.inBounds(guard.position)) {
    const id = Ids.v2i32(guard.position);
    visited.add(id);

    Movement.step(guard, board);
  }

  return visited.size;
};

const countPossibleLoops = (board: Board): number => {
  const start = board.findGuard();
  if (!start) return 0;

  const guard = Guard.from(start);
  const positions = new Set<number>();
  while (board.inBounds(guard.position)) {
    const id = Ids.v2i32(guard.position);

    if (!positions.has(id) && Movement.isLoop(start, guard.position, board)) {
      positions.add(id);
    }

    Movement.step(guard, board);
  }

  return positions.size;
};

export default Puzzle.new({
  prepare: parseBoard,
  easy: countStepsTillOutOfBounds,
  hard: countPossibleLoops,
});
