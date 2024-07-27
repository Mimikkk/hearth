import { InterpolationMode } from '../constants.js';
import { CubicInterpolant } from '../math/interpolants/CubicInterpolant.js';
import { LinearInterpolant } from '../math/interpolants/LinearInterpolant.js';
import { DiscreteInterpolant } from '../math/interpolants/DiscreteInterpolant.js';
import * as AnimationUtils from './AnimationUtils.js';
import { NumberArrayConstructor, TypedArray } from '../math/MathUtils.js';
import { Interpolant } from '../math/interpolants/Interpolant.js';

export class KeyframeTrack<T extends TypedArray = Float32Array, V extends TypedArray = Float32Array> {
  declare ['constructor']: typeof KeyframeTrack;
  declare DefaultInterpolation: InterpolationMode;
  declare TimeBufferType: NumberArrayConstructor;
  declare ValueBufferType: NumberArrayConstructor;
  declare ValueTypeName: string;
  times: T;
  values: V;
  createInterpolant: (result: V) => Interpolant<T, V>;

  constructor(
    public name: string,
    times: T,
    values: V,
    interpolation?: InterpolationMode,
  ) {
    if (name === undefined) throw new Error('engine.KeyframeTrack: track name is undefined');
    if (times === undefined || times.length === 0)
      throw new Error('engine.KeyframeTrack: no keyframes in track named ' + name);

    this.times = AnimationUtils.convertArray(times, this.TimeBufferType);
    this.values = AnimationUtils.convertArray(values, this.ValueBufferType);

    this.setInterpolation(interpolation || this.DefaultInterpolation);
  }

  InterpolantFactoryMethodDiscrete(result: V): DiscreteInterpolant<T, V> {
    return new DiscreteInterpolant(this.times, this.values, this.getValueSize(), result);
  }

  InterpolantFactoryMethodLinear(result: V): LinearInterpolant<T, V> {
    return new LinearInterpolant(this.times, this.values, this.getValueSize(), result);
  }

  InterpolantFactoryMethodSmooth(result: V): CubicInterpolant<T, V> {
    return new CubicInterpolant(this.times, this.values, this.getValueSize(), result);
  }

  setInterpolation(interpolation: InterpolationMode): this {
    let factoryMethod;

    switch (interpolation) {
      case InterpolationMode.Discrete:
        factoryMethod = this.InterpolantFactoryMethodDiscrete;

        break;

      case InterpolationMode.Linear:
        factoryMethod = this.InterpolantFactoryMethodLinear;

        break;

      case InterpolationMode.Smooth:
        factoryMethod = this.InterpolantFactoryMethodSmooth;

        break;
    }

    if (factoryMethod === undefined) {
      const message = 'unsupported interpolation for ' + this.ValueTypeName + ' keyframe track named ' + this.name;

      if (this.createInterpolant === undefined) {
        if (interpolation !== this.DefaultInterpolation) {
          this.setInterpolation(this.DefaultInterpolation);
        } else {
          throw new Error(message);
        }
      }

      console.warn('engine.KeyframeTrack:', message);
      return this;
    }

    this.createInterpolant = factoryMethod;

    return this;
  }

  getInterpolation(): InterpolationMode {
    switch (this.createInterpolant) {
      case this.InterpolantFactoryMethodDiscrete:
        return InterpolationMode.Discrete;
      case this.InterpolantFactoryMethodLinear:
        return InterpolationMode.Linear;
      case this.InterpolantFactoryMethodSmooth:
        return InterpolationMode.Smooth;
      default:
        throw new Error('engine.KeyframeTrack: Unknown interpolation.');
    }
  }

  getValueSize(): number {
    return this.values.length / this.times.length;
  }

  shift(timeOffset: number): this {
    if (timeOffset !== 0.0) {
      const times = this.times;

      for (let i = 0, n = times.length; i !== n; ++i) {
        times[i] += timeOffset;
      }
    }

    return this;
  }

  scale(timeScale: number): this {
    if (timeScale !== 1.0) {
      const times = this.times;

      for (let i = 0, n = times.length; i !== n; ++i) {
        times[i] *= timeScale;
      }
    }

    return this;
  }

