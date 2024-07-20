import { bench, describe, expect } from 'vitest';
import { IVec3, Vec3 } from './Vector3.ts';
import { Vec2 } from './Vector2.ts';

const { vec3 } = IVec3;
const { vec2 } = Vec2;

const closeTo = (a: IVec3, b: IVec3, epsilon = Number.EPSILON) => {
  expect(a.x).closeTo(b.x, epsilon);
  expect(a.y).closeTo(b.y, epsilon);
  expect(a.z).closeTo(b.z, epsilon);
};

const create1 = (x: number, y: number, z: number) => ({ x, y, z });
const create2 = Vec3.create;

describe('Math - Vec3', () => {
  bench('set2', () => {
    const vec = create2(Math.random(), Math.random(), Math.random());
    vec.clone();

    vec.clone();

    vec.clone();

    vec.clone();

    vec.clone();
  });

  bench('set1', () => {
    const vec = create1(Math.random(), Math.random(), Math.random());

    IVec3.clone(vec);

    IVec3.clone(vec);

    IVec3.clone(vec);

    IVec3.clone(vec);

    IVec3.clone(vec);
  });
});
