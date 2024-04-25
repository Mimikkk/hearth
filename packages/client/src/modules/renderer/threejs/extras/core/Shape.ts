import { Path } from './Path.js';
import * as MathUtils from '../../math/MathUtils.js';
import type { Vector2 } from '../../math/Vector2.js';

export class Shape extends Path {
  uuid: string;
  holes: Path[];

  constructor(points?: Vector2[]) {
    super(points);

    this.uuid = MathUtils.generateUuid();

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

  copy(source: Shape): this {
    super.copy(source);

    this.holes = [];

    for (let i = 0, l = source.holes.length; i < l; i++) {
      const hole = source.holes[i];

      this.holes.push(hole.clone());
    }

    return this;
  }

  //@ts-expect-error
  override toJSON(): {
    metadata: { version: number };
    uuid: string;
    holes: ReturnType<Path['toJSON']>[];
  } {
    const data = super.toJSON() as unknown as {
      metadata: { version: number };
      uuid: string;
      holes: ReturnType<Path['toJSON']>[];
    };

    data.uuid = this.uuid;
    data.holes = [];

    for (let i = 0, l = this.holes.length; i < l; i++) {
      const hole = this.holes[i];
      data.holes.push(hole.toJSON());
    }

    return data;
  }

  fromJSON(json: { uuid: string; holes: ReturnType<Path['toJSON']>[] }) {
    super.fromJSON(json);

    this.uuid = json.uuid;
    this.holes = [];

    for (let i = 0, l = json.holes.length; i < l; i++) {
      const hole = json.holes[i];
      this.holes.push(new Path().fromJSON(hole));
    }

    return this;
  }
}
