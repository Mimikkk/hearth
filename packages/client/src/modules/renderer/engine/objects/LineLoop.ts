import { Line } from './Line.js';

export class LineLoop extends Line {
  declare isLineLoop: true;
  declare type: string | 'LineLoop';
}

LineLoop.prototype.isLineLoop = true;
LineLoop.prototype.type = 'LineLoop';
