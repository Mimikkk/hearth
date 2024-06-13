import { Object3D } from '../core/Object3D.js';

export class Bone extends Object3D {
  declare isBone: true;
  declare type: string | 'Bone';
}

Bone.prototype.isBone = true;
Bone.prototype.type = 'Bone';
