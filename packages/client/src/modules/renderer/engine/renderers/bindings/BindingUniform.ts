import { Color, Mat3, Mat4, Vec2, Vec3, Vec4 } from '@modules/renderer/engine/engine.js';

export abstract class BindingUniform<T = any> {
  offset: number = 0;

  constructor(
    public name: string,
    public value: T,
    public boundary: number,
    public itemSize: number,
  ) {}

  setValue(value: T): void {
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }
}

export class FloatUniform extends BindingUniform<number> {
  constructor(name: string, value: number = 0) {
    super(name, value, 4, 1);
  }
}

export class Vec2Uniform extends BindingUniform<Vec2> {
  constructor(name: string, value: Vec2) {
    super(name, value, 8, 2);
  }
}

export class Vec3Uniform extends BindingUniform<Vec3> {
  constructor(name: string, value: Vec3 = Vec3.new()) {
    super(name, value, 16, 3);
  }
}

export class Vec4Uniform extends BindingUniform<Vec4> {
  constructor(name: string, value: Vec4 = Vec4.new()) {
    super(name, value, 16, 4);
  }
}

export class ColorUniform extends BindingUniform<Color> {
  constructor(name: string, value: Color = Color.new()) {
    super(name, value, 16, 3);
  }
}

export class Mat3Uniform extends BindingUniform<Mat3> {
  constructor(name: string, value: Mat3 = new Mat3()) {
    super(name, value, 48, 12);
  }
}

export class Mat4Uniform extends BindingUniform<Mat4> {
  constructor(name: string, value: Mat4 = new Mat4()) {
    super(name, value, 64, 16);
  }
}
