export class Layers {
  mask: number = 1;

  constructor() {}

  set(channel: number): this {
    this.mask = ((1 << channel) | 0) >>> 0;
    return this;
  }

  enable(channel: number): this {
    this.mask |= (1 << channel) | 0;
    return this;
  }

  enableAll(): this {
    this.mask = 0xffffffff | 0;
    return this;
  }

  toggle(channel: number): this {
    this.mask ^= (1 << channel) | 0;
    return this;
  }

  disable(channel: number): this {
    this.mask &= ~((1 << channel) | 0);
    return this;
  }

  disableAll(): this {
    this.mask = 0;
    return this;
  }

  test(layers: Layers): boolean {
    return (this.mask & layers.mask) !== 0;
  }

  isEnabled(channel: number): boolean {
    return (this.mask & ((1 << channel) | 0)) !== 0;
  }
}
