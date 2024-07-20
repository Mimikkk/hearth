import {
  FloatUniform,
  Vec2Uniform,
  Vec3Uniform,
  Vec4Uniform,
  ColorUniform,
  Mat3Uniform,
  Mat4Uniform,
} from '../Uniform.js';

import NodeUniform from '@modules/renderer/engine/nodes/core/NodeUniform.js';

export class FloatNodeUniform extends FloatUniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);
  }

  getValue() {
    return this.nodeUniform.value;
  }
}

export class Vec2NodeUniform extends Vec2Uniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }

  getValue() {
    return this.nodeUniform.value;
  }
}

export class Vec3NodeUniform extends Vec3Uniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }

  getValue() {
    return this.nodeUniform.value;
  }
}

export class Vec4NodeUniform extends Vec4Uniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }

  getValue() {
    return this.nodeUniform.value;
  }
}

export class ColorNodeUniform extends ColorUniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }

  getValue() {
    return this.nodeUniform.value;
  }
}

export class Mat3NodeUniform extends Mat3Uniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }

  getValue() {
    return this.nodeUniform.value;
  }
}

export class Mat4NodeUniform extends Mat4Uniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }

  getValue() {
    return this.nodeUniform.value;
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
