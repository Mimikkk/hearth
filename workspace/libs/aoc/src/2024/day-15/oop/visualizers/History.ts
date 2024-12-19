import type { Const } from "../../../../types/const.ts";
import type { Cloneable } from "../classes/Cloneable.ts";

export class History<T extends Cloneable<T>> {
  static new<T extends Cloneable<T>>(memory: T[] = [], size: number = 0): self<T> {
    return new History(memory, size);
  }

  static from<T extends Cloneable<T>>(history: Const<self<T>>, into = Self.new<T>()): self<T> {
    return into.from(history);
  }

  static fromSize<T extends Cloneable<T>>(size: number, into = Self.new<T>()): self<T> {
    return into.fromSize(size);
  }

  private constructor(public memory: T[], public size: number) {}

  from({ memory, size }: Const<self<T>>): this {
    return this.set(memory.map((m) => m.clone()), size);
  }

  fromSize(size: number): this {
    return this.set([], size);
  }

  set(memory: T[], size: number): this {
    this.memory = memory;
    this.size = size;
    return this;
  }

  push(item: T): this {
    this.memory.push(item.clone());
    if (this.memory.length > this.size) this.memory.shift();
    return this;
  }

  pop(): T | undefined {
    return this.memory.pop();
  }
}

type self<T extends Cloneable<T>> = History<T>;
const Self = History;
