import type { Const } from "../../types/const.ts";
import { Ids } from "../../types/math/Ids.ts";
import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { Counter } from "../../utils/datatypes/counter.ts";
import { Str } from "../../utils/strs.ts";

class Robot {
  static new(position: Vec2 = Vec2.new(), velocity: Vec2 = Vec2.new()): Robot {
    return new Robot(position, velocity);
  }

  static fromParams(px: number, py: number, vx: number, vy: number, into: Robot = Robot.new()): Robot {
    return into.fromParams(px, py, vx, vy);
  }

  private constructor(
    public position: Vec2,
    public velocity: Vec2,
  ) {}

  fromParams(px: number, py: number, vx: number, vy: number) {
    this.position.x = px;
    this.position.y = py;
    this.velocity.x = vx;
    this.velocity.y = vy;
    return this;
  }
}

class Board {
  static new(n: number, m: number): Board {
    return new Board(n, m);
  }

  static fromVec2(vec2: Const<Vec2>, into: Board = Board.new(0, 0)): Board {
    return into.fromVec2(vec2);
  }

  private constructor(
    public n: number,
    public m: number,
  ) {}

  fromVec2(vec2: Const<Vec2>): this {
    this.n = vec2.x;
    this.m = vec2.y;
    return this;
  }

  isInBounds(position: Const<Vec2>): boolean {
    return position.x >= 0 && position.x < this.n && position.y >= 0 && position.y < this.m;
  }
}

interface InputResult {
  robots: Robot[];
  board: Board;
}

const parseInput = (content: string): InputResult => {
  const robots = Str.lines(content).map((line) => {
    const [px, py, vx, vy] = line.match(/(-?\d+)/g)!.map(Number);

    return Robot.fromParams(px, py, vx, vy);
  });

  const max = Vec2.new(0, 0);
  for (let i = 0; i < robots.length; ++i) {
    max.max(robots[i].position);
  }
  const board = Board.fromVec2(max.addXY(1, 1));

  return { robots, board };
};

const simulateRound = ({ robots, board }: InputResult) => {
  for (let j = 0; j < robots.length; ++j) {
    const { position, velocity } = robots[j];

    position.add(velocity).addXY(board.n, board.m).modXY(board.n, board.m);
  }
};

const simulateRounds = (input: InputResult, rounds: number) => {
  for (let i = 0; i < rounds; ++i) {
    simulateRound(input);
  }
};

const calcSafetyFactor = (input: InputResult, rounds: number) => {
  simulateRounds(input, rounds);

  let topLeft = 0;
  let topRight = 0;
  let bottomLeft = 0;
  let bottomRight = 0;

  for (let i = 0; i < input.robots.length; ++i) {
    const { position: { x, y } } = input.robots[i];

    const middleX = Math.floor(input.board.n / 2);
    const middleY = Math.floor(input.board.m / 2);

    if (x === middleX || y === middleY) continue;

    if (x < middleX && y < middleY) {
      ++topLeft;
    } else if (x < middleX && y > middleY) {
      ++topRight;
    } else if (x > middleX && y < middleY) {
      ++bottomLeft;
    } else if (x > middleX && y > middleY) {
      ++bottomRight;
    }
  }

  return topLeft * topRight * bottomLeft * bottomRight;
};

const isPattern = ({ robots, board }: InputResult): boolean => {
  const counter = Counter.fromArray(robots.map((r) => r.position).map(Ids.v2i32));

  const nMax = board.n;
  const mMax = board.m;
  for (let i = 1; i < nMax; ++i) {
    for (let j = 0; j < mMax; ++j) {
      if (counter.get(Ids.xyi32(i, j)) === 0) continue;

      let patternRowLength = 1;
      let nextJ = j;

      while (++nextJ < mMax && patternRowLength < 8) {
        if (counter.get(Ids.xyi32(i, nextJ)) === 0) break;
        ++patternRowLength;
      }

      if (patternRowLength >= 8) return true;

      let patternColLength = 1;
      let nextI = i;
      while (++nextI < nMax && patternColLength < 8) {
        if (counter.get(Ids.xyi32(nextI, j)) === 0) break;
        ++patternColLength;
      }

      if (patternColLength >= 8) return true;
    }
  }

  return false;
};

const findChristmassTree = (input: InputResult, rounds: number): number | undefined => {
  for (let round = 0; round < rounds; ++round) {
    simulateRound(input);
    if (isPattern(input)) return round;
  }
  return;
};

export default Puzzle.new({
  prepare: parseInput,
  easy: (input) => calcSafetyFactor(input, 100),
  hard: (input) => findChristmassTree(input, 100000),
});
