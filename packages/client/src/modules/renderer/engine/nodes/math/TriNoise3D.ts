import { loop } from '../utils/LoopNode.js';
import { f32, tslFn, vec3 } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export const tri = tslFn(
  ([x]) => {
    return x.fract().sub(0.5).abs();
  },
  {
    name: 'tri',
    type: TypeName.f32,
    inputs: [{ name: 'x', type: TypeName.f32 }],
  },
);

export const tri3 = tslFn(
  ([p]) => {
    return vec3(tri(p.z.add(tri(p.y.mul(1)))), tri(p.z.add(tri(p.x.mul(1)))), tri(p.y.add(tri(p.x.mul(1)))));
  },
  {
    name: 'tri3',
    type: TypeName.vec3,
    inputs: [{ name: 'p', type: TypeName.vec3 }],
  },
);

export const triNoise3D = tslFn(
  ([p_immutable, spd, time]) => {
    const p = vec3(p_immutable).toVar();
    const z = f32(1.4).toVar();
    const rz = f32(0.0).toVar();
    const bp = vec3(p).toVar();

    loop({ start: f32(0.0), end: f32(3.0), type: TypeName.f32, condition: '<=' }, () => {
      const dg = vec3(tri3(bp.mul(2.0))).toVar();
      p.addAssign(dg.add(time.mul(f32(0.1).mul(spd))));
      bp.mulAssign(1.8);
      z.mulAssign(1.5);
      p.mulAssign(1.2);

      const t = f32(tri(p.z.add(tri(p.x.add(tri(p.y)))))).toVar();
      rz.addAssign(t.div(z));
      bp.addAssign(0.14);
    });

    return rz;
  },
  {
    name: 'triNoise3D',
    type: TypeName.f32,
    inputs: [
      { name: 'p', type: TypeName.vec3 },
      { name: 'spd', type: TypeName.f32 },
      { name: 'time', type: TypeName.f32 },
    ],
  },
);
