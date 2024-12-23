import { Ids } from "../../types/math/Ids.ts";
import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

enum Tile {
  Safe = ".",
  Corrupted = "#",
}

interface PuzzleInput {
  corruptions: [i: number, j: number][];
  memory: Tile[][];
  start: Vec2;
  end: Vec2;
  n: number;
  m: number;
}

const parseInput = (content: string): PuzzleInput => {
  const corruptions = Str.lines(content).map((line) => line.split(",").map(Number)) as [
    number,
    number,
  ][];

  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;

  for (const [x, y] of corruptions) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const n = maxX - minX + 1;
  const m = maxY - minY + 1;

  const memory = Array.from({ length: m }, () => Array.from({ length: n }, () => Tile.Safe));

  for (let i = 0; i < corruptions.length; i++) {
    const [x, y] = corruptions[i];
    memory[y][x] = Tile.Corrupted;
  }

  const start = Vec2.new(minX, minY);
  const end = Vec2.new(maxX, maxY);

  return { corruptions, memory, start, end, n, m };
};

const neighbours = [
  Vec2.new(0, 1),
  Vec2.new(0, -1),
  Vec2.new(1, 0),
  Vec2.new(-1, 0),
];

const countSteps = ({ memory, start, end, n, m }: PuzzleInput): number => {
  const inBounds = (x: number, y: number) => x >= 0 && x < n && y >= 0 && y < m;

  const queue: [x: number, y: number, steps: number][] = [[start.x, start.y, 0]];
  const visited = new Set<number>();

  while (queue.length) {
    const [x, y, steps] = queue.shift()!;

    if (x === end.x && y === end.y) return steps;

    for (let i = 0; i < neighbours.length; i++) {
      const neighbour = neighbours[i];
      const xdx = x + neighbour.x;
      const ydy = y + neighbour.y;

      if (!inBounds(xdx, ydy)) continue;
      if (memory[xdx][ydy] === Tile.Corrupted) continue;

      const id = Ids.xyi32(xdx, ydy);
      if (visited.has(id)) continue;
      visited.add(id);

      queue.push([xdx, ydy, steps + 1]);
    }
  }
  return Infinity;
};

const findFirstBlockage = (input: PuzzleInput): string | undefined => {
  const { corruptions, n, m } = input;

  input.memory = Array.from({ length: m }, () => Array.from({ length: n }, () => Tile.Safe));

  for (let i = 0; i < corruptions.length; i++) {
    const [x, y] = corruptions[i];
    input.memory[y][x] = Tile.Corrupted;

    if (countSteps(input) === Infinity) return [x, y].join(",");
  }

  return;
};

export default Puzzle.new({
  prepare: parseInput,
  easy: countSteps,
  hard: findFirstBlockage,
});
