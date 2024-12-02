import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

enum Direction {
  Up = "U",
  Down = "D",
  Left = "L",
  Right = "R",
}
type Move = [direction: Direction, count: number];

const parseMoves = (content: string): Move[] =>
  Str.lines(content).map((line) => {
    const [direction, count] = line.split(" ");
    return [direction, +count] as Move;
  });

class Knot {
  static new(location: Vec2 = Vec2.new()): Knot {
    return new Knot(location);
  }
  private constructor(public location: Vec2) {}

  move(direction: Direction): this {
    switch (direction) {
      case Direction.Up:
        this.location.addY(1);
        break;
      case Direction.Down:
        this.location.addY(-1);
        break;
      case Direction.Left:
        this.location.addX(-1);
        break;
      case Direction.Right:
        this.location.addX(1);
        break;
    }
    return this;
  }

  follow(head: Knot): this {
    const dx = head.location.x - this.location.x;
    const dy = head.location.y - this.location.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 1) {
      this.location.addXY(Math.sign(dx), Math.sign(dy));
    }
    return this;
  }

  id(): number {
    return ((this.location.x & 0xFFFF) << 16) | (this.location.y & 0xFFFF);
  }
}

class Rope {
  static new(knots: Knot[] = []): Rope {
    return new Rope(knots);
  }

  static fromSize(size: number, into: Rope = Rope.new()): Rope {
    return into.fromSize(size);
  }

  fromSize(size: number): this {
    this.knots = Array.from({ length: size }, () => Knot.new());
    return this;
  }

  private constructor(public knots: Knot[]) {
  }

  move(direction: Direction) {
    const { knots } = this;
    const head = knots[0];

    head.move(direction);
    for (let i = 1; i < knots.length; i++) {
      knots[i].follow(knots[i - 1]);
    }
  }

  get tail() {
    return this.knots[this.knots.length - 1];
  }
}

function simulateRope(moves: Move[], size: number) {
  const rope = Rope.fromSize(size);
  const tail = rope.tail;

  const visited = new Set<number>();
  for (let i = 0; i < moves.length; ++i) {
    const [direction, steps] = moves[i];

    for (let step = 0; step < steps; step++) {
      rope.move(direction);
      visited.add(tail.id());
    }
  }

  return visited.size;
}

export default Puzzle.new({
  prepare: parseMoves,
  easy: (moves) => simulateRope(moves, 2),
  hard: (moves) => simulateRope(moves, 10),
});
