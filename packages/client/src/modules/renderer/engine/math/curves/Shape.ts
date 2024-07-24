import { Path } from './Path.js';
import type { Vec2 } from '../Vec2.js';
import { v4 } from 'uuid';

export class Shape extends Path {
  uuid: string;
  holes: Path[];

  constructor(points?: Vec2[]) {
    super(points);

    this.uuid = v4();

    this.type = 'Shape';

    this.holes = [];
  }

  getPointsHoles(divisions: number) {
    const holesPts = [];

    for (let i = 0, l = this.holes.length; i < l; i++) {
      holesPts[i] = this.holes[i].getPoints(divisions);
    }

    return holesPts;
  }

  extractPoints(divisions: number) {
    return {
      shape: this.getPoints(divisions),
      holes: this.getPointsHoles(divisions),
    };
  }

  copy(source: this): this {
    super.copy(source);

    this.holes = [];

    for (let i = 0, l = source.holes.length; i < l; i++) {
      const hole = source.holes[i];

      this.holes.push(hole.clone());
    }

    return this;
  }
}
