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

const findEnd = (maze: Tile[][]): Vec2 => {
  for (let i = 0; i < maze.length; ++i) {
    for (let j = 0; j < maze[i].length; ++j) {
      if (maze[i][j] !== Tile.End) continue;
      return Vec2.new(i, j);
    }
  }

  throw new Error("End not found");
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
  export const toDirection = (direction: Vec2): Direction => {
    if (direction === vecs.east) return Direction.east;
    if (direction === vecs.west) return Direction.west;
    if (direction === vecs.north) return Direction.north;
    if (direction === vecs.south) return Direction.south;
    throw new Error("Invalid direction");
  };

  export const countTurns = (from: Vec2, to: Vec2): number => {
    if (from === to) return 0;
    if (from === vecs.east && to === vecs.west) return 2;
    if (from === vecs.west && to === vecs.east) return 2;
    if (from === vecs.north && to === vecs.south) return 2;
    if (from === vecs.south && to === vecs.north) return 2;
    return 1;
  };
}

const scoreCheapestPath = (maze: Tile[][]): number => {
  const { x, y } = findStart(maze);

  let bestScore = Infinity;
  const queue: [x: number, y: number, score: number, direction: Vec2][] = [[x, y, 0, Direction.vecs.east]];
  const scores = new Map<number, number>();

  while (queue.length) {
    const [x, y, score, from] = queue.shift()!;

    for (const to of Direction.list) {
      const xdx = x + to.x;
      const ydy = y + to.y;
      const tile = maze[xdx]?.[ydy];
      if (tile === undefined) continue;

      const nextScore = score + scoreMove(from, to);

      if (tile === Tile.Empty) {
        const id = Ids.xyi32(xdx, ydy);
        const prevScore = scores.get(id) ?? Infinity;
        if (nextScore > prevScore) continue;
        scores.set(id, nextScore);

        queue.push([xdx, ydy, nextScore, to]);
      } else if (tile === Tile.End) {
        if (nextScore > bestScore) continue;
        bestScore = nextScore;
      }
    }
  }

  return bestScore;
};

const scoreMove = (fromDirection: Vec2, toDirection: Vec2): number =>
  Direction.countTurns(fromDirection, toDirection) * 1000 + 1;

const findAllCheapestPaths = (maze: Tile[][], start: Vec2, end: Vec2): Vec2[][] => {
  const paths: Vec2[][] = [];
  const visited = new Set<number>();
  const scores = new Map<number, number>();
  const location = Vec2.new();

  let bestScore = Infinity;
  const search = (position: Vec2, score: number, path: Vec2[], from: Vec2) => {
    const stateId = Ids.n4i32(position.x, position.y, from.x, from.y);

    const stateScore = scores.get(stateId);
    if (stateScore !== undefined && score > stateScore) return paths;
    scores.set(stateId, score);

    if (position.equals(end)) {
      if (score <= bestScore) {
        if (score < bestScore) {
          bestScore = score;
          paths.length = 0;
        }

        paths.push([...path]);
      }

      return paths;
    }

    const positionId = Ids.v2i32(position);
    visited.add(positionId);

    for (const to of Direction.list) {
      const { x, y } = location.from(position).add(to);

      const tile = maze[x]?.[y];
      if (tile === undefined) continue;
      if (tile === Tile.Wall) continue;

      const nextId = Ids.v2i32(location);
      if (visited.has(nextId)) continue;

      const nextScore = score + scoreMove(from, to);
      if (nextScore > bestScore) continue;

      const next = location.clone();
      path.push(next);
      search(next, nextScore, path, to);
      path.pop();
    }

    visited.delete(positionId);
    return paths;
  };

  return search(start, 0, [start], Direction.vecs.east);
};

const sumCheapestPathsLengths = (maze: Tile[][]): number => {
  const start = findStart(maze);
  const end = findEnd(maze);
  const paths = findAllCheapestPaths(maze, start, end);

  const unique = new Set<number>();
  for (const path of paths) {
    for (const vec of path) {
      unique.add(Ids.v2i32(vec));
    }
  }

  return unique.size;
};

export default Puzzle.new({
  prepare: parseInput,
  easy: scoreCheapestPath,
  hard: sumCheapestPathsLengths,
});
