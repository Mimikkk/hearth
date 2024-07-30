import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

export abstract class HearthComponent {
  protected constructor(public hearth: Hearth) {}
}
