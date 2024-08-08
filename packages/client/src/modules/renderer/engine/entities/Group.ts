import { Entity } from '../core/Entity.js';

export class Group extends Entity {
  declare isGroup: true;
}

Group.prototype.isGroup = true;
