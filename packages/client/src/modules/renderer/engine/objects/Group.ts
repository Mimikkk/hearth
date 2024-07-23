import { Entity } from '../core/Entity.js';

export class Group extends Entity {
  declare isGroup: true;
  declare type: string | 'Group';
}
Group.prototype.isGroup = true;
Group.prototype.type = 'Group';
