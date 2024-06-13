import { Object3D } from '../core/Object3D.js';
import type { AudioListener } from './AudioListener.js';

class Audio extends Object3D {
  listener: AudioListener;
  context: AudioContext;
  gain: GainNode;
  autoplay: boolean;
  buffer: AudioBuffer | null;
  detune: number;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  offset: number;
  duration: number | undefined;
  playbackRate: number;
  isPlaying: boolean;
  hasPlaybackControl: boolean;
  source: AudioBufferSourceNode | MediaElementAudioSourceNode | MediaStreamAudioSourceNode | AudioNode | null;
  sourceType: 'empty' | 'audioNode' | 'mediaNode' | 'mediaStreamNode' | 'buffer';
  _startedAt: number;
  _progress: number;
  _connected: boolean;
  filters: AudioNode[];

  constructor(listener: AudioListener) {
    super();

    this.type = 'Audio';

    this.listener = listener;
    this.context = listener.context;

    this.gain = this.context.createGain();
    this.gain.connect(listener.getInput());

    this.autoplay = false;

    this.buffer = null;
    this.detune = 0;
    this.loop = false;
    this.loopStart = 0;
    this.loopEnd = 0;
    this.offset = 0;
    this.duration = undefined;
    this.playbackRate = 1;
    this.isPlaying = false;
    this.hasPlaybackControl = true;
    this.source = null;
    this.sourceType = 'empty';

    this._startedAt = 0;
    this._progress = 0;
    this._connected = false;

    this.filters = [];
  }

  getOutput(): GainNode {
    return this.gain;
  }

  setNodeSource(audioNode: AudioScheduledSourceNode): this {
    this.hasPlaybackControl = false;
    this.sourceType = 'audioNode';
    this.source = audioNode;
    this.connect();

    return this;
  }

  setMediaElementSource(mediaElement: HTMLMediaElement): this {
    this.hasPlaybackControl = false;
    this.sourceType = 'mediaNode';
    this.source = this.context.createMediaElementSource(mediaElement);
    this.connect();

    return this;
  }

  setMediaStreamSource(mediaStream: MediaStream): this {
    this.hasPlaybackControl = false;
    this.sourceType = 'mediaStreamNode';
    this.source = this.context.createMediaStreamSource(mediaStream);
    this.connect();

    return this;
  }

  setBuffer(audioBuffer: AudioBuffer): this {
    this.buffer = audioBuffer;
    this.sourceType = 'buffer';

    if (this.autoplay) this.play();

    return this;
  }

  play(delay: number = 0): this {
    if (this.isPlaying === true) {
      console.warn('engine.Audio: Audio is already playing.');
      return this;
    }

    if (this.hasPlaybackControl === false) {
      console.warn('engine.Audio: this Audio has no playback control.');
      return this;
    }

    this._startedAt = this.context.currentTime + delay;

    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.loop = this.loop;
    source.loopStart = this.loopStart;
    source.loopEnd = this.loopEnd;
    source.onended = this.onEnded.bind(this);
    source.start(this._startedAt, this._progress + this.offset, this.duration);

    this.isPlaying = true;

    this.source = source;

    this.setDetune(this.detune);
    this.setPlaybackRate(this.playbackRate);

    return this.connect();
  }

  pause(): this {
    if (this.hasPlaybackControl === false) {
      console.warn('engine.Audio: this Audio has no playback control.');
      return this;
    }

    if (this.isPlaying === true) {
      // update current progress

      this._progress += Math.max(this.context.currentTime - this._startedAt, 0) * this.playbackRate;

      if (this.loop === true) {
        // ensure _progress does not exceed duration with looped audios

        this._progress = this._progress % (this.duration || this.buffer!.duration);
      }

      //@ts-expect-error
      this.source.stop();
      //@ts-expect-error
      this.source.onended = null;

      this.isPlaying = false;
    }

    return this;
  }

  stop(): this {
    if (this.hasPlaybackControl === false) {
      console.warn('engine.Audio: this Audio has no playback control.');
      return this;
    }

    this._progress = 0;

    if (this.source !== null) {
      //@ts-expect-error
      this.source.stop();
      //@ts-expect-error
      this.source.onended = null;
    }

    this.isPlaying = false;

    return this;
  }

  connect(): this {
    if (this.filters.length > 0) {
      //@ts-expect-error
      this.source.connect(this.filters[0]);

      for (let i = 1, l = this.filters.length; i < l; i++) {
        this.filters[i - 1].connect(this.filters[i]);
      }

      this.filters[this.filters.length - 1].connect(this.getOutput());
    } else {
      //@ts-expect-error
      this.source.connect(this.getOutput());
    }

    this._connected = true;

    return this;
  }

  disconnect(): this {
    if (this._connected === false) {
      return this;
    }

    if (this.filters.length > 0) {
      //@ts-expect-error
      this.source.disconnect(this.filters[0]);

      for (let i = 1, l = this.filters.length; i < l; i++) {
        this.filters[i - 1].disconnect(this.filters[i]);
      }

      this.filters[this.filters.length - 1].disconnect(this.getOutput());
    } else {
      //@ts-expect-error
      this.source.disconnect(this.getOutput());
    }

    this._connected = false;

    return this;
  }

  getFilters(): AudioNode[] {
    return this.filters;
  }

  setFilters(value: AudioNode[]): this {
    if (!value) value = [];

    if (this._connected === true) {
      this.disconnect();
      this.filters = value.slice();
      this.connect();
    } else {
      this.filters = value.slice();
    }

    return this;
  }

  setDetune(value: number): this {
    this.detune = value;

    //@ts-expect-error
    if (this.isPlaying === true && this.source.detune !== undefined) {
      //@ts-expect-error
      this.source.detune.setTargetAtTime(this.detune, this.context.currentTime, 0.01);
    }

    return this;
  }

  getDetune(): number {
    return this.detune;
  }

  getFilter(): AudioNode {
    return this.getFilters()[0];
  }

  setFilter(filter: AudioNode): this {
    return this.setFilters(filter ? [filter] : []);
  }

  setPlaybackRate(value: number): this {
    if (this.hasPlaybackControl === false) {
      console.warn('engine.Audio: this Audio has no playback control.');
      return this;
    }

    this.playbackRate = value;

    if (this.isPlaying === true) {
      //@ts-expect-error
      this.source.playbackRate.setTargetAtTime(this.playbackRate, this.context.currentTime, 0.01);
    }

    return this;
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  onEnded(): void {
    this.isPlaying = false;
  }

  getLoop(): boolean {
    if (this.hasPlaybackControl === false) {
      console.warn('engine.Audio: this Audio has no playback control.');
      return false;
    }

    return this.loop;
  }

  setLoop(value: boolean): this {
    if (this.hasPlaybackControl === false) {
      console.warn('engine.Audio: this Audio has no playback control.');
      return this;
    }

    this.loop = value;

    if (this.isPlaying === true) {
      //@ts-expect-error
      this.source.loop = this.loop;
    }

    return this;
  }

  setLoopStart(value: number): this {
    this.loopStart = value;

    return this;
  }

  setLoopEnd(value: number): this {
    this.loopEnd = value;

    return this;
  }

  getVolume(): number {
    return this.gain.gain.value;
  }

  setVolume(value: number): this {
    this.gain.gain.setTargetAtTime(value, this.context.currentTime, 0.01);

    return this;
  }
}

export { Audio };
