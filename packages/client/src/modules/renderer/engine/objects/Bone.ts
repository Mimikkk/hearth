import { Object3D } from '../core/Object3D.js';

export class Bone extends Object3D {
  declare isBone: true;
  declare type: string | 'Bone';

  static is(object: any): object is Bone {
    return object?.isBone === true;
  }
}

Bone.prototype.isBone = true;
Bone.prototype.type = 'Bone';
