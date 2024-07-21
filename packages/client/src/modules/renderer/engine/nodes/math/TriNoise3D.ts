// https://github.com/cabbibo/glsl-tri-noise-3d

import { loop } from '../utils/LoopNode.js';
import { f32, tslFn, vec3 } from '../shadernode/ShaderNodes.js';

const tri = tslFn(([x]) => {
  return x.fract().sub(0.5).abs();
});

const tri3 = tslFn(([p]) => {
  return vec3(tri(p.z.add(tri(p.y.mul(1)))), tri(p.z.add(tri(p.x.mul(1)))), tri(p.y.add(tri(p.x.mul(1)))));
});

const triNoise3D = tslFn(([p_immutable, spd, time]) => {
  const p = vec3(p_immutable).toVar();
  const z = f32(1.4).toVar();
  const rz = f32(0.0).toVar();
  const bp = vec3(p).toVar();

  loop({ start: f32(0.0), end: f32(3.0), type: 'f32', condition: '<=' }, () => {
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
});

// layouts

tri.setLayout({
  name: 'tri',
  type: 'f32',
  inputs: [{ name: 'x', type: 'f32' }],
});

tri3.setLayout({
  name: 'tri3',
  type: 'vec3',
  inputs: [{ name: 'p', type: 'vec3' }],
});

triNoise3D.setLayout({
  name: 'triNoise3D',
  type: 'f32',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'spd', type: 'f32' },
    { name: 'time', type: 'f32' },
  ],
});

export { tri, tri3, triNoise3D };
