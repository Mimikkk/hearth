import { AnimationBlendMode } from '../constants.js';
import { KeyframeTrack } from './KeyframeTrack.js';
import { v4 } from 'uuid';

export class AnimationClip {
  name: string;
  tracks: KeyframeTrack[];
  duration: number;
  blendMode: AnimationBlendMode;
  uuid: string;

  constructor(
    name: string,
    duration: number = -1,
    tracks: KeyframeTrack[],
    blendMode: AnimationBlendMode = AnimationBlendMode.Normal,
  ) {
    this.name = name;
    this.tracks = tracks;
    this.duration = duration;
    this.blendMode = blendMode;

    this.uuid = v4();

    // this means it should figure out its duration by scanning the tracks
    if (this.duration < 0) this.resetDuration();
  }

  resetDuration() {
    const tracks = this.tracks;
    let duration = 0;

    for (let i = 0, n = tracks.length; i !== n; ++i) {
      const track = this.tracks[i];

      duration = Math.max(duration, track.times[track.times.length - 1]);
    }

    this.duration = duration;

    return this;
  }

  trim(): this {
    for (let i = 0; i < this.tracks.length; i++) {
      this.tracks[i].trim(0, this.duration);
    }

    return this;
  }

  validate(): boolean {
    let valid = true;

    for (let i = 0; i < this.tracks.length; i++) {
      valid = valid && this.tracks[i].validate();
    }

    return valid;
  }

  optimize(): this {
    for (let i = 0; i < this.tracks.length; i++) {
      this.tracks[i].optimize();
    }

    return this;
  }

  clone(): AnimationClip {
    return new AnimationClip(
      this.name,
      this.duration,
      this.tracks.map(track => track.clone()),
      this.blendMode,
    );
  }
}
