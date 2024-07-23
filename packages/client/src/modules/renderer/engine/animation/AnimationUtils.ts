import { Quaternion, QuaternionArray } from '../math/Quaternion.js';
import { AnimationBlendMode } from '../constants.js';
import { ArrayMap, NumberArray, TypedArray, TypedArrayConstructor } from '@modules/renderer/engine/math/MathUtils.js';
import { AnimationClip } from '@modules/renderer/engine/animation/AnimationClip.js';

export const convertArray = <R extends TypedArrayConstructor>(array: NumberArray, type: R): ArrayMap<R> =>
  ('BYTES_PER_ELEMENT' in type ? new type(array) : Array.from(array)) as ArrayMap<R>;

export const isTypedArray = (object: any): object is TypedArray =>
  ArrayBuffer.isView(object) && !(object instanceof DataView);

// returns an array by which times and values can be sorted
export function getKeyframeOrder(times: number[]): number[] {
  const n = times.length;

  const result = new Array(n);
  for (let i = 0; i !== n; ++i) result[i] = i;

  return result.sort((i, j) => times[i] - times[j]);
}

// uses the array previously returned by 'getKeyframeOrder' to sort data
export function sortedArray(values: number[], stride: number, order: number[]) {
  const nValues = values.length;
  //@ts-expect-error
  const result = new values.constructor(nValues);

  for (let i = 0, dstOffset = 0; dstOffset !== nValues; ++i) {
    const srcOffset = order[i] * stride;

    for (let j = 0; j !== stride; ++j) {
      result[dstOffset++] = values[srcOffset + j];
    }
  }

  return result;
}

// function for parsing AOS keyframe formats
export function flattenJSON(jsonKeys: string[], times: number[], values: number[], valuePropertyName: string) {
  let i = 1,
    key = jsonKeys[0];

  //@ts-expect-error
  while (key !== undefined && key[valuePropertyName] === undefined) {
    key = jsonKeys[i++];
  }
  if (key === undefined) return; // no data

  //@ts-expect-error
  let value = key[valuePropertyName];
  if (value === undefined) return; // no data

  if (Array.isArray(value)) {
    do {
      //@ts-expect-error
      value = key[valuePropertyName];

      if (value !== undefined) {
        //@ts-expect-error
        times.push(key.time);
        values.push.apply(values, value); // push all elements
      }

      key = jsonKeys[i++];
    } while (key !== undefined);
  } else if (value.intoArray !== undefined) {
    // ...assume engine.Math-ish

    do {
      //@ts-expect-error
      value = key[valuePropertyName];

      if (value !== undefined) {
        //@ts-expect-error
        times.push(key.time);
        value.intoArray(values, values.length);
      }

      key = jsonKeys[i++];
    } while (key !== undefined);
  } else {
    // otherwise push as-is

    do {
      //@ts-expect-error
      value = key[valuePropertyName];

      if (value !== undefined) {
        //@ts-expect-error
        times.push(key.time);
        values.push(value);
      }

      key = jsonKeys[i++];
    } while (key !== undefined);
  }
}

export function subclip(sourceClip: AnimationClip, name: string, startFrame: number, endFrame: number, fps: number) {
  const clip = sourceClip.clone();

  clip.name = name;

  const tracks = [];

  for (let i = 0; i < clip.tracks.length; ++i) {
    const track = clip.tracks[i];
    const valueSize = track.getValueSize();

    const times = [];
    const values = [];

    for (let j = 0; j < track.times.length; ++j) {
      const frame = track.times[j] * fps;

      if (frame < startFrame || frame >= endFrame) continue;

      times.push(track.times[j]);

      for (let k = 0; k < valueSize; ++k) {
        values.push(track.values[j * valueSize + k]);
      }
    }

    if (times.length === 0) continue;

    //@ts-expect-error
    track.times = convertArray(times, track.times.constructor);
    //@ts-expect-error
    track.values = convertArray(values, track.values.constructor);

    tracks.push(track);
  }

  clip.tracks = tracks;

  // find minimum .times value across all tracks in the trimmed clip

  let minStartTime = Infinity;

  for (let i = 0; i < clip.tracks.length; ++i) {
    if (minStartTime > clip.tracks[i].times[0]) {
      minStartTime = clip.tracks[i].times[0];
    }
  }

  // shift all tracks such that clip begins at t=0

  for (let i = 0; i < clip.tracks.length; ++i) {
    clip.tracks[i].shift(-1 * minStartTime);
  }

  clip.resetDuration();

  return clip;
}

