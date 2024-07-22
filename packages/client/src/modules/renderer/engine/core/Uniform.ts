interface Cloneable<T> {
  clone(): T;
}

namespace Cloneable {
  export const is = <T>(value: T): value is T & Cloneable<T> =>
    typeof value === 'object' && value !== null && 'clone' in value;
}

export class Uniform<T> {
  constructor(public value: T) {}

  clone(): Uniform<T> {
    return new Uniform(Cloneable.is(this.value) ? this.value.clone() : this.value);
  }
}
