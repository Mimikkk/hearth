import { TextureDataType, TextureFormat } from '../constants.js';
import { Bone } from './Bone.js';
import { Mat4 } from '../math/Mat4.js';
import { DataTexture } from '@modules/renderer/engine/entities/textures/DataTexture.js';
import { v4 } from 'uuid';

const _offsetMatrix = new Mat4();
const _identityMatrix = new Mat4();

export class Skeleton {
  uuid: string;
  bones: Bone[];
  boneInverses: Mat4[];
  boneMatrices: Float32Array;
  boneTexture: DataTexture | null;
  frame: number;

  constructor(bones: Bone[] = [], boneInverses: Mat4[] = []) {
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

    if (boneInverses.length === 0) {
      this.calculateInverses();
    } else {
      if (bones.length !== boneInverses.length) {
        console.warn('Skeleton: Number of inverse bone matrices does not match amount of bones.');

        this.boneInverses = [];

        for (let i = 0, il = this.bones.length; i < il; i++) {
          this.boneInverses.push(new Mat4());
        }
      }
    }
  }

  calculateInverses() {
    this.boneInverses.length = 0;

    for (let i = 0, il = this.bones.length; i < il; i++) {
      const inverse = new Mat4();

      if (this.bones[i]) {
        inverse.from(this.bones[i].matrixWorld).invert();
      }

      this.boneInverses.push(inverse);
    }
  }

  pose() {
    for (let i = 0, il = this.bones.length; i < il; i++) {
      const bone = this.bones[i];

      if (bone) {
        bone.matrixWorld.from(this.boneInverses[i]).invert();
      }
    }

    const isBone = (bone: any): bone is Bone => bone instanceof Bone;

    for (let i = 0, il = this.bones.length; i < il; i++) {
      const bone = this.bones[i];

      if (bone) {
        if (isBone(bone.parent)) {
          bone.matrix.from(bone.parent.matrixWorld).invert();
          bone.matrix.mul(bone.matrixWorld);
        } else {
          bone.matrix.from(bone.matrixWorld);
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

    for (let i = 0, il = bones.length; i < il; i++) {
      const matrix = bones[i] ? bones[i].matrixWorld : _identityMatrix;

      _offsetMatrix.asMul(matrix, boneInverses[i]);
      _offsetMatrix.intoArray(boneMatrices as never as number[], i * 16);
    }

    if (boneTexture !== null) {
      boneTexture.useUpdate = true;
    }
  }

  clone() {
    return new Skeleton(this.bones, this.boneInverses);
  }

  computeBoneTexture(): this {
    let size = Math.sqrt(this.bones.length * 4);
    size = Math.ceil(size / 4) * 4;
    size = Math.max(size, 4);

    const boneMatrices = new Float32Array(size * size * 4);
    boneMatrices.set(this.boneMatrices);

    this.boneMatrices = boneMatrices;
    this.boneTexture = new DataTexture({
      data: boneMatrices,
      width: size,
      height: size,
      format: TextureFormat.RGBA,
      type: TextureDataType.Float,
      useUpdate: true,
    });

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
}
