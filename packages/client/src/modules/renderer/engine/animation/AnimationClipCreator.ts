import {
  AnimationClip,
  BooleanKeyframeTrack,
  Color,
  ColorKeyframeTrack,
  NumberKeyframeTrack,
  Vec3,
  VectorKeyframeTrack,
} from '../engine.js';

export namespace AnimationClipCreator {
  export function CreateRotationAnimation(period: number, axis: 'x' | 'y' | 'z') {
    const times: number[] = [0, period];
    const values: number[] = [0, 360];

    const trackName = '.rotation[' + axis + ']';

    const track = new NumberKeyframeTrack(trackName, times, values);

    return new AnimationClip(null, period, [track]);
  }

  export function CreateScaleAxisAnimation(period: number, axis: 'x' | 'y' | 'z') {
    const times: number[] = [0, period];
    const values: number[] = [0, 1];

    const trackName = '.scale[' + axis + ']';

    const track = new NumberKeyframeTrack(trackName, times, values);

    return new AnimationClip(null, period, [track]);
  }

  export function CreateShakeAnimation(duration: number, shakeScale: Vec3) {
    const times: number[] = [];
    const values: number[] = [];
    const tmp = new Vec3();

    for (let i = 0; i < duration * 10; i++) {
      times.push(i / 10);

      tmp
        .set(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0)
        .multiply(shakeScale)
        .toArray(values, values.length);
    }

    const trackName = '.position';

    const track = new VectorKeyframeTrack(trackName, times, values);

    return new AnimationClip(null, duration, [track]);
  }

  export function CreatePulsationAnimation(duration: number, pulseScale: number) {
    const times: number[] = [];
    const values: number[] = [];
    const tmp = new Vec3();

    for (let i = 0; i < duration * 10; i++) {
      times.push(i / 10);

      const scaleFactor = Math.random() * pulseScale;
      tmp.set(scaleFactor, scaleFactor, scaleFactor).toArray(values, values.length);
    }

    const trackName = '.scale';

    const track = new VectorKeyframeTrack(trackName, times, values);

    return new AnimationClip(null, duration, [track]);
  }

  export function CreateVisibilityAnimation(duration: number) {
    const times: number[] = [0, duration / 2, duration];
    const values: boolean[] = [true, false, true];

    const trackName = '.visible';

    const track = new BooleanKeyframeTrack(trackName, times, values);

    return new AnimationClip(null, duration, [track]);
  }

  export function CreateMaterialColorAnimation(duration: number, colors: Color[]) {
    const times: number[] = [];
    const values: number[] = [];
    const timeStep = duration / colors.length;

    for (let i = 0; i < colors.length; i++) {
      times.push(i * timeStep);

      const color = colors[i];
      values.push(color.r, color.g, color.b);
    }

    const trackName = '.material.color';

    const track = new ColorKeyframeTrack(trackName, times, values);

    return new AnimationClip(null, duration, [track]);
  }
}
