import {
  ColorUniform,
  FloatUniform,
  Mat3Uniform,
  Mat4Uniform,
  Vec2Uniform,
  Vec3Uniform,
  Vec4Uniform,
} from '../../renderers/bindings/BindingUniform.js';

import NodeUniform from '@modules/renderer/engine/nodes/core/NodeUniform.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';
import { Color } from '@modules/renderer/engine/math/Color.js';
import { Mat3 } from '@modules/renderer/engine/math/Mat3.js';
import { Mat4 } from '@modules/renderer/engine/math/Mat4.js';

export class FloatNodeUniform extends FloatUniform {
  constructor(public uniform: NodeUniform<number>) {
    super(uniform.name, uniform.value);
  }

  getValue() {
    return this.uniform.value;
  }
}

export class Vec2NodeUniform extends Vec2Uniform {
  constructor(public uniform: NodeUniform<Vec2>) {
    super(uniform.name, uniform.value);

    this.uniform = uniform;
  }

  getValue() {
    return this.uniform.value;
  }
}

export class Vec3NodeUniform extends Vec3Uniform {
  constructor(public uniform: NodeUniform<Vec3>) {
    super(uniform.name, uniform.value);

    this.uniform = uniform;
  }

  getValue() {
    return this.uniform.value;
  }
}

export class Vec4NodeUniform extends Vec4Uniform {
  constructor(public uniform: NodeUniform<Vec4>) {
    super(uniform.name, uniform.value);

    this.uniform = uniform;
  }

  getValue() {
    return this.uniform.value;
  }
}

export class ColorNodeUniform extends ColorUniform {
  constructor(public uniform: NodeUniform<Color>) {
    super(uniform.name, uniform.value);

    this.uniform = uniform;
  }

  getValue() {
    return this.uniform.value;
  }
}

export class Mat3NodeUniform extends Mat3Uniform {
  constructor(public uniform: NodeUniform<Mat3>) {
    super(uniform.name, uniform.value);

    this.uniform = uniform;
  }

  getValue() {
    return this.uniform.value;
  }
}

export class Mat4NodeUniform extends Mat4Uniform {
  constructor(public uniform: NodeUniform<Mat4>) {
    super(uniform.name, uniform.value);

    this.uniform = uniform;
  }

  getValue() {
    return this.uniform.value;
  }
}

export type ValueNodeUniform =
  | FloatNodeUniform
  | Vec2NodeUniform
  | Vec3NodeUniform
  | Vec4NodeUniform
  | ColorNodeUniform
  | Mat3NodeUniform
  | Mat4NodeUniform;
