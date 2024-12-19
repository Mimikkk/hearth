import { Ids } from "../../types/math/Ids.ts";
import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

enum Tile {
  Wall = "#",
  Obstacle = "O",
  Player = "@",
}

enum Direction {
  Up = "^",
  Down = "v",
  Left = "<",
  Right = ">",
}

namespace Direction {
  export const orthogonals: Record<Direction, Vec2> = {
    [Direction.Up]: Vec2.new(-1, 0),
    [Direction.Down]: Vec2.new(1, 0),
    [Direction.Left]: Vec2.new(0, -1),
    [Direction.Right]: Vec2.new(0, 1),
  };
}

interface InputResult {
  board: string[][];
  moves: Direction[];
}

interface PuzzleInput {
  obstacles: Vec2[][];
  walls: Vec2[];
  player: Vec2;
  moves: Direction[];
}

export const parseInput = (content: string): InputResult => {
  const lines = Str.lines(content);
  let line: string | undefined;
  let i = 0;

  const board: Tile[][] = [];
  while (line = lines[i++]) board.push(line.split("") as Tile[]);

  const moves: Direction[] = [];
  while (line = lines[i++]) moves.push(...line.split("") as Direction[]);

  return { board, moves };
};

export const parseNarrow = ({ board, moves }: InputResult): PuzzleInput => {
  let player!: Vec2;
  const walls = [];
  const obstacles: Vec2[][] = [];

  const n = board.length;
  const m = board[0].length;
  for (let i = 0; i < n; ++i) {
    for (let j = 0; j < m; ++j) {
      const tile = board[i][j];

      if (tile === Tile.Wall) {
        walls.push(Vec2.new(i, j));
      } else if (tile === Tile.Obstacle) {
        obstacles.push([Vec2.new(i, j)]);
      } else if (tile === Tile.Player) {
        player = Vec2.new(i, j);
      }
    }
  }

  return { obstacles, walls, player, moves };
};

export const parseWide = ({ board, moves }: InputResult): PuzzleInput => {
  let player!: Vec2;
  const walls: Vec2[] = [];
  const obstacles: Vec2[][] = [];

  const n = board.length;
  const m = board[0].length;
  for (let i = 0; i < n; ++i) {
    for (let j = 0; j < m; ++j) {
      const x = i;
      const y = j * 2;
      const tile = board[i][j];

      if (tile === Tile.Wall) {
        walls.push(Vec2.new(x, y), Vec2.new(x, y + 1));
      } else if (tile === Tile.Obstacle) {
        obstacles.push([Vec2.new(x, y), Vec2.new(x, y + 1)]);
      } else if (tile === Tile.Player) {
        player = Vec2.new(x, y);
      }
    }
  }

  return { obstacles, walls, player, moves };
};

const location = Vec2.new();
export const move = (direction: Direction, player: Vec2, obstacles: Vec2[][], walls: Set<number>): void => {
  const offset = Direction.orthogonals[direction];
  const stack: Vec2[][] = [[player]];

  const moveable: Vec2[][] = [];
  while (stack.length) {
    const colider = stack.pop()!;

    for (let i = 0; i < colider.length; ++i) {
      location.from(colider[i]).add(offset);

      if (walls.has(Ids.v2i32(location))) return;

      const obstacle = obstacles.find((o) =>
        o !== colider &&
        o.some(({ x, y }) => location.x === x && location.y === y)
      );

      if (!obstacle) continue;
      if (stack.includes(obstacle)) continue;

      stack.push(obstacle);
    }

    if (moveable.includes(colider)) continue;
    moveable.push(colider);
  }

  for (let i = 0; i < moveable.length; ++i) {
    const positions = moveable[i];

    for (let j = 0; j < positions.length; ++j) {
      positions[j].add(offset);
    }
  }
};

export const calculateTotalObstanceScoreAfterMoves = ({ obstacles, player, walls, moves }: PuzzleInput): number => {
  const wallsSet = new Set(walls.map(Ids.v2i32));
  for (let i = 0; i < moves.length; ++i) {
    move(moves[i], player, obstacles, wallsSet);
  }

  return obstacles.reduce((score, [{ x, y }]) => score + x * 100 + y, 0);
};

export default Puzzle.new({
  prepare: parseInput,
  easy: {
    prepare: parseNarrow,
    task: calculateTotalObstanceScoreAfterMoves,
  },
  hard: {
    prepare: parseWide,
    task: calculateTotalObstanceScoreAfterMoves,
  },
});
