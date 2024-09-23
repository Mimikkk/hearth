export class Clock {
  constructor(
    public previous: number = 0,
    public total: number = 0,
    public delta: number = 0,
  ) {}

  static new() {
    return new Clock();
  }

  tick() {
    const time = performance.now();
    this.delta = (time - this.previous || performance.now()) / 1000;
    this.previous = time;
    this.total += this.delta;
    return this.delta;
  }
}
