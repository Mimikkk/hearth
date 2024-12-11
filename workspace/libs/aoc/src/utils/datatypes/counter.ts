export class Counter<T> {
  static new<T>(map: Map<T, number> = new Map()): self<T> {
    return new Self(map);
  }

  static fromArray<T>(values: T[], into: self<T> = Self.new()): self<T> {
    return into.fromArray(values);
  }

  static from<T>(counter: self<T>, into: self<T> = Self.new()): self<T> {
    return into.from(counter);
  }

  private constructor(private map: Map<T, number>) {}

  from(counter: self<T>): this {
    this.map = new Map(counter.map);
    return this;
  }

  fromArray(values: T[]): this {
    for (let i = 0; i < values.length; ++i) {
      this.add(values[i], 1);
    }
    return this;
  }

  get(key: T): number {
    return this.map.get(key) ?? 0;
  }

  add(key: T, value: number): this {
    this.map.set(key, this.get(key) + value);
    return this;
  }

  entries(): IterableIterator<[T, number]> {
    return this.map.entries();
  }

  values(): IterableIterator<number> {
    return this.map.values();
  }

  keys(): IterableIterator<T> {
    return this.map.keys();
  }

  delete(key: T): void {
    this.map.delete(key);
  }

  count(): number {
    let total = 0;
    for (const count of this.values()) {
      total += count;
    }
    return total;
  }

  size(): number {
    return this.map.size;
  }
}

type self<T> = Counter<T>;
const Self = Counter;
