import { colors } from "jsr:@cliffy/ansi@1.0.0-rc.7/colors";
import { Const } from "../types/const.ts";

export type Mark = string | ((value: string) => string);
export type Marker = [x: number, y: number, mark: Mark] | [x: number, y: number];
const isMarker = (value: Const<Marker> | Const<Marker[]>): value is Marker => typeof value[0] === "number";

export class GridVisualizer<T> {
  static new<T>(
    grid: string[][] = [],
    on: boolean = true,
    header: string = "",
    footer: string = "",
  ): self<T> {
    return new Self(grid, on, header, footer);
  }

  static from<T>(visualizer: self<T>, into: self<T> = Self.new<T>()): self<T> {
    return into.from(visualizer);
  }

  static fromBounds<T>(x: number, y: number, into: self<T> = Self.new<T>()): self<T> {
    return into.fromBounds(x, y);
  }

  static fromGrid<T>(grid: T[][], into: self<T> = Self.new<T>()): self<T> {
    return into.fromGrid(grid);
  }

  private constructor(
    public grid: string[][],
    public on: boolean,
    public header: string,
    public footer: string,
  ) {}

  get m(): number {
    return this.grid.length;
  }

  get n(): number {
    return this.grid[0]?.length ?? 0;
  }

  from(visualizer: self<T>): this {
    this.grid = structuredClone(visualizer.grid);
    this.on = visualizer.on;
    this.header = visualizer.header;
    this.footer = visualizer.footer;
    return this;
  }

  fromBounds(x: number, y: number): this {
    return this.fromGrid(Array.from({ length: x }, () => Array(y).fill(" ")));
  }

  fromGrid(grid: T[][]): this {
    this.grid = grid.map((r) => r.map((c) => `${c}`));
    return this;
  }

  toggle(on?: boolean): this {
    this.on = on ?? !this.on;
    return this;
  }

  #at(x: number, y: number): string {
    return colors.stripAnsiCode(this.grid[x][y]);
  }

  #highlight(marker: Const<Marker>): this;
  #highlight(x: number, y: number, mark?: Mark): this;
  #highlight(x: number | Const<Marker>, y?: number, mark: Mark = colors.brightYellow): this {
    if (typeof x === "number") {
      const value = this.#at(x, y!);
      this.grid[x][y!] = typeof mark === "function" ? mark(value) : mark;
      return this;
    }

    return this.#highlight(x[0], x[1], x[2]);
  }

  edge(mark: Mark = colors.brightBlack) {
    for (let i = 0; i < this.n; ++i) {
      this.#highlight(0, i, mark);
      this.#highlight(this.m - 1, i, mark);
    }

    for (let i = 0; i < this.m; ++i) {
      this.#highlight(i, 0, mark);
      this.#highlight(i, this.n - 1, mark);
    }

    return this;
  }

  fill(mark: Mark = colors.brightBlack) {
    for (let i = 0; i < this.m; ++i) {
      for (let j = 0; j < this.n; ++j) {
        this.#highlight(i, j, mark);
      }
    }
    return this;
  }

  add(marker: Const<Marker>): this;
  add(markers: Const<Marker[]>): this;
  add(x: number, y: number, mark?: Mark): this;
  add(value: number | Const<Marker> | Const<Marker[]>, y?: number, mark?: Mark): this {
    if (typeof value === "number") {
      return this.#highlight(value, y!, mark);
    }

    if (isMarker(value)) return this.#highlight(value);

    for (let i = 0; i < value.length; ++i) {
      this.#highlight(value[i] as Marker);
    }

    return this;
  }

  remove(marker: Const<Marker>): this;
  remove(markers: Const<Marker[]>): this;
  remove(x: number, y: number): this;
  remove(value: number | Const<Marker> | Const<Marker[]>, y?: number): this {
    if (typeof value === "number") {
      this.grid[value][y!] = colors.stripAnsiCode(this.grid[value][y!]);
      return this;
    }

    if (isMarker(value)) {
      return this.remove(value[0], value[1]);
    }

    for (let i = 0; i < value.length; ++i) {
      this.remove(value[i] as Marker);
    }

    return this;
  }

  setHeader(header: string): this {
    this.header = header;
    return this;
  }

  clearHeader() {
    return this.setHeader("");
  }

  setFooter(footer: string): this {
    this.footer = footer;
    return this;
  }

  clearFooter(): this {
    return this.setFooter("");
  }

  str(): string {
    const pad = colors.brightBlack("-".repeat(colors.stripAnsiCode(this.grid[0].join("")).length));
    const rows = this.grid.map((r) => r.join(""));
    const result = [];

    result.push(pad);
    if (this.header) result.push(this.header);
    result.push(...rows);
    if (this.footer) result.push(this.footer);
    result.push(pad);

    return result.join("\n");
  }

  log(): this {
    if (!this.on) return this;
    console.info(this.str());
    return this;
  }
}

type self<T> = GridVisualizer<T>;
const Self = GridVisualizer;
