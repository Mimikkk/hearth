import { Ids } from "../../types/math/Ids.ts";
import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle, { type Board, Guard, Movement, Tile } from "./day-06.ts";

const countPossibleLoops = (board: Board): number => {
  const start = board.findGuard();
  if (!start) return 0;

  const guard = Guard.from(start);
  const positions = new Set<number>();
  while (board.inBounds(guard.position)) {
    const id = Ids.fromVec2(guard.position);
    positions.add(id);

    Movement.step(guard, board);
  }

  let count = 0;
  for (const id of positions) {
    const guard = Guard.from(start);
    const next = Ids.toVec2(id);

    const previous = board.grid[next.x][next.y];
    board.grid[next.x][next.y] = Tile.Obstacle;

    const visited = new Set<string>();
    while (board.inBounds(guard.position)) {
      const id = guard.position.x + "," + guard.position.y + "," + guard.direction;
      if (visited.has(id)) {
        count++;
        break;
      }
      visited.add(id);

      Movement.step(guard, board);
    }

    board.grid[next.x][next.y] = previous;
  }

  return count;
};

await createPuzzleBench({
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
