import { bench, BenchOptions, describe } from 'vitest';

class A {
  a: true = true;
}

class B {
  declare a: true;

  constructor() {
    this.a = true;
  }
}

class C {
  declare a: true;
}

class D {}

describe('Bench - Type Check', () => {
  const options: BenchOptions = {
    iterations: 1000_000,
    warmupIterations: 1000_000,
  };

  bench(
    'Class A',
    () => {
      let _ = new A().a === true;
    },
    options,
  );

  bench(
    'Class B',
    () => {
      let _ = new B().a === true;
    },
    options,
  );

  bench(
    'Class C',
    () => {
      let _ = new C().a === true;
    },
    options,
  );
  bench(
    'Class D',
    () => {
      let _ = new D() instanceof D;
    },
    options,
  );
});
