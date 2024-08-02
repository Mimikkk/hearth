import { BindingUniformBuffer } from './BindingUniformBuffer.js';
import { STD140ChunkBytes } from '../constants.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';
import { BindingUniform } from '@modules/renderer/engine/hearth/bindings/BindingUniform.js';

export class BindingUniformsGroup extends BindingUniformBuffer {
  uniforms: BindingUniform[] = [];
  bytesPerElement: number = Float32Array.BYTES_PER_ELEMENT;

  constructor(name: string) {
    super(name, new Float32Array(new ArrayBuffer(0)));
  }

  add(uniform: BindingUniform): this {
    this.uniforms.push(uniform);
    this.buffer = new Float32Array(new ArrayBuffer(this.byteLength));
    return this;
  }

  remove(uniform: BindingUniform): this {
    const index = this.uniforms.indexOf(uniform);
    if (index !== -1) {
      this.buffer = new Float32Array(new ArrayBuffer(this.byteLength));
      this.uniforms.splice(index, 1);
    }
    return this;
  }

  get byteLength(): number {
    let offset = 0;

    for (let i = 0, it = this.uniforms.length; i < it; ++i) {
      const uniform = this.uniforms[i];

      const { boundary, itemSize } = uniform;

      const chunkOffset = offset % STD140ChunkBytes;
      const remainingSizeInChunk = STD140ChunkBytes - chunkOffset;

      if (chunkOffset && remainingSizeInChunk - boundary < 0) offset += STD140ChunkBytes - chunkOffset;
      else if (chunkOffset % boundary !== 0) offset += chunkOffset % boundary;

      uniform.offset = offset / this.bytesPerElement;

      offset += itemSize * this.bytesPerElement;
    }

    return Math.ceil(offset / STD140ChunkBytes) * STD140ChunkBytes;
  }

  update() {
    let updated = false;

    for (const uniform of this.uniforms) if (this.updateByType(uniform)) updated = true;

    return updated;
  }

  updateByType(binding: BindingUniform) {
    const val = binding.uniform.value;

    if (typeof val === 'number') return this.updateNumber(binding);
    if (Vec2.is(val)) return this.updateVec2(binding);
    if (Vec3.is(val)) return this.updateVec3(binding);
    if (Vec4.is(val)) return this.updateVec4(binding);
    if (Color.is(val)) return this.updateColor(binding);
    if (Mat3.is(val)) return this.updateMat3(binding);
    if (Mat4.is(val)) return this.updateMat4(binding);

    console.error('UniformsGroup: Unsupported uniform type.', binding);
  }

  updateNumber(binding: BindingUniform<number>): boolean {
    let updated = false;

    const a = this.buffer;
    const v = binding.uniform.value;
    const offset = binding.offset;

    if (a[offset] !== v) {
      a[offset] = v;
      updated = true;
    }

    return updated;
  }

  updateVec2(binding: BindingUniform<Vec2>): boolean {
    let updated = false;

    const a = this.buffer;
    const v = binding.uniform.value;
    const offset = binding.offset;

    if (a[offset + 0] !== v.x || a[offset + 1] !== v.y) {
      a[offset + 0] = v.x;
      a[offset + 1] = v.y;

      updated = true;
    }

    return updated;
  }

  updateVec3(binding: BindingUniform<Vec3>): boolean {
    let updated = false;

    const a = this.buffer;
    const v = binding.uniform.value;
    const offset = binding.offset;

    if (a[offset + 0] !== v.x || a[offset + 1] !== v.y || a[offset + 2] !== v.z) {
      a[offset + 0] = v.x;
      a[offset + 1] = v.y;
      a[offset + 2] = v.z;

      updated = true;
    }

    return updated;
  }

  updateVec4(binding: BindingUniform<Vec4>): boolean {
    let updated = false;

    const a = this.buffer;
    const v = binding.uniform.value;
    const offset = binding.offset;

    if (a[offset + 0] !== v.x || a[offset + 1] !== v.y || a[offset + 2] !== v.z || a[offset + 4] !== v.w) {
      a[offset + 0] = v.x;
      a[offset + 1] = v.y;
      a[offset + 2] = v.z;
      a[offset + 3] = v.w;

      updated = true;
    }

    return updated;
  }

  updateColor(binding: BindingUniform<Color>): boolean {
    let updated = false;

    const a = this.buffer;
    const c = binding.uniform.value;
    const offset = binding.offset;

    if (a[offset + 0] !== c.r || a[offset + 1] !== c.g || a[offset + 2] !== c.b) {
      a[offset + 0] = c.r;
      a[offset + 1] = c.g;
      a[offset + 2] = c.b;

      updated = true;
    }

    return updated;
  }

  updateMat3(binding: BindingUniform<Mat3>): boolean {
    let updated = false;

    const a = this.buffer;
    const e = binding.uniform.value.elements;
    const offset = binding.offset;

    if (
      a[offset + 0] !== e[0] ||
      a[offset + 1] !== e[1] ||
      a[offset + 2] !== e[2] ||
      a[offset + 4] !== e[3] ||
      a[offset + 5] !== e[4] ||
      a[offset + 6] !== e[5] ||
      a[offset + 8] !== e[6] ||
      a[offset + 9] !== e[7] ||
      a[offset + 10] !== e[8]
    ) {
      a[offset + 0] = e[0];
      a[offset + 1] = e[1];
      a[offset + 2] = e[2];
      a[offset + 4] = e[3];
      a[offset + 5] = e[4];
      a[offset + 6] = e[5];
      a[offset + 8] = e[6];
      a[offset + 9] = e[7];
      a[offset + 10] = e[8];

      updated = true;
    }

    return updated;
  }

  updateMat4(binding: BindingUniform<Mat4>): boolean {
    let updated = false;

    const a = this.buffer;
    const e = binding.uniform.value.elements;
    const offset = binding.offset;

    if (!arraysEqual(a, e, offset)) {
      a.set(e, offset);
      updated = true;
    }

    return updated;
  }
}

function arraysEqual(a: ArrayLike<number>, b: ArrayLike<number>, offset: number) {
  for (let i = 0, l = b.length; i < l; i++) if (a[offset + i] !== b[i]) return false;
  return true;
}
