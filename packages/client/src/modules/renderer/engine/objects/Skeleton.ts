import { TextureDataType, TextureFormat } from '../constants.js';
import { Bone } from './Bone.js';
import { Matrix4 } from '../math/Matrix4.js';
import { DataTexture } from '../textures/DataTexture.js';
import * as MathUtils from '../math/MathUtils.js';
import { v4 } from 'uuid';

const _offsetMatrix = /*@__PURE__*/ new Matrix4();
const _identityMatrix = /*@__PURE__*/ new Matrix4();

export class Skeleton {
  uuid: string;
  bones: Bone[];
  boneInverses: Matrix4[];
  boneMatrices: Float32Array;
  boneTexture: DataTexture | null;
  frame: number;

  constructor(bones: Bone[] = [], boneInverses: Matrix4[] = []) {
    this.uuid = v4();

    this.bones = bones.slice(0);
    this.boneInverses = boneInverses;
    this.boneMatrices = null!;
    this.boneTexture = null;

    this.init();
  }

  init() {
    const bones = this.bones;
    const boneInverses = this.boneInverses;

    this.boneMatrices = new Float32Array(bones.length * 16);

    // calculate inverse bone matrices if necessary

    if (boneInverses.length === 0) {
      this.calculateInverses();
    } else {
      // handle special case

      if (bones.length !== boneInverses.length) {
        console.warn('engine.Skeleton: Number of inverse bone matrices does not match amount of bones.');

        this.boneInverses = [];

        for (let i = 0, il = this.bones.length; i < il; i++) {
          this.boneInverses.push(new Matrix4());
        }
      }
    }
  }

  calculateInverses() {
    this.boneInverses.length = 0;

    for (let i = 0, il = this.bones.length; i < il; i++) {
      const inverse = new Matrix4();

      if (this.bones[i]) {
        inverse.copy(this.bones[i].matrixWorld).invert();
      }

      this.boneInverses.push(inverse);
    }
  }

  pose() {
    // recover the bind-time world matrices

    for (let i = 0, il = this.bones.length; i < il; i++) {
      const bone = this.bones[i];

      if (bone) {
        bone.matrixWorld.copy(this.boneInverses[i]).invert();
      }
    }

    // compute the local matrices, positions, rotations and scales

    const isBone = (bone: any): bone is Bone => bone instanceof Bone;

    for (let i = 0, il = this.bones.length; i < il; i++) {
      const bone = this.bones[i];

      if (bone) {
        if (isBone(bone.parent)) {
          bone.matrix.copy(bone.parent.matrixWorld).invert();
          bone.matrix.multiply(bone.matrixWorld);
        } else {
          bone.matrix.copy(bone.matrixWorld);
        }

        bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
      }
    }
  }

  update() {
    const bones = this.bones;
    const boneInverses = this.boneInverses;
    const boneMatrices = this.boneMatrices;
    const boneTexture = this.boneTexture;

    // flatten bone matrices to array

    for (let i = 0, il = bones.length; i < il; i++) {
      // compute the offset between the current and the original transform

      const matrix = bones[i] ? bones[i].matrixWorld : _identityMatrix;

      _offsetMatrix.multiplyMatrices(matrix, boneInverses[i]);
      _offsetMatrix.toArray(boneMatrices as never as number[], i * 16);
    }

    if (boneTexture !== null) {
      boneTexture.needsUpdate = true;
    }
  }

  clone() {
    return new Skeleton(this.bones, this.boneInverses);
  }

  computeBoneTexture(): this {
    // layout (1 matrix = 4 pixels)
    //      RGBA RGBA RGBA RGBA (=> column1, column2, column3, column4)
    //  with  8x8  pixel texture max   16 bones * 4 pixels =  (8 * 8)
    //       16x16 pixel texture max   64 bones * 4 pixels = (16 * 16)
    //       32x32 pixel texture max  256 bones * 4 pixels = (32 * 32)
    //       64x64 pixel texture max 1024 bones * 4 pixels = (64 * 64)

    let size = Math.sqrt(this.bones.length * 4); // 4 pixels needed for 1 matrix
    size = Math.ceil(size / 4) * 4;
    size = Math.max(size, 4);

    const boneMatrices = new Float32Array(size * size * 4); // 4 floats per RGBA pixel
    boneMatrices.set(this.boneMatrices); // copy current values

    const boneTexture = new DataTexture(
      boneMatrices,
      size,
      size,
      TextureFormat.RGBA,
      TextureDataType.Float,
      undefined!,
      undefined!,
      undefined!,
      undefined!,
      undefined!,
      undefined!,
      undefined!,
    );
    boneTexture.needsUpdate = true;

    this.boneMatrices = boneMatrices;
    this.boneTexture = boneTexture;

    return this;
  }

  getBoneByName(name: string): Bone | undefined {
    for (let i = 0, il = this.bones.length; i < il; i++) {
      const bone = this.bones[i];

      if (bone.name === name) {
        return bone;
      }
    }

    return undefined;
  }

  dispose() {
    if (this.boneTexture !== null) {
      this.boneTexture.dispose();

      this.boneTexture = null;
    }
  }
}
