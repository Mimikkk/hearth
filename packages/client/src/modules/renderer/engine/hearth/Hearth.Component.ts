import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

export abstract class HearthComponent {
  constructor(public hearth: Hearth) {}
}
