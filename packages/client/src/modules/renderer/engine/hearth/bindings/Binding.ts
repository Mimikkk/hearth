import { TypedArray } from '@modules/renderer/engine/math/MathUtils.js';

export class Binding {
  declare shared: boolean;
  declare buffer: TypedArray;
  visibility: number = 0;

  constructor(public name: string) {}

  setVisibility(visibility: number) {
    this.visibility |= visibility;
  }

  clone(): this {
    return Object.assign(new this.constructor(), this);
  }
}

export default Binding;
