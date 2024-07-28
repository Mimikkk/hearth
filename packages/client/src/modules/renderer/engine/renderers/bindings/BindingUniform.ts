import { Color, Mat3, Mat4, Vec2, Vec3, Vec4 } from '@modules/renderer/engine/engine.js';

export abstract class BindingUniform<T> {
  abstract boundary: number;
  abstract itemSize: number;
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

export class FloatUniform extends BindingUniform<number> {
  declare isFloatUniform: true;
  boundary: number = 4;
  itemSize: number = 1;

  constructor(name: string, value: number = 0) {
    super(name, value);
  }
}

FloatUniform.prototype.isFloatUniform = true;

export class Vec2Uniform extends BindingUniform<Vec2> {
  declare isVec2Uniform: true;
  boundary: number = 8;
  itemSize: number = 2;

  constructor(name: string, value: Vec2) {
    super(name, value);
  }
}

Vec2Uniform.prototype.isVec2Uniform = true;

export class Vec3Uniform extends BindingUniform<Vec3> {
  declare isVec3Uniform: true;
  boundary: number = 16;
  itemSize: number = 3;

  constructor(name: string, value: Vec3 = Vec3.new()) {
    super(name, value);
  }
}

Vec3Uniform.prototype.isVec3Uniform = true;

export class Vec4Uniform extends BindingUniform<Vec4> {
  declare isVec4Uniform: true;
  boundary: number = 16;
  itemSize: number = 4;

  constructor(name: string, value: Vec4 = Vec4.new()) {
    super(name, value);
  }
}

Vec4Uniform.prototype.isVec4Uniform = true;

export class ColorUniform extends BindingUniform<Color> {
  declare isColorUniform: true;
  boundary: number = 16;
  itemSize: number = 3;

  constructor(name: string, value: Color = Color.new()) {
    super(name, value);
  }
}

ColorUniform.prototype.isColorUniform = true;

export class Mat3Uniform extends BindingUniform<Mat3> {
  declare isMat3Uniform: true;
  boundary: number = 48;
  itemSize: number = 12;

  constructor(name: string, value: Mat3 = new Mat3()) {
    super(name, value);
  }
}

Mat3Uniform.prototype.isMat3Uniform = true;

export class Mat4Uniform extends BindingUniform<Mat4> {
  declare isMat4Uniform: true;
  boundary: number = 64;
  itemSize: number = 16;

  constructor(name: string, value: Mat4 = new Mat4()) {
    super(name, value);
  }
}

Mat4Uniform.prototype.isMat4Uniform = true;