  trim(startTime: number, endTime: number): this {
    const times = this.times,
      nKeys = times.length;

    let from = 0,
      to = nKeys - 1;

    while (from !== nKeys && times[from] < startTime) {
      ++from;
    }

    while (to !== -1 && times[to] > endTime) {
      --to;
    }

    ++to;

    if (from !== 0 || to !== nKeys) {
      if (from >= to) {
        to = Math.max(to, 1);
        from = to - 1;
      }

      const stride = this.getValueSize();
      this.times = times.slice(from, to) as T;
      this.values = this.values.slice(from * stride, to * stride) as V;
    }

    return this;
  }

  validate(): boolean {
    let valid = true;

    const valueSize = this.getValueSize();
    if (valueSize - Math.floor(valueSize) !== 0) {
      console.error('engine.KeyframeTrack: Invalid value size in track.', this);
      valid = false;
    }

    const times = this.times,
      values = this.values,
      nKeys = times.length;

    if (nKeys === 0) {
      console.error('engine.KeyframeTrack: Track is empty.', this);
      valid = false;
    }

    let prevTime = null;

    for (let i = 0; i !== nKeys; i++) {
      const currTime = times[i];

      if (typeof currTime === 'number' && isNaN(currTime)) {
        console.error('engine.KeyframeTrack: Time is not a valid number.', this, i, currTime);
        valid = false;
        break;
      }

      if (prevTime !== null && prevTime > currTime) {
        console.error('engine.KeyframeTrack: Out of order keys.', this, i, currTime, prevTime);
        valid = false;
        break;
      }

      prevTime = currTime;
    }

    if (values !== undefined) {
      if (AnimationUtils.isTypedArray(values)) {
        for (let i = 0, n = values.length; i !== n; ++i) {
          const value = values[i];

          if (isNaN(value)) {
            console.error('engine.KeyframeTrack: Value is not a valid number.', this, i, value);
            valid = false;
            break;
          }
        }
      }
    }

    return valid;
  }

  optimize(): this {
    const times = this.times.slice(),
      values = this.values.slice(),
      stride = this.getValueSize(),
      smoothInterpolation = this.getInterpolation() === InterpolationMode.Smooth,
      lastIndex = times.length - 1;

    let writeIndex = 1;

    for (let i = 1; i < lastIndex; ++i) {
      let keep = false;

      const time = times[i];
      const timeNext = times[i + 1];

      if (time !== timeNext && (i !== 1 || time !== times[0])) {
        if (!smoothInterpolation) {
          const offset = i * stride,
            offsetP = offset - stride,
            offsetN = offset + stride;

          for (let j = 0; j !== stride; ++j) {
            const value = values[offset + j];

            if (value !== values[offsetP + j] || value !== values[offsetN + j]) {
              keep = true;
              break;
            }
          }
        } else {
          keep = true;
        }
      }

      if (keep) {
        if (i !== writeIndex) {
          times[writeIndex] = times[i];

          const readOffset = i * stride,
            writeOffset = writeIndex * stride;

          for (let j = 0; j !== stride; ++j) {
            values[writeOffset + j] = values[readOffset + j];
          }
        }

        ++writeIndex;
      }
    }

    if (lastIndex > 0) {
      times[writeIndex] = times[lastIndex];

      for (let readOffset = lastIndex * stride, writeOffset = writeIndex * stride, j = 0; j !== stride; ++j) {
        values[writeOffset + j] = values[readOffset + j];
      }

      ++writeIndex;
    }

    if (writeIndex !== times.length) {
      this.times = times.slice(0, writeIndex) as T;
      this.values = values.slice(0, writeIndex * stride) as V;
    } else {
      this.times = times as T;
      this.values = values as V;
    }

    return this;
  }

  clone(): this {
    const times = this.times.slice() as T;
    const values = this.values.slice() as V;

    const track = new this.constructor(this.name, times, values, this.getInterpolation());

    track.createInterpolant = this.createInterpolant;

    return track as this;
  }
}

KeyframeTrack.prototype.TimeBufferType = Float32Array;
KeyframeTrack.prototype.ValueBufferType = Float32Array;
KeyframeTrack.prototype.DefaultInterpolation = InterpolationMode.Linear;
