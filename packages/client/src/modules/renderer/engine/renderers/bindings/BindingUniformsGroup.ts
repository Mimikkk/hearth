import BindingUniformBuffer from './BindingUniformBuffer.js';
import { STD140ChunkBytes } from '../constants.js';
import {
  ColorNodeUniform,
  FloatNodeUniform,
  Mat3NodeUniform,
  Mat4NodeUniform,
  ValueNodeUniform,
  Vec2NodeUniform,
  Vec3NodeUniform,
  Vec4NodeUniform,
} from '@modules/renderer/engine/nodes/builder/NodeUniform.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';

class BindingUniformsGroup extends BindingUniformBuffer {
  uniforms: ValueNodeUniform[] = [];
  bytesPerElement: number = Float32Array.BYTES_PER_ELEMENT;

  constructor(name: string) {
    super(name, new Float32Array(new ArrayBuffer(0)));
  }

  add(uniform: ValueNodeUniform): this {
    this.uniforms.push(uniform);
    this.buffer = new Float32Array(new ArrayBuffer(this.byteLength));
    return this;
  }

  remove(uniform: ValueNodeUniform): this {
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

  updateByType(uniform: ValueNodeUniform) {
    if (uniform instanceof FloatNodeUniform) return this.updateNumber(uniform);
    if (uniform instanceof Vec2NodeUniform) return this.updateVec2(uniform);
    if (uniform instanceof Vec3NodeUniform) return this.updateVec3(uniform);
    if (uniform instanceof Vec4NodeUniform) return this.updateVec4(uniform);
    if (uniform instanceof ColorNodeUniform) return this.updateColor(uniform);
    if (uniform instanceof Mat3NodeUniform) return this.updateMat3(uniform);
    if (uniform instanceof Mat4NodeUniform) return this.updateMat4(uniform);

    console.error('UniformsGroup: Unsupported uniform type.', uniform);
  }

  updateNumber(uniform: FloatNodeUniform): boolean {
    let updated = false;

    const a = this.buffer;
    const v = uniform.getValue();
    const offset = uniform.offset;

    if (a[offset] !== v) {
      a[offset] = v;
      updated = true;
    }

    return updated;
  }

  updateVec2(uniform: Vec2NodeUniform): boolean {
    let updated = false;

    const a = this.buffer;
    const v = uniform.getValue();
    const offset = uniform.offset;

    if (a[offset + 0] !== v.x || a[offset + 1] !== v.y) {
      a[offset + 0] = v.x;
      a[offset + 1] = v.y;

      updated = true;
    }

    return updated;
  }

  updateVec3(uniform: Vec3NodeUniform): boolean {
    let updated = false;

    const a = this.buffer;
    const v = uniform.getValue();
    const offset = uniform.offset;

    if (a[offset + 0] !== v.x || a[offset + 1] !== v.y || a[offset + 2] !== v.z) {
      a[offset + 0] = v.x;
      a[offset + 1] = v.y;
      a[offset + 2] = v.z;

      updated = true;
    }

    return updated;
  }

  updateVec4(uniform: Vec4NodeUniform): boolean {
    let updated = false;

    const a = this.buffer;
    const v = uniform.getValue();
    const offset = uniform.offset;

    if (a[offset + 0] !== v.x || a[offset + 1] !== v.y || a[offset + 2] !== v.z || a[offset + 4] !== v.w) {
      a[offset + 0] = v.x;
      a[offset + 1] = v.y;
      a[offset + 2] = v.z;
      a[offset + 3] = v.w;

      updated = true;
    }

    return updated;
  }

  updateColor(uniform: ColorNodeUniform): boolean {
    let updated = false;

    const a = this.buffer;
    const c = uniform.getValue();
    const offset = uniform.offset;

    if (a[offset + 0] !== c.r || a[offset + 1] !== c.g || a[offset + 2] !== c.b) {
      a[offset + 0] = c.r;
      a[offset + 1] = c.g;
      a[offset + 2] = c.b;

      updated = true;
    }

    return updated;
  }

  updateMat3(uniform: Mat3NodeUniform): boolean {
    let updated = false;

    const a = this.buffer;
    const e = uniform.getValue().elements;
    const offset = uniform.offset;

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

  updateMat4(uniform: Mat4NodeUniform): boolean {
    let updated = false;

    const a = this.buffer;
    const e = uniform.getValue().elements;
    const offset = uniform.offset;

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

export default BindingUniformsGroup;
