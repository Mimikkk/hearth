import { Color, Matrix3, Matrix4, Vector3, Vector4 } from '@modules/renderer/engine/engine.js';
import { Vec2 } from '@modules/renderer/engine/math/Vector2.js';

export abstract class Uniform<T> {
  // STD140 layout
  abstract boundary: number;
  // size in bytes
  abstract itemSize: number;
  // offset within UniformsGroup
  offset: number = 0;

  constructor(
    public name: string,
    public value: T,
  ) {}

  setValue(value: T): void {
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }
}

export class FloatUniform extends Uniform<number> {
  declare isFloatUniform: true;
  boundary: number = 4;
  itemSize: number = 1;

  constructor(name: string, value: number = 0) {
    super(name, value);
  }
}

FloatUniform.prototype.isFloatUniform = true;

export class Vector2Uniform extends Uniform<Vec2> {
  declare isVector2Uniform: true;
  boundary: number = 8;
  itemSize: number = 2;

  constructor(name: string, value: Vec2) {
    super(name, value);
  }
}

Vector2Uniform.prototype.isVector2Uniform = true;

export class Vector3Uniform extends Uniform<Vector3> {
  declare isVector3Uniform: true;
  boundary: number = 16;
  itemSize: number = 3;

  constructor(name: string, value: Vector3 = new Vector3()) {
    super(name, value);
  }
}

Vector3Uniform.prototype.isVector3Uniform = true;

export class Vector4Uniform extends Uniform<Vector4> {
  declare isVector4Uniform: true;
  boundary: number = 16;
  itemSize: number = 4;

  constructor(name: string, value: Vector4 = new Vector4()) {
    super(name, value);
  }
}

Vector4Uniform.prototype.isVector4Uniform = true;

export class ColorUniform extends Uniform<Color> {
  declare isColorUniform: true;
  boundary: number = 16;
  itemSize: number = 3;

  constructor(name: string, value: Color = new Color()) {
    super(name, value);
  }
}

ColorUniform.prototype.isColorUniform = true;

export class Matrix3Uniform extends Uniform<Matrix3> {
  declare isMatrix3Uniform: true;
  boundary: number = 48;
  itemSize: number = 12;

  constructor(name: string, value: Matrix3 = new Matrix3()) {
    super(name, value);
  }
}

Matrix3Uniform.prototype.isMatrix3Uniform = true;

export class Matrix4Uniform extends Uniform<Matrix4> {
  declare isMatrix4Uniform: true;
  boundary: number = 64;
  itemSize: number = 16;

  constructor(name: string, value: Matrix4 = new Matrix4()) {
    super(name, value);
  }
}

Matrix4Uniform.prototype.isMatrix4Uniform = true;
