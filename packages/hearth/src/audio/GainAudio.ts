import { Audio } from './Audio.js';

export class GainAudio extends Audio<GainNode> {
  override getOutput(): GainNode {
    return this.gain;
  }
}
