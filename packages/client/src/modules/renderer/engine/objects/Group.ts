import { Object3D } from '../core/Object3D.js';

export class Group extends Object3D {
  declare isGroup: true;
  declare type: string | 'Group';

  static is(object: any): object is Group {
    return object?.isGroup === true;
  }
}

Group.prototype.isGroup = true;
Group.prototype.type = 'Group';
