import { Uniform } from '../../nodes/core/Uniform.js';

export class BindingUniform<T = any> {
  offset: number = 0;

  constructor(
    public uniform: Uniform<T>,
    public boundary: number,
    public itemSize: number,
  ) {}
}
