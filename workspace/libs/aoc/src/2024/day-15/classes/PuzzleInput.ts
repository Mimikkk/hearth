import type { Const } from "../../../types/const.ts";
import type { Direction } from "../enums/direction.enum.ts";
import type { Cloneable } from "./Cloneable.ts";
import type { Obstacle } from "./entities/Obstacle.ts";
import { Player } from "./entities/Player.ts";
import { Walls } from "./entities/Walls.ts";

export class PuzzleInput implements Cloneable<self> {
  static new(
    obstacles: Obstacle[] = [],
    walls: Walls = Walls.new(),
    player: Player = Player.new(),
    moves: Direction[] = [],
  ): self {
    return new Self(obstacles, walls, player, moves);
  }

  static from(other: Const<self>, into = Self.new()): self {
    return into.from(other);
  }

  private constructor(
    public obstacles: Obstacle[],
    public walls: Walls,
    public player: Player,
    public moves: Direction[],
  ) {}

  from(other: Const<self>): this {
    this.obstacles = other.obstacles.map((o) => o.clone());
    this.walls.from(other.walls);
    this.player.from(other.player);
    this.moves = other.moves.slice();
    return this;
  }

  set(obstacles: Obstacle[], walls: Walls, player: Player, moves: Direction[]): this {
    this.obstacles = obstacles;
    this.walls = walls;
    this.player = player;
    this.moves = moves;
    return this;
  }

  clone(into = Self.new()): self {
    return into.from(this);
  }
}

type self = PuzzleInput;
const Self = PuzzleInput;
