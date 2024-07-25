import type { Uniform } from './Uniform.js';

let _id = 0;

export class UniformGroup<A> {
  declare ['constructor']: typeof UniformGroup<A>;
  declare isUniformsGroup: true;
  id: number;
  name: string;
  uniforms: (Uniform<A> | Uniform<A>[])[];

  constructor() {
    this.uniforms = [];
    this.id = _id++;
  }

  add<T extends A>(uniform: Uniform<T> | Uniform<A>[]): this {
    this.uniforms.push(uniform);
    return this;
  }

  remove(uniform: Uniform<A> | Uniform<A>[]): this {
    const index = this.uniforms.indexOf(uniform);
    if (index !== -1) this.uniforms.splice(index, 1);
    return this;
  }

  copy(source: UniformGroup<A>): this {
    this.name = source.name;

    const uniformsSource = source.uniforms;
    this.uniforms.length = 0;

    for (let i = 0, l = uniformsSource.length; i < l; ++i) {
      const uniform = uniformsSource[i];
      const uniforms = Array.isArray(uniform) ? uniform : [uniform];

      for (let j = 0; j < uniforms.length; ++j) {
        this.uniforms.push(uniforms[j].clone());
      }
    }

    return this;
  }

  clone(): UniformGroup<A> {
    return new this.constructor().copy(this);
  }
}

UniformGroup.prototype.isUniformsGroup = true;
