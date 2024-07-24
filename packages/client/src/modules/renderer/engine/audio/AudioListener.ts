import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Quaternion } from '../math/Quaternion.js';
import { Clock } from '../core/Clock.js';
import { Entity } from '../core/Entity.js';
import { AudioContextManager } from './AudioContextManager.js';

const _position = Vec3.new();
const _quaternion = Quaternion.new();
const _scale = Vec3.new();
const _orientation = Vec3.new();

export class AudioListener extends Entity {
  context: AudioContext;
  gain: GainNode;
  filter: AudioNode | null;
  timeDelta: number;
  _clock: Clock;

  constructor() {
    super();

    this.context = AudioContextManager.get();
    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);

    this.filter = null;
    this.timeDelta = 0;
    this._clock = new Clock();
  }

  getInput() {
    return this.gain;
  }

  removeFilter() {
    if (this.filter !== null) {
      this.gain.disconnect(this.filter);
      this.filter.disconnect(this.context.destination);
      this.gain.connect(this.context.destination);
      this.filter = null;
    }

    return this;
  }

  getFilter(): AudioNode | null {
    return this.filter;
  }

  setFilter(value: AudioNode): this {
    if (this.filter !== null) {
      this.gain.disconnect(this.filter);
      this.filter.disconnect(this.context.destination);
    } else {
      this.gain.disconnect(this.context.destination);
    }

    this.filter = value;
    this.gain.connect(this.filter);
    this.filter.connect(this.context.destination);

    return this;
  }

  getMasterVolume(): number {
    return this.gain.gain.value;
  }

  setMasterVolume(value: number): this {
    this.gain.gain.setTargetAtTime(value, this.context.currentTime, 0.01);

    return this;
  }

  updateMatrixWorld(force?: boolean): this {
    super.updateMatrixWorld(force);

    const listener = this.context.listener;
    const up = this.up;

    this.timeDelta = this._clock.delta();

    this.matrixWorld.decompose(_position, _quaternion, _scale);

    _orientation.set(0, 0, -1).applyQuaternion(_quaternion);

    if (listener.positionX) {
      // code path for Chrome (see #14393)

      const endTime = this.context.currentTime + this.timeDelta;

      listener.positionX.linearRampToValueAtTime(_position.x, endTime);
      listener.positionY.linearRampToValueAtTime(_position.y, endTime);
      listener.positionZ.linearRampToValueAtTime(_position.z, endTime);
      listener.forwardX.linearRampToValueAtTime(_orientation.x, endTime);
      listener.forwardY.linearRampToValueAtTime(_orientation.y, endTime);
      listener.forwardZ.linearRampToValueAtTime(_orientation.z, endTime);
      listener.upX.linearRampToValueAtTime(up.x, endTime);
      listener.upY.linearRampToValueAtTime(up.y, endTime);
      listener.upZ.linearRampToValueAtTime(up.z, endTime);
    } else {
      listener.setPosition(_position.x, _position.y, _position.z);
      listener.setOrientation(_orientation.x, _orientation.y, _orientation.z, up.x, up.y, up.z);
    }

    return this;
  }
}
