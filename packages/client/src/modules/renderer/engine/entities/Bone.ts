import { Entity } from '../core/Entity.js';

export class Bone extends Entity {
  declare isBone: true;
}

Bone.prototype.isBone = true;
