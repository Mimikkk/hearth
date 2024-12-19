import { Vec2 } from "../../../../types/math/Vec2.ts";
import type { VecsColider } from "../classes/coliders/VecsColider.ts";
import type { Obstacle } from "../classes/entities/Obstacle.ts";
import type { Player } from "../classes/entities/Player.ts";
import type { Walls } from "../classes/entities/Walls.ts";
import { Direction } from "../enums/direction.enum.ts";

export namespace Movement {
  const location = Vec2.new();
  export const move = (direction: Direction, player: Player, obstacles: Obstacle[], walls: Walls): void => {
    const offset = Direction.orthogonals[direction];
    const stack = [player.colider];

    const moveable: VecsColider[] = [];
    while (stack.length) {
      const colider = stack.pop()!;
      const { vecs } = colider;

      for (let i = 0; i < vecs.length; ++i) {
        location.from(vecs[i]).add(offset);

        if (walls.colider.containsVec(location)) return;

        const obstacle = obstacles.find((o) =>
          o.colider !== colider &&
          o.colider.containsVec(location)
        );

        if (!obstacle) continue;
        if (stack.includes(obstacle.colider)) continue;

        stack.push(obstacle.colider);
      }

      if (moveable.includes(colider)) continue;
      moveable.push(colider);
    }

    for (let i = 0; i < moveable.length; ++i) {
      const { vecs } = moveable[i];

      for (let j = 0; j < vecs.length; ++j) {
        vecs[j].add(offset);
      }
    }
  };
}
