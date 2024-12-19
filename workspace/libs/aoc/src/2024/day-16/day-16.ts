import { Ids } from "../../types/math/Ids.ts";
import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

enum Tile {
  Start = "S",
  End = "E",
  Empty = ".",
  Wall = "#",
}

const findStart = (maze: Tile[][]): Vec2 => {
  for (let i = 0; i < maze.length; ++i) {
    for (let j = 0; j < maze[i].length; ++j) {
      if (maze[i][j] !== Tile.Start) continue;
      return Vec2.new(i, j);
    }
  }

  throw new Error("Start not found");
};

const parseInput = (content: string): Tile[][] => Str.lines(content).map((line) => line.split("")) as Tile[][];

enum Direction {
  east = "east",
  west = "west",
  north = "north",
  south = "south",
}

namespace Direction {
  export const vecs: Record<Direction, Vec2> = {
    [Direction.east]: Vec2.new(0, 1),
    [Direction.west]: Vec2.new(0, -1),
    [Direction.north]: Vec2.new(-1, 0),
    [Direction.south]: Vec2.new(1, 0),
  };

  export const list: Vec2[] = Object.values(vecs);

  export const countTurns = (from: Vec2, to: Vec2): number => {
    if (from === to) return 0;
    if (from === vecs.east && to === vecs.west) return 2;
    if (from === vecs.west && to === vecs.east) return 2;
    if (from === vecs.north && to === vecs.south) return 2;
    if (from === vecs.south && to === vecs.north) return 2;
    return 1;
  };
}

const findCheapestPath = (maze: Tile[][]): number => {
  const { x, y } = findStart(maze);

  let bestScore = Infinity;
  const queue: [x: number, y: number, score: number, direction: Vec2][] = [[x, y, 0, Direction.vecs.east]];

  const scores = new Map<number, number>();

  while (queue.length) {
    const [x, y, score, directionFrom] = queue.shift()!;

    for (let i = 0; i < Direction.list.length; ++i) {
      const directionTo = Direction.list[i];
      const xdx = x + directionTo.x;
      const ydy = y + directionTo.y;
      const tile = maze[xdx]?.[ydy];

      if (tile === undefined) continue;
      const nextScore = score + Direction.countTurns(directionFrom, directionTo) * 1000 + 1;

      if (tile === Tile.Empty) {
        const id = Ids.xyi32(xdx, ydy);
        const prevScore = scores.get(id) ?? Infinity;
        if (nextScore > prevScore) continue;
        scores.set(id, nextScore);

        queue.push([xdx, ydy, nextScore, directionTo]);
      } else if (tile === Tile.End) {
        if (nextScore > bestScore) continue;
        bestScore = nextScore;
      }
    }
  }

  return bestScore;
};

export default Puzzle.new({
  prepare: parseInput,
  easy: findCheapestPath,
  hard: () => 0,
});
