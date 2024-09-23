import { QuaternionArray } from '../math/Quaternion.js';
import type { IPropertyBinding } from './PropertyBinding.js';
import type { NumberArray } from '../math/MathUtils.js';

export class PropertyMixer {
  cumulativeWeight: number;
  cumulativeWeightAdditive: number;
  useCount: number;
  referenceCount: number;
  buffer: NumberArray;
  stride: number;
  _workIndex: number;
  _origIndex: number;
  _addIndex: number;
  binding: IPropertyBinding;
  mix: (buffer: NumberArray, to: number, from: number, at: number, stride: number) => void;
  clear: () => void;
  mixAdditive: (buffer: NumberArray, to: number, from: number, at: number, stride: number) => void;

  constructor(binding: IPropertyBinding, type: 'quaternion' | 'string' | 'bool' | 'vector', stride: number) {
    this.binding = binding;
    this.stride = stride;

    switch (type) {
      case 'quaternion':
        this.mix = this.#slerp;
        this.mixAdditive = this.#slerpAdditive;
        this.clear = this.#clearQuaternion;
        this.buffer = new Float64Array(stride * 6);
        this._workIndex = 5;
        break;
      case 'string':
      case 'bool':
        this.mix = this.#select;
        this.mixAdditive = this.#select;
        this.clear = this.#clearOther;
        this.buffer = new Array(stride * 5);
        break;
      default:
        this.mix = this.#lerp;
        this.mixAdditive = this.#lerpAdditive;
        this.clear = this.#clearNumeric;
        this.buffer = new Float64Array(stride * 5);
    }
    this._origIndex = 3;
    this._addIndex = 4;
    this.cumulativeWeight = 0;
    this.cumulativeWeightAdditive = 0;
    this.useCount = 0;
    this.referenceCount = 0;
  }

  apply(index: number): this {
    const stride = this.stride;
    const buffer = this.buffer;
    const offset = index * stride + stride;
    const weight = this.cumulativeWeight;
    const weightAdditive = this.cumulativeWeightAdditive;
    const binding = this.binding;

    this.cumulativeWeight = 0;
    this.cumulativeWeightAdditive = 0;

    if (weight < 1) {
      const originalValueOffset = stride * this._origIndex;

      this.mix(buffer, offset, originalValueOffset, 1 - weight, stride);
    }

    if (weightAdditive > 0) {
      this.mixAdditive(buffer, offset, this._addIndex * stride, 1, stride);
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
      stride = this.stride,
      originalValueOffset = stride * this._origIndex;

    binding.getValue(buffer, originalValueOffset);

    for (let i = stride, e = originalValueOffset; i !== e; ++i) {
      buffer[i] = buffer[originalValueOffset + (i % stride)];
    }

    this.clear();

    this.cumulativeWeight = 0;
    this.cumulativeWeightAdditive = 0;
    return this;
  }

  load(): this {
    const originalValueOffset = this.stride * 3;
    this.binding.setValue(this.buffer, originalValueOffset);
    return this;
  }

  accumulate(index: number, weight: number): this {
    const buffer = this.buffer;
    const stride = this.stride;
    const offset = index * stride + stride;

    let currentWeight = this.cumulativeWeight;
    if (currentWeight === 0) {
      for (let i = 0; i !== stride; ++i) {
        buffer[offset + i] = buffer[i];
      }

      currentWeight = weight;
    } else {
      currentWeight += weight;
      const mix = weight / currentWeight;
      this.mix(buffer, offset, 0, mix, stride);
    }

    this.cumulativeWeight = currentWeight;

    return this;
  }

  accumulateAdditive(weight: number): this {
    const buffer = this.buffer;
    const stride = this.stride;
    const offset = stride * this._addIndex;

    if (this.cumulativeWeightAdditive === 0) {
      this.clear();
    }

    this.mixAdditive(buffer, offset, 0, weight, stride);
    this.cumulativeWeightAdditive += weight;
    return this;
  }

  #clearQuaternion(): void {
    this.#clearNumeric();
    this.buffer[this._addIndex * this.stride + 3] = 1;
  }

  #clearNumeric(): void {
    const startIndex = this._addIndex * this.stride;
    const endIndex = startIndex + this.stride;

    for (let i = startIndex; i < endIndex; i++) {
      this.buffer[i] = 0;
    }
  }

  #clearOther(): void {
    const startIndex = this._origIndex * this.stride;
    const targetIndex = this._addIndex * this.stride;

    for (let i = 0; i < this.stride; i++) {
      this.buffer[targetIndex + i] = this.buffer[startIndex + i];
    }
  }

  #select(buffer: NumberArray, to: number, from: number, at: number, stride: number): void {
    if (at < 0.5) return;
    for (let i = 0; i !== stride; ++i) {
      buffer[to + i] = buffer[from + i];
    }
  }

  #slerp(buffer: NumberArray, from: number, to: number, at: number, stride: number): void {
    QuaternionArray.slerp(buffer, from, buffer, from, buffer, to, at);
  }

  #slerpAdditive(buffer: NumberArray, to: number, from: number, at: number, stride: number): void {
    const offset = this._workIndex * stride;
    QuaternionArray.multiply(buffer, offset, buffer, to, buffer, from);
    QuaternionArray.slerp(buffer, to, buffer, to, buffer, offset, at);
  }

  #lerp(buffer: NumberArray, to: number, from: number, at: number, stride: number): void {
    const s = 1 - at;

    for (let i = 0; i !== stride; ++i) {
      const j = to + i;

      buffer[j] = buffer[j] * s + buffer[from + i] * at;
    }
  }

  #lerpAdditive(buffer: NumberArray, to: number, from: number, at: number, stride: number): void {
    for (let i = 0; i !== stride; ++i) {
      const j = to + i;

      buffer[j] = buffer[j] + buffer[from + i] * at;
    }
  }
}
