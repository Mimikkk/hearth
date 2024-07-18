import { Line } from './Line.js';

export class LineLoop extends Line {
  declare isLineLoop: true;
  declare type: string | 'LineLoop';

  static is(object: any): object is LineLoop {
    return object?.isLineLoop === true;
  }
}

LineLoop.prototype.isLineLoop = true;
LineLoop.prototype.type = 'LineLoop';
