import { colors } from "jsr:@cliffy/ansi@1.0.0-rc.7/colors";

export type Mark = string | ((value: string) => string);
export type Marker = [x: number, y: number, mark: Mark] | [x: number, y: number];
const isMarker = (value: Marker | Marker[]): value is Marker => typeof value[0] === "number";

export class GridVisualizer<T> {
  static create<T>(grid: T[][]): GridVisualizer<T> {
    return new this(grid, grid.map((r) => r.map((c) => `${c}`)));
  }

  constructor(
    public original: T[][],
    public grid: string[][],
    public m: number = grid.length,
    public n: number = grid[0]?.length ?? 0,
  ) {}

  #at(x: number, y: number): string {
    return colors.stripAnsiCode(this.grid[x][y]);
  }

  #highlight(marker: Marker): this;
  #highlight(x: number, y: number, mark?: Mark): this;
  #highlight(x: number | Marker, y?: number, mark: Mark = colors.brightYellow): this {
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

  add(marker: Marker): this;
  add(markers: Marker | Marker[]): this;
  add(x: number, y: number, mark?: Mark): this;
  add(value: number | Marker | Marker[], y?: number, mark?: Mark): this {
    if (typeof value === "number") {
      return this.#highlight(value, y!, mark);
    }

    if (isMarker(value)) return this.#highlight(value);

    for (let i = 0; i < value.length; ++i) {
      this.#highlight(value[i]);
    }

    return this;
  }

  log() {
    const pad = "-".repeat(colors.stripAnsiCode(this.grid[0].join("")).length);
    const rows = this.grid.map((r) => r.join(""));
    const result = pad + "\n" + rows.join("\n") + "\n" + pad;

    console.log(result);
  }
}
