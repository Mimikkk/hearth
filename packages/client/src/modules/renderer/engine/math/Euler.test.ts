import { describe, expect, it } from 'vitest';
import { Euler_ } from './Euler.ts';
import { Quaternion_ } from '@modules/renderer/engine/math/Quaternion.js';

describe('Math - Quaternion', () => {
  // INSTANCING
  it('Instancing', () => {
    const a = Euler_.create(1, 2, 3, 'XYZ');

    expect(a).toEqual({ x: 1, y: 2, z: 3, order: 'XYZ' });
  });

  it('copy/equals', () => {
    const a = Euler_.create(1, 2, 3, 'XYZ');
    const b = Euler_.copy(a);

    expect(b).toEqual(a);
    expect(b).not.toBe(a);
    expect(Euler_.equals(a, b)).toBe(true);
  });

  it('Quaternion.fromEuler/Euler.fromQuaternion', () => {
    const testValues = [Euler_.create(0, 0, 1), Euler_.create(1, 0, 0), Euler_.create(0, 1, 0)];
    for (let i = 0; i < testValues.length; i++) {
      const v = testValues[i];
      const q = Quaternion_.fromEuler(v);

      const v2 = Euler_.fromQuaternion(q, v.order);
      const q2 = Quaternion_.fromEuler(v2);

      expect(q).toEqual(q2);
    }
  });

  // it( 'Matrix4.makeRotationFromEuler/Euler.setFromRotationMatrix', () => {
  //
  //   const testValues = [ eulerZero, eulerAxyz, eulerAzyx ];
  //   for ( let i = 0; i < testValues.length; i ++ ) {
  //
  //     const v = testValues[ i ];
  //     const m = new Matrix4().makeRotationFromEuler( v );
  //
  //     const v2 = new Euler().setFromRotationMatrix( m, v.order );
  //     const m2 = new Matrix4().makeRotationFromEuler( v2 );
  //     assert.ok( matrixEquals4( m, m2, 0.0001 ), 'Passed!' );
  //
  //   }
  //
  // } );

  it('fromVec', () => {
    const a = Euler_.fromVec({ x: 1, y: 2, z: 3 }, 'XYZ');
    expect(a).toEqual({ x: 1, y: 2, z: 3, order: 'XYZ' });
  });

  it('reorder', () => {
    const testValues = [Euler_.create(0, 0, 1), Euler_.create(1, 0, 0), Euler_.create(0, 1, 0)];
    for (let i = 0; i < testValues.length; i++) {
      const v = testValues[i];
      const q = Quaternion_.fromEuler(v);

      Euler_.reorder(v, 'YZX');
      const q2 = Quaternion_.fromEuler(v);
      expect(q).toEqual(q2);

      Euler_.reorder(v, 'ZXY');
      const q3 = Quaternion_.fromEuler(v);
      expect(q).toEqual(q3);
    }
  });

  it('intoArray', () => {
    const order = 'YXZ';
    const x = 1;
    const y = 2;
    const z = 3;
    const a = Euler_.create(x, y, z, order);

    expect(Euler_.intoArray(a)).toEqual([x, y, z, order]);

    const array = [0, 0, 0, '', '', ''];

    expect(Euler_.intoArray_(a, array, 0)).toBe(array);
    expect(array).toEqual([x, y, z, order, '', '']);

    expect(Euler_.intoArray_(a, array, 2)).toBe(array);
    expect(array).toEqual([x, y, x, y, z, order]);
  });

  it('fromArray', () => {
    const array = [1, 2, 3, 'XYZ'];
    const a = Euler_.fromArray(array, 0);

    expect(a).toEqual({ x: 1, y: 2, z: 3, order: 'XYZ' });

    const into = Euler_.empty();
    expect(Euler_.fromArray_(array, 0, into)).toEqual(a);
    expect(into).toEqual(a);
  });
});
