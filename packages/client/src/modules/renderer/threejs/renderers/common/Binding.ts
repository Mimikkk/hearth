export class Binding {
  declare shared: boolean;
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
