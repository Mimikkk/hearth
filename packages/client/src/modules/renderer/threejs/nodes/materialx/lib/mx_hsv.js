// Three.js Transpiler
// https://github.com/AcademySoftwareFoundation/MaterialX/blob/main/libraries/stdlib/genglsl/lib/mx_hsv.glsl

import { float, int, NodeStack, tslFn, vec3 } from '../../shadernode/ShaderNode.js';
import { add, mul, sub } from '@modules/renderer/threejs/nodes/math/OperatorNode.js';
import { floor, max, min, trunc } from '@modules/renderer/threejs/nodes/math/MathNode.js';

const mx_hsvtorgb = tslFn(([hsv_immutable]) => {
  const hsv = vec3(hsv_immutable).toVar();
  const h = float(hsv.x).toVar();
  const s = float(hsv.y).toVar();
  const v = float(hsv.z).toVar();

  NodeStack.if(s.lessThan(0.0001), () => {
    return vec3(v, v, v);
  }).else(() => {
    h.assign(mul(6.0, h.sub(floor(h))));
    const hi = int(trunc(h)).toVar();
    const f = float(h.sub(float(hi))).toVar();
    const p = float(v.mul(sub(1.0, s))).toVar();
    const q = float(v.mul(sub(1.0, s.mul(f)))).toVar();
    const t = float(v.mul(sub(1.0, s.mul(sub(1.0, f))))).toVar();

    NodeStack.if(hi.equal(int(0)), () => {
      return vec3(v, t, p);
    })
      .elseif(hi.equal(int(1)), () => {
        return vec3(q, v, p);
      })
      .elseif(hi.equal(int(2)), () => {
        return vec3(p, v, t);
      })
      .elseif(hi.equal(int(3)), () => {
        return vec3(p, q, v);
      })
      .elseif(hi.equal(int(4)), () => {
        return vec3(t, p, v);
      });

    return vec3(v, p, q);
  });
});

const mx_rgbtohsv = tslFn(([c_immutable]) => {
  const c = vec3(c_immutable).toVar();
  const r = float(c.x).toVar();
  const g = float(c.y).toVar();
  const b = float(c.z).toVar();
  const mincomp = float(min(r, min(g, b))).toVar();
  const maxcomp = float(max(r, max(g, b))).toVar();
  const delta = float(maxcomp.sub(mincomp)).toVar();
  const h = float().toVar(),
    s = float().toVar(),
    v = float().toVar();
  v.assign(maxcomp);

  NodeStack.if(maxcomp.greaterThan(0.0), () => {
    s.assign(delta.div(maxcomp));
  }).else(() => {
    s.assign(0.0);
  });

  NodeStack.if(s.lessThanEqual(0.0), () => {
    h.assign(0.0);
  }).else(() => {
    NodeStack.if(r.greaterThanEqual(maxcomp), () => {
      h.assign(g.sub(b).div(delta));
    })
      .elseif(g.greaterThanEqual(maxcomp), () => {
        h.assign(add(2.0, b.sub(r).div(delta)));
      })
      .else(() => {
        h.assign(add(4.0, r.sub(g).div(delta)));
      });

    h.mulAssign(1.0 / 6.0);

    NodeStack.if(h.lessThan(0.0), () => {
      h.addAssign(1.0);
    });
  });

  return vec3(h, s, v);
});

// layouts

mx_hsvtorgb.setLayout({
  name: 'mx_hsvtorgb',
  type: 'vec3',
  inputs: [{ name: 'hsv', type: 'vec3' }],
});

mx_rgbtohsv.setLayout({
  name: 'mx_rgbtohsv',
  type: 'vec3',
  inputs: [{ name: 'c', type: 'vec3' }],
});

export { mx_hsvtorgb, mx_rgbtohsv };
