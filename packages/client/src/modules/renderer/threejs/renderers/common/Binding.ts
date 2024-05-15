import { Attribute } from '@modules/renderer/threejs/renderers/common/Attributes.js';

export class Binding {
  declare shared: boolean;
  declare buffer: SharedArrayBuffer | BufferSource;
  visibility: number = 0;

  constructor(public name: string = '') {}

  setVisibility(visibility: number) {
    this.visibility |= visibility;
  }

  clone(): this {
    //@ts-expect-error
    return Object.assign(new this.constructor(), this);
  }
}

export default Binding;
