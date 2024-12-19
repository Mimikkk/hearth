import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";
import { Board, Tile } from "./classes/entities/Board.ts";
import { Obstacle } from "./classes/entities/Obstacle.ts";
import { Player } from "./classes/entities/Player.ts";
import { Walls } from "./classes/entities/Walls.ts";
import { PuzzleInput } from "./classes/PuzzleInput.ts";
import type { Direction } from "./enums/direction.enum.ts";
import { Movement } from "./logic/movement.ts";
import { Scores } from "./logic/scores.ts";

interface InputResult {
  board: Board;
  moves: Direction[];
}

const parseInput = (content: string): InputResult => {
  const lines = Str.lines(content);
  let line: string | undefined;
  let i = 0;

  const grid: Tile[][] = [];
  while (line = lines[i++]) grid.push(line.split("") as Tile[]);
  const board = Board.fromGrid(grid);

  const moves: Direction[] = [];
  while (line = lines[i++]) moves.push(...line.split("") as Direction[]);

  return { board, moves };
};

const parseNarrow = ({ board, moves }: InputResult): PuzzleInput => {
  let player!: Player;
  const wallPositions: Vec2[] = [];
  const obstacles: Obstacle[] = [];
  for (let i = 0; i < board.n; ++i) {
    for (let j = 0; j < board.m; ++j) {
      const tile = board.getXY(i, j);

      if (tile === Tile.Wall) {
        wallPositions.push(Vec2.new(i, j));
      } else if (tile === Tile.Obstacle) {
        obstacles.push(Obstacle.fromVecs([Vec2.new(i, j)]));
      } else if (tile === Tile.Player) {
        player = Player.fromVec(Vec2.new(i, j));
      }
    }
  }

  const walls = Walls.fromVecs(wallPositions);

  return PuzzleInput.new(obstacles, walls, player, moves);
};

const parseWide = ({ board, moves }: InputResult): PuzzleInput => {
  let player!: Player;
  const wallPositions: Vec2[] = [];
  const obstacles: Obstacle[] = [];

  for (let i = 0; i < board.n; ++i) {
    for (let j = 0; j < board.m; ++j) {
      const x = i;
      const y = j * 2;
      const tile = board.getXY(i, j);

      if (tile === Tile.Wall) {
        wallPositions.push(Vec2.new(x, y), Vec2.new(x, y + 1));
      } else if (tile === Tile.Obstacle) {
        obstacles.push(Obstacle.fromVecs([Vec2.new(x, y), Vec2.new(x, y + 1)]));
      } else if (tile === Tile.Player) {
        player = Player.fromVec(Vec2.new(x, y));
      }
    }
  }

  const walls = Walls.fromVecs(wallPositions);

  return PuzzleInput.new(obstacles, walls, player, moves);
};

const calculateTotalObstanceScoreAfterMoves = ({ obstacles, player, walls, moves }: PuzzleInput): number => {
  for (let i = 0; i < moves.length; ++i) {
    Movement.move(moves[i], player, obstacles, walls);
  }

  return Scores.obstacles(obstacles);
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
