import {
  FloatUniform,
  Vector2Uniform,
  Vector3Uniform,
  Vector4Uniform,
  ColorUniform,
  Matrix3Uniform,
  Matrix4Uniform,
} from '../Uniform.js';

import NodeUniform from '@modules/renderer/threejs/nodes/core/NodeUniform.js';

export class FloatNodeUniform extends FloatUniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);
  }

  getValue() {
    return this.nodeUniform.value;
  }
}

export class Vector2NodeUniform extends Vector2Uniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }

  getValue() {
    return this.nodeUniform.value;
  }
}

export class Vector3NodeUniform extends Vector3Uniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }

  getValue() {
    return this.nodeUniform.value;
  }
}

export class Vector4NodeUniform extends Vector4Uniform {
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

export class Matrix3NodeUniform extends Matrix3Uniform {
  constructor(public nodeUniform: NodeUniform) {
    super(nodeUniform.name, nodeUniform.value);

    this.nodeUniform = nodeUniform;
  }

  getValue() {
    return this.nodeUniform.value;
  }
}

export class Matrix4NodeUniform extends Matrix4Uniform {
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
  | Vector2NodeUniform
  | Vector3NodeUniform
  | Vector4NodeUniform
  | ColorNodeUniform
  | Matrix3NodeUniform
  | Matrix4NodeUniform;
