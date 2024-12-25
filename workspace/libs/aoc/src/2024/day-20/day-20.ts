import { Ids } from "../../types/math/Ids.ts";
import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { TileMap } from "../../utils/datatypes/tilemap.ts";
import { Str } from "../../utils/strs.ts";

enum Tile {
  Track = ".",
  Wall = "#",
  Start = "S",
  End = "E",
}

interface PuzzleInput {
  tilemap: TileMap<Tile>;
  start: Vec2;
  end: Vec2;
}

const parseInput = (content: string): PuzzleInput => {
  const tilemap = TileMap.fromGrid<Tile>(Str.lines(content).map((line) => line.split("")) as Tile[][]);

  const start = tilemap.find(Tile.Start);
  if (!start) throw new Error("Start not found");

  const end = tilemap.find(Tile.End);
  if (!end) throw new Error("End not found");

  return { tilemap, start, end };
};

const neighbours = [
  Vec2.new(0, 1),
  Vec2.new(0, -1),
  Vec2.new(1, 0),
  Vec2.new(-1, 0),
];

const findShortestPath = ({ tilemap, start, end }: PuzzleInput): Vec2[] | undefined => {
  const queue: [position: Vec2, path: Vec2[]][] = [[start, [start]]];
  const visited = new Set<number>();

  while (queue.length) {
    const [position, path] = queue.pop()!;

    if (position.x === end.x && position.y === end.y) {
      return path;
    }

    for (const neighbour of neighbours) {
      const xdx = position.x + neighbour.x;
      const ydy = position.y + neighbour.y;
      if (!tilemap.inBounds(xdx, ydy)) continue;

      if (tilemap.is(xdx, ydy, Tile.Wall)) continue;

      const id = Ids.xyi32(xdx, ydy);
      if (visited.has(id)) continue;
      visited.add(id);

      const next = Vec2.new(xdx, ydy);
      queue.push([next, [...path, next]]);
    }
  }

  return;
};

const countCheatAdvantagesOver = (input: PuzzleInput, duration: number, over: number): number => {
  const path = findShortestPath(input);
  if (!path) return 0;

  let count = 0;
  for (let i = 0; i < path.length; ++i) {
    for (let j = i + 1; j < path.length; ++j) {
      const distance = path[i].manhattan(path[j]);
      const saved = j - i - distance;

      if (distance > duration || saved < over) continue;

      count += 1;
    }
  }

  return count;
};

export default Puzzle.new({
  prepare: parseInput,
  easy: (input) => countCheatAdvantagesOver(input, 2, 100),
  hard: (input) => countCheatAdvantagesOver(input, 20, 100),
});
