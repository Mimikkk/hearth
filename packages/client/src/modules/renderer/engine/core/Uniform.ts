import { Cloneable } from '../traits.js';

export class Uniform<T> {
  constructor(public value: T) {}

  clone(): Uniform<T> {
    return new Uniform(Cloneable.is(this.value) ? this.value.clone() : this.value);
  }
}
