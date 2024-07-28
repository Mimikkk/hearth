import { Entity } from '../core/Entity.js';

export class Bone extends Entity {
  declare isBone: true;
  declare type: string | 'Bone';
}

Bone.prototype.isBone = true;
Bone.prototype.type = 'Bone';
