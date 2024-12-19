import { Vec2 } from "../../../types/math/Vec2.ts";

export enum Direction {
  Left = "<",
  Right = ">",
  Up = "^",
  Down = "v",
}

export namespace Direction {
  const inverted = Object.fromEntries(Object.entries(Direction).map(([key, value]) => [value, key]));
  export const toString = (direction: Direction): string => inverted[direction];

  export const opposite = (direction: Direction): Direction => {
    switch (direction) {
      case Direction.Left:
        return Direction.Right;
      case Direction.Right:
        return Direction.Left;
      case Direction.Up:
        return Direction.Down;
      case Direction.Down:
        return Direction.Up;
    }
  };

  export const orthogonals: Record<Direction, Vec2> = {
    [Direction.Left]: Vec2.new(0, -1),
    [Direction.Right]: Vec2.new(0, 1),
    [Direction.Up]: Vec2.new(-1, 0),
    [Direction.Down]: Vec2.new(1, 0),
  };
}
