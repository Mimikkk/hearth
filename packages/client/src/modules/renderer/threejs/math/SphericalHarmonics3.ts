import { Vector3 } from './Vector3.js';

type Coefficients = [Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3];
export class SphericalHarmonics3 {
  declare ['constructor']: typeof SphericalHarmonics3;
  declare isSphericalHarmonics3: true;
  coefficients: Coefficients;

  constructor() {
    this.coefficients = [
      new Vector3(),
      new Vector3(),
      new Vector3(),
      new Vector3(),
      new Vector3(),
      new Vector3(),
      new Vector3(),
      new Vector3(),
      new Vector3(),
    ];
  }

  set(coefficients: Coefficients): this {
    this.coefficients[0].copy(coefficients[0]);
    this.coefficients[1].copy(coefficients[1]);
    this.coefficients[2].copy(coefficients[2]);
    this.coefficients[3].copy(coefficients[3]);
    this.coefficients[4].copy(coefficients[4]);
    this.coefficients[5].copy(coefficients[5]);
    this.coefficients[6].copy(coefficients[6]);
    this.coefficients[7].copy(coefficients[7]);
    this.coefficients[8].copy(coefficients[8]);

    return this;
  }

  zero(): this {
    this.coefficients[0].set(0, 0, 0);
    this.coefficients[1].set(0, 0, 0);
    this.coefficients[2].set(0, 0, 0);
    this.coefficients[3].set(0, 0, 0);
    this.coefficients[4].set(0, 0, 0);
    this.coefficients[5].set(0, 0, 0);
    this.coefficients[6].set(0, 0, 0);
    this.coefficients[7].set(0, 0, 0);
    this.coefficients[8].set(0, 0, 0);

    return this;
  }

  getAt(normal: Vector3, target: Vector3): Vector3 {
    // normal is assumed to be unit length

    const x = normal.x,
      y = normal.y,
      z = normal.z;

    const coeff = this.coefficients;

    // band 0
    target.copy(coeff[0]).multiplyScalar(0.282095);

    // band 1
    target.addScaledVector(coeff[1], 0.488603 * y);
    target.addScaledVector(coeff[2], 0.488603 * z);
    target.addScaledVector(coeff[3], 0.488603 * x);

    // band 2
    target.addScaledVector(coeff[4], 1.092548 * (x * y));
    target.addScaledVector(coeff[5], 1.092548 * (y * z));
    target.addScaledVector(coeff[6], 0.315392 * (3.0 * z * z - 1.0));
    target.addScaledVector(coeff[7], 1.092548 * (x * z));
    target.addScaledVector(coeff[8], 0.546274 * (x * x - y * y));

    return target;
  }

  getIrradianceAt(normal: Vector3, target: Vector3): Vector3 {
    // normal is assumed to be unit length

    const x = normal.x,
      y = normal.y,
      z = normal.z;

    const coeff = this.coefficients;

    // band 0
    target.copy(coeff[0]).multiplyScalar(0.886227); // π * 0.282095

    // band 1
    target.addScaledVector(coeff[1], 2.0 * 0.511664 * y); // ( 2 * π / 3 ) * 0.488603
    target.addScaledVector(coeff[2], 2.0 * 0.511664 * z);
    target.addScaledVector(coeff[3], 2.0 * 0.511664 * x);

    // band 2
    target.addScaledVector(coeff[4], 2.0 * 0.429043 * x * y); // ( π / 4 ) * 1.092548
    target.addScaledVector(coeff[5], 2.0 * 0.429043 * y * z);
    target.addScaledVector(coeff[6], 0.743125 * z * z - 0.247708); // ( π / 4 ) * 0.315392 * 3
    target.addScaledVector(coeff[7], 2.0 * 0.429043 * x * z);
    target.addScaledVector(coeff[8], 0.429043 * (x * x - y * y)); // ( π / 4 ) * 0.546274

    return target;
  }

  add(harmonics: SphericalHarmonics3): this {
    for (let i = 0; i < 9; i++) {
      this.coefficients[i].add(harmonics.coefficients[i]);
    }

    return this;
  }

  addScaledSH(harmonics: SphericalHarmonics3, s: number): this {
    for (let i = 0; i < 9; i++) {
      this.coefficients[i].addScaledVector(harmonics.coefficients[i], s);
    }

    return this;
  }

  scale(scale: number): this {
    for (let i = 0; i < 9; i++) {
      this.coefficients[i].multiplyScalar(scale);
    }

    return this;
  }

  lerp(harmonics: SphericalHarmonics3, step: number): this {
    for (let i = 0; i < 9; i++) {
      this.coefficients[i].lerp(harmonics.coefficients[i], step);
    }

    return this;
  }

  equals(harmonics: SphericalHarmonics3): boolean {
    for (let i = 0; i < 9; i++) {
      if (!this.coefficients[i].equals(harmonics.coefficients[i])) {
        return false;
      }
    }

    return true;
  }

  copy(harmonics: SphericalHarmonics3): this {
    return this.set(harmonics.coefficients);
  }

  clone(): SphericalHarmonics3 {
    return new this.constructor().copy(this);
  }

  fromArray(array: number[], offset: number = 0): this {
    const coefficients = this.coefficients;

    for (let i = 0; i < 9; i++) {
      coefficients[i].fromArray(array, offset + i * 3);
    }

    return this;
  }

  toArray(array: number[] = [], offset: number = 0): number[] {
    const coefficients = this.coefficients;

    for (let i = 0; i < 9; i++) {
      coefficients[i].toArray(array, offset + i * 3);
    }

    return array;
  }

  static getBasisAt(
    normal: Vector3,
    basis: [number, number, number, number, number, number, number, number, number],
  ): void {
    const x = normal.x,
      y = normal.y,
      z = normal.z;

    basis[0] = 0.282095;

    basis[1] = 0.488603 * y;
    basis[2] = 0.488603 * z;
    basis[3] = 0.488603 * x;

    basis[4] = 1.092548 * x * y;
    basis[5] = 1.092548 * y * z;
    basis[6] = 0.315392 * (3 * z * z - 1);
    basis[7] = 1.092548 * x * z;
    basis[8] = 0.546274 * (x * x - y * y);
  }
}
SphericalHarmonics3.prototype.isSphericalHarmonics3 = true;
