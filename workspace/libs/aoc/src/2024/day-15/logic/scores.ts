import type { Obstacle } from "../classes/entities/Obstacle.ts";

export namespace Scores {
  export const obstacle = ({ positions: [{ x, y }] }: Obstacle): number => 100 * x + y;

  export const obstacles = (obstacles: Obstacle[]): number => obstacles.reduce((s, o) => s + obstacle(o), 0);
}
