import { QuaternionArray } from '../math/Quaternion.js';
import type { PropertyBinding } from './PropertyBinding.js';
import { NumberArray } from '@modules/renderer/engine/math/MathUtils.js';

export class PropertyMixer {
  cumulativeWeight: number;
  cumulativeWeightAdditive: number;
  useCount: number;
  referenceCount: number;
  buffer: NumberArray;
  valueSize: number;
  _workIndex: number;
  _origIndex: number;
  _addIndex: number;
  _setIdentity: () => void;
  _mixBufferRegion: (buffer: NumberArray, dstOffset: number, srcOffset: number, t: number, stride: number) => void;
  _mixBufferRegionAdditive: (
    buffer: NumberArray,
    dstOffset: number,
    srcOffset: number,
    t: number,
    stride: number,
  ) => void;
  binding: PropertyBinding;

  constructor(binding: PropertyBinding, type: 'quaternion' | 'string' | 'bool' | 'number', span: number) {
    this.binding = binding;
    this.valueSize = span;

    switch (type) {
      case 'quaternion':
        this._mixBufferRegion = this._slerp;
        this._mixBufferRegionAdditive = this._slerpAdditive;
        this._setIdentity = this._setAdditiveIdentityQuaternion;
        this.buffer = new Float64Array(span * 6);
        this._workIndex = 5;
        break;
      case 'string':
      case 'bool':
        this._mixBufferRegion = this._select;
        this._mixBufferRegionAdditive = this._select;
        this._setIdentity = this._setAdditiveIdentityOther;
        this.buffer = new Array(span * 5);
        break;
      default:
        this._mixBufferRegion = this._lerp;
        this._mixBufferRegionAdditive = this._lerpAdditive;
        this._setIdentity = this._setAdditiveIdentityNumeric;
        this.buffer = new Float64Array(span * 5);
    }
    this._origIndex = 3;
    this._addIndex = 4;
    this.cumulativeWeight = 0;
    this.cumulativeWeightAdditive = 0;
    this.useCount = 0;
    this.referenceCount = 0;
  }

  accumulate(accuIndex: number, weight: number): this {
    const buffer = this.buffer;
    const stride = this.valueSize;
    const offset = accuIndex * stride + stride;

    let currentWeight = this.cumulativeWeight;

    if (currentWeight === 0) {
      for (let i = 0; i !== stride; ++i) {
        buffer[offset + i] = buffer[i];
      }

      currentWeight = weight;
    } else {
      currentWeight += weight;
      const mix = weight / currentWeight;
      this._mixBufferRegion(buffer, offset, 0, mix, stride);
    }

    this.cumulativeWeight = currentWeight;

    return this;
  }

  accumulateAdditive(weight: number): this {
    const buffer = this.buffer;
    const stride = this.valueSize;
    const offset = stride * this._addIndex;

    if (this.cumulativeWeightAdditive === 0) {
      this._setIdentity();
    }

    this._mixBufferRegionAdditive(buffer, offset, 0, weight, stride);
    this.cumulativeWeightAdditive += weight;
    return this;
  }

  apply(index: number): this {
    const stride = this.valueSize;
    const buffer = this.buffer;
    const offset = index * stride + stride;
    const weight = this.cumulativeWeight;
    const weightAdditive = this.cumulativeWeightAdditive;
    const binding = this.binding;

    this.cumulativeWeight = 0;
    this.cumulativeWeightAdditive = 0;

    if (weight < 1) {
      const originalValueOffset = stride * this._origIndex;

      this._mixBufferRegion(buffer, offset, originalValueOffset, 1 - weight, stride);
    }

    if (weightAdditive > 0) {
      this._mixBufferRegionAdditive(buffer, offset, this._addIndex * stride, 1, stride);
    }

    for (let i = stride, e = stride + stride; i !== e; ++i) {
      if (buffer[i] !== buffer[i + stride]) {
        binding.setValue(buffer, offset);
        break;
      }
    }
    return this;
  }

  save(): this {
    const binding = this.binding;

    const buffer = this.buffer,
      stride = this.valueSize,
      originalValueOffset = stride * this._origIndex;

    binding.getValue(buffer, originalValueOffset);

    for (let i = stride, e = originalValueOffset; i !== e; ++i) {
      buffer[i] = buffer[originalValueOffset + (i % stride)];
    }

    this._setIdentity();

    this.cumulativeWeight = 0;
    this.cumulativeWeightAdditive = 0;
    return this;
  }

  load(): this {
    const originalValueOffset = this.valueSize * 3;
    this.binding.setValue(this.buffer, originalValueOffset);
    return this;
  }

  _setAdditiveIdentityNumeric(): void {
    const startIndex = this._addIndex * this.valueSize;
    const endIndex = startIndex + this.valueSize;

    for (let i = startIndex; i < endIndex; i++) {
      this.buffer[i] = 0;
    }
  }

  _setAdditiveIdentityQuaternion(): void {
    this._setAdditiveIdentityNumeric();
    this.buffer[this._addIndex * this.valueSize + 3] = 1;
  }

  _setAdditiveIdentityOther(): void {
    const startIndex = this._origIndex * this.valueSize;
    const targetIndex = this._addIndex * this.valueSize;

    for (let i = 0; i < this.valueSize; i++) {
      this.buffer[targetIndex + i] = this.buffer[startIndex + i];
    }
  }

  _select(buffer: NumberArray, to: number, from: number, at: number, stride: number): void {
    if (at < 0.5) return;
    for (let i = 0; i !== stride; ++i) {
      buffer[to + i] = buffer[from + i];
    }
  }

  _slerp(buffer: NumberArray, from: number, to: number, at: number, stride: number): void {
    QuaternionArray.slerp(buffer, from, buffer, from, buffer, to, at);
  }

  _slerpAdditive(buffer: NumberArray, to: number, from: number, at: number, stride: number): void {
    const offset = this._workIndex * stride;
    QuaternionArray.multiply(buffer, offset, buffer, to, buffer, from);
    QuaternionArray.slerp(buffer, to, buffer, to, buffer, offset, at);
  }

  _lerp(buffer: NumberArray, to: number, from: number, at: number, stride: number): void {
    const s = 1 - at;

    for (let i = 0; i !== stride; ++i) {
      const j = to + i;

      buffer[j] = buffer[j] * s + buffer[from + i] * at;
    }
  }

  _lerpAdditive(buffer: NumberArray, to: number, from: number, at: number, stride: number): void {
    for (let i = 0; i !== stride; ++i) {
      const j = to + i;

      buffer[j] = buffer[j] + buffer[from + i] * at;
    }
  }
}
