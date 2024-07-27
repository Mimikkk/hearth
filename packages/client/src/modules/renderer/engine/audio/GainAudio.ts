import { Audio } from '@modules/renderer/engine/audio/Audio.js';

export class GainAudio extends Audio<GainNode> {
  override getOutput(): GainNode {
    return this.gain;
  }
}
