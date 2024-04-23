import { Audio } from './Audio.js';

export class AudioAnalyser {
  analyser: AnalyserNode;
  data: Uint8Array;

  constructor(audio: Audio<AudioNode>, fftSize: number = 2048) {
    this.analyser = audio.context.createAnalyser();
    this.analyser.fftSize = fftSize;

    this.data = new Uint8Array(this.analyser.frequencyBinCount);

    audio.getOutput().connect(this.analyser);
  }

  getFrequencyData(): Uint8Array {
    this.analyser.getByteFrequencyData(this.data);

    return this.data;
  }

  getAverageFrequency(): number {
    let value = 0;
    const data = this.getFrequencyData();

    for (let i = 0; i < data.length; i++) {
      value += data[i];
    }

    return value / data.length;
  }
}
