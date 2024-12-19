import type { Const } from "../../../../../types/const.ts";
import type { Vec2 } from "../../../../../types/math/Vec2.ts";

export enum Tile {
  Player = "@",
  Obstacle = "O",
  Wall = "#",
  Empty = ".",
}

export class Board {
  static new(grid: Tile[][] = [], n: number = 0, m: number = 0): self {
    return new Self(grid, n, m);
  }

  static from(other: Const<self>, into = Self.new()): self {
    return into.from(other);
  }

  static fromGrid(grid: Tile[][], into = Self.new()): self {
    return into.fromGrid(grid);
  }

  private constructor(public grid: Tile[][], public n: number, public m: number) {}

  from(other: Const<self>): this {
    return this.fromGrid(other.grid.map((row) => row.slice()));
  }

  fromGrid(grid: Tile[][]): this {
    return this.set(grid, grid.length, grid[0]?.length ?? 0);
  }

  set(grid: Tile[][], n: number, m: number): this {
    this.grid = grid;
    this.n = n;
    this.m = m;
    return this;
  }

  get({ x, y }: Const<Vec2>): Tile | undefined {
    return this.getXY(x, y);
  }

  getXY(x: number, y: number): Tile | undefined {
    return this.grid[x][y];
  }
}

type self = Board;
const Self = Board;