export function makeClipAdditive(
  targetClip: AnimationClip,
  fps: number,
  referenceFrame: number = 0,
  referenceClip: AnimationClip = targetClip,
) {
  const numTracks = referenceClip.tracks.length;
  const referenceTime = referenceFrame / fps;

  for (let i = 0; i < numTracks; ++i) {
    const referenceTrack = referenceClip.tracks[i];
    const referenceTrackType = referenceTrack.ValueTypeName;

    // Skip this track if it's non-numeric
    if (referenceTrackType === 'bool' || referenceTrackType === 'string') continue;

    // Find the track in the target clip whose name and type matches the reference track
    const targetTrack = targetClip.tracks.find(function (track) {
      return track.name === referenceTrack.name && track.ValueTypeName === referenceTrackType;
    });

    if (targetTrack === undefined) continue;

    let referenceOffset = 0;
    const referenceValueSize = referenceTrack.getValueSize();

    if (referenceTrack.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline) {
      referenceOffset = referenceValueSize / 3;
    }

    let targetOffset = 0;
    const targetValueSize = targetTrack.getValueSize();

    if (targetTrack.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline) {
      targetOffset = targetValueSize / 3;
    }

    const lastIndex = referenceTrack.times.length - 1;
    let referenceValue;

    // Find the value to subtract out of the track
    if (referenceTime <= referenceTrack.times[0]) {
      // Reference frame is earlier than the first keyframe, so just use the first keyframe
      const startIndex = referenceOffset;
      const endIndex = referenceValueSize - referenceOffset;
      referenceValue = referenceTrack.values.slice(startIndex, endIndex);
    } else if (referenceTime >= referenceTrack.times[lastIndex]) {
      // Reference frame is after the last keyframe, so just use the last keyframe
      const startIndex = lastIndex * referenceValueSize + referenceOffset;
      const endIndex = startIndex + referenceValueSize - referenceOffset;
      referenceValue = referenceTrack.values.slice(startIndex, endIndex);
    } else {
      // Interpolate to the reference value
      const interpolant = referenceTrack.createInterpolant();
      const startIndex = referenceOffset;
      const endIndex = referenceValueSize - referenceOffset;
      interpolant.evaluate(referenceTime);
      referenceValue = interpolant.resultBuffer.slice(startIndex, endIndex);
    }

    // Conjugate the quaternion
    if (referenceTrackType === 'quaternion') {
      const referenceQuat = Quaternion.fromArray(referenceValue).normalize().conjugate();
      referenceQuat.intoArray(referenceValue);
    }

    // Subtract the reference value from all of the track values

    const numTimes = targetTrack.times.length;
    for (let j = 0; j < numTimes; ++j) {
      const valueStart = j * targetValueSize + targetOffset;

      if (referenceTrackType === 'quaternion') {
        // Multiply the conjugate for quaternion track types
        QuaternionArray.multiply(targetTrack.values, valueStart, referenceValue, 0, targetTrack.values, valueStart);
      } else {
        const valueEnd = targetValueSize - targetOffset * 2;

        // Subtract each value for all other numeric track types
        for (let k = 0; k < valueEnd; ++k) {
          targetTrack.values[valueStart + k] -= referenceValue[k];
        }
      }
    }
  }

  targetClip.blendMode = AnimationBlendMode.Additive;

  return targetClip;
}
