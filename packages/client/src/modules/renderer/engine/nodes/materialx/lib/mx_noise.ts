// engine.js Transpiler
// https://raw.githubusercontent.com/AcademySoftwareFoundation/MaterialX/main/libraries/stdlib/genglsl/lib/mx_noise.glsl

import { bool, f32, i32, NodeStack, tslFn, u32, uvec3, vec2, vec3, vec4 } from '../../shadernode/ShaderNodes.js';
import { cond } from '@modules/renderer/engine/nodes/math/CondNode.js';
import { mul, sub } from '@modules/renderer/engine/nodes/math/OperatorNode.js';
import { abs, dot, floor, max, min, sqrt } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { overloadingFn } from '../../utils/FunctionOverloadingNode.js';
import { loop } from '../../utils/LoopNode.js';

export const mx_select = tslFn(([b_immutable, t_immutable, f_immutable]) => {
  const f = f32(f_immutable).toVar();
  const t = f32(t_immutable).toVar();
  const b = bool(b_immutable).toVar();

  return cond(b, t, f);
});

export const mx_negate_if = tslFn(([val_immutable, b_immutable]) => {
  const b = bool(b_immutable).toVar();
  const val = f32(val_immutable).toVar();

  return cond(b, val.negate(), val);
});

export const mx_floor = tslFn(([x_immutable]) => {
  const x = f32(x_immutable).toVar();

  return i32(floor(x));
});

export const mx_floorfrac = tslFn(([x_immutable, i]) => {
  const x = f32(x_immutable).toVar();
  i.assign(mx_floor(x));

  return x.sub(f32(i));
});

const mx_bilerp_0 = tslFn(([v0_immutable, v1_immutable, v2_immutable, v3_immutable, s_immutable, t_immutable]) => {
  const t = f32(t_immutable).toVar();
  const s = f32(s_immutable).toVar();
  const v3 = f32(v3_immutable).toVar();
  const v2 = f32(v2_immutable).toVar();
  const v1 = f32(v1_immutable).toVar();
  const v0 = f32(v0_immutable).toVar();
  const s1 = f32(sub(1.0, s)).toVar();

  return sub(1.0, t)
    .mul(v0.mul(s1).add(v1.mul(s)))
    .add(t.mul(v2.mul(s1).add(v3.mul(s))));
});

const mx_bilerp_1 = tslFn(([v0_immutable, v1_immutable, v2_immutable, v3_immutable, s_immutable, t_immutable]) => {
  const t = f32(t_immutable).toVar();
  const s = f32(s_immutable).toVar();
  const v3 = vec3(v3_immutable).toVar();
  const v2 = vec3(v2_immutable).toVar();
  const v1 = vec3(v1_immutable).toVar();
  const v0 = vec3(v0_immutable).toVar();
  const s1 = f32(sub(1.0, s)).toVar();

  return sub(1.0, t)
    .mul(v0.mul(s1).add(v1.mul(s)))
    .add(t.mul(v2.mul(s1).add(v3.mul(s))));
});

export const mx_bilerp = overloadingFn([mx_bilerp_0, mx_bilerp_1]);

const mx_trilerp_0 = tslFn(
  ([
    v0_immutable,
    v1_immutable,
    v2_immutable,
    v3_immutable,
    v4_immutable,
    v5_immutable,
    v6_immutable,
    v7_immutable,
    s_immutable,
    t_immutable,
    r_immutable,
  ]) => {
    const r = f32(r_immutable).toVar();
    const t = f32(t_immutable).toVar();
    const s = f32(s_immutable).toVar();
    const v7 = f32(v7_immutable).toVar();
    const v6 = f32(v6_immutable).toVar();
    const v5 = f32(v5_immutable).toVar();
    const v4 = f32(v4_immutable).toVar();
    const v3 = f32(v3_immutable).toVar();
    const v2 = f32(v2_immutable).toVar();
    const v1 = f32(v1_immutable).toVar();
    const v0 = f32(v0_immutable).toVar();
    const s1 = f32(sub(1.0, s)).toVar();
    const t1 = f32(sub(1.0, t)).toVar();
    const r1 = f32(sub(1.0, r)).toVar();

    return r1
      .mul(t1.mul(v0.mul(s1).add(v1.mul(s))).add(t.mul(v2.mul(s1).add(v3.mul(s)))))
      .add(r.mul(t1.mul(v4.mul(s1).add(v5.mul(s))).add(t.mul(v6.mul(s1).add(v7.mul(s))))));
  },
);

const mx_trilerp_1 = tslFn(
  ([
    v0_immutable,
    v1_immutable,
    v2_immutable,
    v3_immutable,
    v4_immutable,
    v5_immutable,
    v6_immutable,
    v7_immutable,
    s_immutable,
    t_immutable,
    r_immutable,
  ]) => {
    const r = f32(r_immutable).toVar();
    const t = f32(t_immutable).toVar();
    const s = f32(s_immutable).toVar();
    const v7 = vec3(v7_immutable).toVar();
    const v6 = vec3(v6_immutable).toVar();
    const v5 = vec3(v5_immutable).toVar();
    const v4 = vec3(v4_immutable).toVar();
    const v3 = vec3(v3_immutable).toVar();
    const v2 = vec3(v2_immutable).toVar();
    const v1 = vec3(v1_immutable).toVar();
    const v0 = vec3(v0_immutable).toVar();
    const s1 = f32(sub(1.0, s)).toVar();
    const t1 = f32(sub(1.0, t)).toVar();
    const r1 = f32(sub(1.0, r)).toVar();

    return r1
      .mul(t1.mul(v0.mul(s1).add(v1.mul(s))).add(t.mul(v2.mul(s1).add(v3.mul(s)))))
      .add(r.mul(t1.mul(v4.mul(s1).add(v5.mul(s))).add(t.mul(v6.mul(s1).add(v7.mul(s))))));
  },
);

export const mx_trilerp = overloadingFn([mx_trilerp_0, mx_trilerp_1]);

const mx_gradient_float_0 = tslFn(([hash_immutable, x_immutable, y_immutable]) => {
  const y = f32(y_immutable).toVar();
  const x = f32(x_immutable).toVar();
  const hash = u32(hash_immutable).toVar();
  const h = u32(hash.bitAnd(u32(7))).toVar();
  const u = f32(mx_select(h.lessThan(u32(4)), x, y)).toVar();
  const v = f32(mul(2.0, mx_select(h.lessThan(u32(4)), y, x))).toVar();

  return mx_negate_if(u, bool(h.bitAnd(u32(1)))).add(mx_negate_if(v, bool(h.bitAnd(u32(2)))));
});

const mx_gradient_float_1 = tslFn(([hash_immutable, x_immutable, y_immutable, z_immutable]) => {
  const z = f32(z_immutable).toVar();
  const y = f32(y_immutable).toVar();
  const x = f32(x_immutable).toVar();
  const hash = u32(hash_immutable).toVar();
  const h = u32(hash.bitAnd(u32(15))).toVar();
  const u = f32(mx_select(h.lessThan(u32(8)), x, y)).toVar();
  const v = f32(mx_select(h.lessThan(u32(4)), y, mx_select(h.equal(u32(12)).or(h.equal(u32(14))), x, z))).toVar();

  return mx_negate_if(u, bool(h.bitAnd(u32(1)))).add(mx_negate_if(v, bool(h.bitAnd(u32(2)))));
});

export const mx_gradient_float = overloadingFn([mx_gradient_float_0, mx_gradient_float_1]);

const mx_gradient_vec3_0 = tslFn(([hash_immutable, x_immutable, y_immutable]) => {
  const y = f32(y_immutable).toVar();
  const x = f32(x_immutable).toVar();
  const hash = uvec3(hash_immutable).toVar();

  return vec3(mx_gradient_float(hash.x, x, y), mx_gradient_float(hash.y, x, y), mx_gradient_float(hash.z, x, y));
});

const mx_gradient_vec3_1 = tslFn(([hash_immutable, x_immutable, y_immutable, z_immutable]) => {
  const z = f32(z_immutable).toVar();
  const y = f32(y_immutable).toVar();
  const x = f32(x_immutable).toVar();
  const hash = uvec3(hash_immutable).toVar();

  return vec3(
    mx_gradient_float(hash.x, x, y, z),
    mx_gradient_float(hash.y, x, y, z),
    mx_gradient_float(hash.z, x, y, z),
  );
});

export const mx_gradient_vec3 = overloadingFn([mx_gradient_vec3_0, mx_gradient_vec3_1]);

const mx_gradient_scale2d_0 = tslFn(([v_immutable]) => {
  const v = f32(v_immutable).toVar();

  return mul(0.6616, v);
});

const mx_gradient_scale3d_0 = tslFn(([v_immutable]) => {
  const v = f32(v_immutable).toVar();

  return mul(0.982, v);
});

const mx_gradient_scale2d_1 = tslFn(([v_immutable]) => {
  const v = vec3(v_immutable).toVar();

  return mul(0.6616, v);
});

export const mx_gradient_scale2d = overloadingFn([mx_gradient_scale2d_0, mx_gradient_scale2d_1]);

const mx_gradient_scale3d_1 = tslFn(([v_immutable]) => {
  const v = vec3(v_immutable).toVar();

  return mul(0.982, v);
});

export const mx_gradient_scale3d = overloadingFn([mx_gradient_scale3d_0, mx_gradient_scale3d_1]);

export const mx_rotl32 = tslFn(([x_immutable, k_immutable]) => {
  const k = i32(k_immutable).toVar();
  const x = u32(x_immutable).toVar();

  return x.shiftLeft(k).bitOr(x.shiftRight(i32(32).sub(k)));
});

export const mx_bjmix = tslFn(([a, b, c]) => {
  a.subAssign(c);
  a.bitXorAssign(mx_rotl32(c, i32(4)));
  c.addAssign(b);
  b.subAssign(a);
  b.bitXorAssign(mx_rotl32(a, i32(6)));
  a.addAssign(c);
  c.subAssign(b);
  c.bitXorAssign(mx_rotl32(b, i32(8)));
  b.addAssign(a);
  a.subAssign(c);
  a.bitXorAssign(mx_rotl32(c, i32(16)));
  c.addAssign(b);
  b.subAssign(a);
  b.bitXorAssign(mx_rotl32(a, i32(19)));
  a.addAssign(c);
  c.subAssign(b);
  c.bitXorAssign(mx_rotl32(b, i32(4)));
  b.addAssign(a);
});

export const mx_bjfinal = tslFn(([a_immutable, b_immutable, c_immutable]) => {
  const c = u32(c_immutable).toVar();
  const b = u32(b_immutable).toVar();
  const a = u32(a_immutable).toVar();
  c.bitXorAssign(b);
  c.subAssign(mx_rotl32(b, i32(14)));
  a.bitXorAssign(c);
  a.subAssign(mx_rotl32(c, i32(11)));
  b.bitXorAssign(a);
  b.subAssign(mx_rotl32(a, i32(25)));
  c.bitXorAssign(b);
  c.subAssign(mx_rotl32(b, i32(16)));
  a.bitXorAssign(c);
  a.subAssign(mx_rotl32(c, i32(4)));
  b.bitXorAssign(a);
  b.subAssign(mx_rotl32(a, i32(14)));
  c.bitXorAssign(b);
  c.subAssign(mx_rotl32(b, i32(24)));

  return c;
});

export const mx_bits_to_01 = tslFn(([bits_immutable]) => {
  const bits = u32(bits_immutable).toVar();

  return f32(bits).div(f32(u32(i32(0xffffffff))));
});

export const mx_fade = tslFn(([t_immutable]) => {
  const t = f32(t_immutable).toVar();

  return t.mul(t.mul(t.mul(t.mul(t.mul(6.0).sub(15.0)).add(10.0))));
});

const mx_hash_int_0 = tslFn(([x_immutable]) => {
  const x = i32(x_immutable).toVar();
  const len = u32(u32(1)).toVar();
  const seed = u32(u32(i32(0xdeadbeef)).add(len.shiftLeft(u32(2)).add(u32(13)))).toVar();

  return mx_bjfinal(seed.add(u32(x)), seed, seed);
});

const mx_hash_int_1 = tslFn(([x_immutable, y_immutable]) => {
  const y = i32(y_immutable).toVar();
  const x = i32(x_immutable).toVar();
  const len = u32(u32(2)).toVar();
  const a = u32().toVar(),
    b = u32().toVar(),
    c = u32().toVar();
  a.assign(b.assign(c.assign(u32(i32(0xdeadbeef)).add(len.shiftLeft(u32(2)).add(u32(13))))));
  a.addAssign(u32(x));
  b.addAssign(u32(y));

  return mx_bjfinal(a, b, c);
});

const mx_hash_int_2 = tslFn(([x_immutable, y_immutable, z_immutable]) => {
  const z = i32(z_immutable).toVar();
  const y = i32(y_immutable).toVar();
  const x = i32(x_immutable).toVar();
  const len = u32(u32(3)).toVar();
  const a = u32().toVar(),
    b = u32().toVar(),
    c = u32().toVar();
  a.assign(b.assign(c.assign(u32(i32(0xdeadbeef)).add(len.shiftLeft(u32(2)).add(u32(13))))));
  a.addAssign(u32(x));
  b.addAssign(u32(y));
  c.addAssign(u32(z));

  return mx_bjfinal(a, b, c);
});

const mx_hash_int_3 = tslFn(([x_immutable, y_immutable, z_immutable, xx_immutable]) => {
  const xx = i32(xx_immutable).toVar();
  const z = i32(z_immutable).toVar();
  const y = i32(y_immutable).toVar();
  const x = i32(x_immutable).toVar();
  const len = u32(u32(4)).toVar();
  const a = u32().toVar(),
    b = u32().toVar(),
    c = u32().toVar();
  a.assign(b.assign(c.assign(u32(i32(0xdeadbeef)).add(len.shiftLeft(u32(2)).add(u32(13))))));
  a.addAssign(u32(x));
  b.addAssign(u32(y));
  c.addAssign(u32(z));
  mx_bjmix(a, b, c);
  a.addAssign(u32(xx));

  return mx_bjfinal(a, b, c);
});

const mx_hash_int_4 = tslFn(([x_immutable, y_immutable, z_immutable, xx_immutable, yy_immutable]) => {
  const yy = i32(yy_immutable).toVar();
  const xx = i32(xx_immutable).toVar();
  const z = i32(z_immutable).toVar();
  const y = i32(y_immutable).toVar();
  const x = i32(x_immutable).toVar();
  const len = u32(u32(5)).toVar();
  const a = u32().toVar(),
    b = u32().toVar(),
    c = u32().toVar();
  a.assign(b.assign(c.assign(u32(i32(0xdeadbeef)).add(len.shiftLeft(u32(2)).add(u32(13))))));
  a.addAssign(u32(x));
  b.addAssign(u32(y));
  c.addAssign(u32(z));
  mx_bjmix(a, b, c);
  a.addAssign(u32(xx));
  b.addAssign(u32(yy));

  return mx_bjfinal(a, b, c);
});

export const mx_hash_int = overloadingFn([mx_hash_int_0, mx_hash_int_1, mx_hash_int_2, mx_hash_int_3, mx_hash_int_4]);

const mx_hash_vec3_0 = tslFn(([x_immutable, y_immutable]) => {
  const y = i32(y_immutable).toVar();
  const x = i32(x_immutable).toVar();
  const h = u32(mx_hash_int(x, y)).toVar();
  const result = uvec3().toVar();
  result.x.assign(h.bitAnd(i32(0xff)));
  result.y.assign(h.shiftRight(i32(8)).bitAnd(i32(0xff)));
  result.z.assign(h.shiftRight(i32(16)).bitAnd(i32(0xff)));

  return result;
});

const mx_hash_vec3_1 = tslFn(([x_immutable, y_immutable, z_immutable]) => {
  const z = i32(z_immutable).toVar();
  const y = i32(y_immutable).toVar();
  const x = i32(x_immutable).toVar();
  const h = u32(mx_hash_int(x, y, z)).toVar();
  const result = uvec3().toVar();
  result.x.assign(h.bitAnd(i32(0xff)));
  result.y.assign(h.shiftRight(i32(8)).bitAnd(i32(0xff)));
  result.z.assign(h.shiftRight(i32(16)).bitAnd(i32(0xff)));

  return result;
});

export const mx_hash_vec3 = overloadingFn([mx_hash_vec3_0, mx_hash_vec3_1]);

const mx_perlin_noise_float_0 = tslFn(([p_immutable]) => {
  const p = vec2(p_immutable).toVar();
  const X = i32().toVar(),
    Y = i32().toVar();
  const fx = f32(mx_floorfrac(p.x, X)).toVar();
  const fy = f32(mx_floorfrac(p.y, Y)).toVar();
  const u = f32(mx_fade(fx)).toVar();
  const v = f32(mx_fade(fy)).toVar();
  const result = f32(
    mx_bilerp(
      mx_gradient_float(mx_hash_int(X, Y), fx, fy),
      mx_gradient_float(mx_hash_int(X.add(i32(1)), Y), fx.sub(1.0), fy),
      mx_gradient_float(mx_hash_int(X, Y.add(i32(1))), fx, fy.sub(1.0)),
      mx_gradient_float(mx_hash_int(X.add(i32(1)), Y.add(i32(1))), fx.sub(1.0), fy.sub(1.0)),
      u,
      v,
    ),
  ).toVar();

  return mx_gradient_scale2d(result);
});

const mx_perlin_noise_float_1 = tslFn(([p_immutable]) => {
  const p = vec3(p_immutable).toVar();
  const X = i32().toVar(),
    Y = i32().toVar(),
    Z = i32().toVar();
  const fx = f32(mx_floorfrac(p.x, X)).toVar();
  const fy = f32(mx_floorfrac(p.y, Y)).toVar();
  const fz = f32(mx_floorfrac(p.z, Z)).toVar();
  const u = f32(mx_fade(fx)).toVar();
  const v = f32(mx_fade(fy)).toVar();
  const w = f32(mx_fade(fz)).toVar();
  const result = f32(
    mx_trilerp(
      mx_gradient_float(mx_hash_int(X, Y, Z), fx, fy, fz),
      mx_gradient_float(mx_hash_int(X.add(i32(1)), Y, Z), fx.sub(1.0), fy, fz),
      mx_gradient_float(mx_hash_int(X, Y.add(i32(1)), Z), fx, fy.sub(1.0), fz),
      mx_gradient_float(mx_hash_int(X.add(i32(1)), Y.add(i32(1)), Z), fx.sub(1.0), fy.sub(1.0), fz),
      mx_gradient_float(mx_hash_int(X, Y, Z.add(i32(1))), fx, fy, fz.sub(1.0)),
      mx_gradient_float(mx_hash_int(X.add(i32(1)), Y, Z.add(i32(1))), fx.sub(1.0), fy, fz.sub(1.0)),
      mx_gradient_float(mx_hash_int(X, Y.add(i32(1)), Z.add(i32(1))), fx, fy.sub(1.0), fz.sub(1.0)),
      mx_gradient_float(
        mx_hash_int(X.add(i32(1)), Y.add(i32(1)), Z.add(i32(1))),
        fx.sub(1.0),
        fy.sub(1.0),
        fz.sub(1.0),
      ),
      u,
      v,
      w,
    ),
  ).toVar();

  return mx_gradient_scale3d(result);
});

export const mx_perlin_noise_float = overloadingFn([mx_perlin_noise_float_0, mx_perlin_noise_float_1]);

const mx_perlin_noise_vec3_0 = tslFn(([p_immutable]) => {
  const p = vec2(p_immutable).toVar();
  const X = i32().toVar(),
    Y = i32().toVar();
  const fx = f32(mx_floorfrac(p.x, X)).toVar();
  const fy = f32(mx_floorfrac(p.y, Y)).toVar();
  const u = f32(mx_fade(fx)).toVar();
  const v = f32(mx_fade(fy)).toVar();
  const result = vec3(
    mx_bilerp(
      mx_gradient_vec3(mx_hash_vec3(X, Y), fx, fy),
      mx_gradient_vec3(mx_hash_vec3(X.add(i32(1)), Y), fx.sub(1.0), fy),
      mx_gradient_vec3(mx_hash_vec3(X, Y.add(i32(1))), fx, fy.sub(1.0)),
      mx_gradient_vec3(mx_hash_vec3(X.add(i32(1)), Y.add(i32(1))), fx.sub(1.0), fy.sub(1.0)),
      u,
      v,
    ),
  ).toVar();

  return mx_gradient_scale2d(result);
});

const mx_perlin_noise_vec3_1 = tslFn(([p_immutable]) => {
  const p = vec3(p_immutable).toVar();
  const X = i32().toVar(),
    Y = i32().toVar(),
    Z = i32().toVar();
  const fx = f32(mx_floorfrac(p.x, X)).toVar();
  const fy = f32(mx_floorfrac(p.y, Y)).toVar();
  const fz = f32(mx_floorfrac(p.z, Z)).toVar();
  const u = f32(mx_fade(fx)).toVar();
  const v = f32(mx_fade(fy)).toVar();
  const w = f32(mx_fade(fz)).toVar();
  const result = vec3(
    mx_trilerp(
      mx_gradient_vec3(mx_hash_vec3(X, Y, Z), fx, fy, fz),
      mx_gradient_vec3(mx_hash_vec3(X.add(i32(1)), Y, Z), fx.sub(1.0), fy, fz),
      mx_gradient_vec3(mx_hash_vec3(X, Y.add(i32(1)), Z), fx, fy.sub(1.0), fz),
      mx_gradient_vec3(mx_hash_vec3(X.add(i32(1)), Y.add(i32(1)), Z), fx.sub(1.0), fy.sub(1.0), fz),
      mx_gradient_vec3(mx_hash_vec3(X, Y, Z.add(i32(1))), fx, fy, fz.sub(1.0)),
      mx_gradient_vec3(mx_hash_vec3(X.add(i32(1)), Y, Z.add(i32(1))), fx.sub(1.0), fy, fz.sub(1.0)),
      mx_gradient_vec3(mx_hash_vec3(X, Y.add(i32(1)), Z.add(i32(1))), fx, fy.sub(1.0), fz.sub(1.0)),
      mx_gradient_vec3(
        mx_hash_vec3(X.add(i32(1)), Y.add(i32(1)), Z.add(i32(1))),
        fx.sub(1.0),
        fy.sub(1.0),
        fz.sub(1.0),
      ),
      u,
      v,
      w,
    ),
  ).toVar();

  return mx_gradient_scale3d(result);
});

export const mx_perlin_noise_vec3 = overloadingFn([mx_perlin_noise_vec3_0, mx_perlin_noise_vec3_1]);

const mx_cell_noise_float_0 = tslFn(([p_immutable]) => {
  const p = f32(p_immutable).toVar();
  const ix = i32(mx_floor(p)).toVar();

  return mx_bits_to_01(mx_hash_int(ix));
});

const mx_cell_noise_float_1 = tslFn(([p_immutable]) => {
  const p = vec2(p_immutable).toVar();
  const ix = i32(mx_floor(p.x)).toVar();
  const iy = i32(mx_floor(p.y)).toVar();

  return mx_bits_to_01(mx_hash_int(ix, iy));
});

const mx_cell_noise_float_2 = tslFn(([p_immutable]) => {
  const p = vec3(p_immutable).toVar();
  const ix = i32(mx_floor(p.x)).toVar();
  const iy = i32(mx_floor(p.y)).toVar();
  const iz = i32(mx_floor(p.z)).toVar();

  return mx_bits_to_01(mx_hash_int(ix, iy, iz));
});

const mx_cell_noise_float_3 = tslFn(([p_immutable]) => {
  const p = vec4(p_immutable).toVar();
  const ix = i32(mx_floor(p.x)).toVar();
  const iy = i32(mx_floor(p.y)).toVar();
  const iz = i32(mx_floor(p.z)).toVar();
  const iw = i32(mx_floor(p.w)).toVar();

  return mx_bits_to_01(mx_hash_int(ix, iy, iz, iw));
});

export const mx_cell_noise_float = overloadingFn([
  mx_cell_noise_float_0,
  mx_cell_noise_float_1,
  mx_cell_noise_float_2,
  mx_cell_noise_float_3,
]);

const mx_cell_noise_vec3_0 = tslFn(([p_immutable]) => {
  const p = f32(p_immutable).toVar();
  const ix = i32(mx_floor(p)).toVar();

  return vec3(
    mx_bits_to_01(mx_hash_int(ix, i32(0))),
    mx_bits_to_01(mx_hash_int(ix, i32(1))),
    mx_bits_to_01(mx_hash_int(ix, i32(2))),
  );
});

const mx_cell_noise_vec3_1 = tslFn(([p_immutable]) => {
  const p = vec2(p_immutable).toVar();
  const ix = i32(mx_floor(p.x)).toVar();
  const iy = i32(mx_floor(p.y)).toVar();

  return vec3(
    mx_bits_to_01(mx_hash_int(ix, iy, i32(0))),
    mx_bits_to_01(mx_hash_int(ix, iy, i32(1))),
    mx_bits_to_01(mx_hash_int(ix, iy, i32(2))),
  );
});

const mx_cell_noise_vec3_2 = tslFn(([p_immutable]) => {
  const p = vec3(p_immutable).toVar();
  const ix = i32(mx_floor(p.x)).toVar();
  const iy = i32(mx_floor(p.y)).toVar();
  const iz = i32(mx_floor(p.z)).toVar();

  return vec3(
    mx_bits_to_01(mx_hash_int(ix, iy, iz, i32(0))),
    mx_bits_to_01(mx_hash_int(ix, iy, iz, i32(1))),
    mx_bits_to_01(mx_hash_int(ix, iy, iz, i32(2))),
  );
});

const mx_cell_noise_vec3_3 = tslFn(([p_immutable]) => {
  const p = vec4(p_immutable).toVar();
  const ix = i32(mx_floor(p.x)).toVar();
  const iy = i32(mx_floor(p.y)).toVar();
  const iz = i32(mx_floor(p.z)).toVar();
  const iw = i32(mx_floor(p.w)).toVar();

  return vec3(
    mx_bits_to_01(mx_hash_int(ix, iy, iz, iw, i32(0))),
    mx_bits_to_01(mx_hash_int(ix, iy, iz, iw, i32(1))),
    mx_bits_to_01(mx_hash_int(ix, iy, iz, iw, i32(2))),
  );
});

export const mx_cell_noise_vec3 = overloadingFn([
  mx_cell_noise_vec3_0,
  mx_cell_noise_vec3_1,
  mx_cell_noise_vec3_2,
  mx_cell_noise_vec3_3,
]);

export const mx_fractal_noise_float = tslFn(
  ([p_immutable, octaves_immutable, lacunarity_immutable, diminish_immutable]) => {
    const diminish = f32(diminish_immutable).toVar();
    const lacunarity = f32(lacunarity_immutable).toVar();
    const octaves = i32(octaves_immutable).toVar();
    const p = vec3(p_immutable).toVar();
    const result = f32(0.0).toVar();
    const amplitude = f32(1.0).toVar();

    loop({ start: i32(0), end: octaves }, ({ i }) => {
      result.addAssign(amplitude.mul(mx_perlin_noise_float(p)));
      amplitude.mulAssign(diminish);
      p.mulAssign(lacunarity);
    });

    return result;
  },
);

export const mx_fractal_noise_vec3 = tslFn(
  ([p_immutable, octaves_immutable, lacunarity_immutable, diminish_immutable]) => {
    const diminish = f32(diminish_immutable).toVar();
    const lacunarity = f32(lacunarity_immutable).toVar();
    const octaves = i32(octaves_immutable).toVar();
    const p = vec3(p_immutable).toVar();
    const result = vec3(0.0).toVar();
    const amplitude = f32(1.0).toVar();

    loop({ start: i32(0), end: octaves }, ({ i }) => {
      result.addAssign(amplitude.mul(mx_perlin_noise_vec3(p)));
      amplitude.mulAssign(diminish);
      p.mulAssign(lacunarity);
    });

    return result;
  },
);

export const mx_fractal_noise_vec2 = tslFn(
  ([p_immutable, octaves_immutable, lacunarity_immutable, diminish_immutable]) => {
    const diminish = f32(diminish_immutable).toVar();
    const lacunarity = f32(lacunarity_immutable).toVar();
    const octaves = i32(octaves_immutable).toVar();
    const p = vec3(p_immutable).toVar();

    return vec2(
      mx_fractal_noise_float(p, octaves, lacunarity, diminish),
      mx_fractal_noise_float(p.add(vec3(i32(19), i32(193), i32(17))), octaves, lacunarity, diminish),
    );
  },
);

export const mx_fractal_noise_vec4 = tslFn(
  ([p_immutable, octaves_immutable, lacunarity_immutable, diminish_immutable]) => {
    const diminish = f32(diminish_immutable).toVar();
    const lacunarity = f32(lacunarity_immutable).toVar();
    const octaves = i32(octaves_immutable).toVar();
    const p = vec3(p_immutable).toVar();
    const c = vec3(mx_fractal_noise_vec3(p, octaves, lacunarity, diminish)).toVar();
    const f = f32(
      mx_fractal_noise_float(p.add(vec3(i32(19), i32(193), i32(17))), octaves, lacunarity, diminish),
    ).toVar();

    return vec4(c, f);
  },
);

const mx_worley_distance_0 = tslFn(
  ([p_immutable, x_immutable, y_immutable, xoff_immutable, yoff_immutable, jitter_immutable, metric_immutable]) => {
    const metric = i32(metric_immutable).toVar();
    const jitter = f32(jitter_immutable).toVar();
    const yoff = i32(yoff_immutable).toVar();
    const xoff = i32(xoff_immutable).toVar();
    const y = i32(y_immutable).toVar();
    const x = i32(x_immutable).toVar();
    const p = vec2(p_immutable).toVar();
    const tmp = vec3(mx_cell_noise_vec3(vec2(x.add(xoff), y.add(yoff)))).toVar();
    const off = vec2(tmp.x, tmp.y).toVar();
    off.subAssign(0.5);
    off.mulAssign(jitter);
    off.addAssign(0.5);
    const cellpos = vec2(vec2(f32(x), f32(y)).add(off)).toVar();
    const diff = vec2(cellpos.sub(p)).toVar();

    NodeStack.if(metric.equal(i32(2)), () => {
      return abs(diff.x).add(abs(diff.y));
    });

    NodeStack.if(metric.equal(i32(3)), () => {
      return max(abs(diff.x), abs(diff.y));
    });

    return dot(diff, diff);
  },
);

const mx_worley_distance_1 = tslFn(
  ([
    p_immutable,
    x_immutable,
    y_immutable,
    z_immutable,
    xoff_immutable,
    yoff_immutable,
    zoff_immutable,
    jitter_immutable,
    metric_immutable,
  ]) => {
    const metric = i32(metric_immutable).toVar();
    const jitter = f32(jitter_immutable).toVar();
    const zoff = i32(zoff_immutable).toVar();
    const yoff = i32(yoff_immutable).toVar();
    const xoff = i32(xoff_immutable).toVar();
    const z = i32(z_immutable).toVar();
    const y = i32(y_immutable).toVar();
    const x = i32(x_immutable).toVar();
    const p = vec3(p_immutable).toVar();
    const off = vec3(mx_cell_noise_vec3(vec3(x.add(xoff), y.add(yoff), z.add(zoff)))).toVar();
    off.subAssign(0.5);
    off.mulAssign(jitter);
    off.addAssign(0.5);
    const cellpos = vec3(vec3(f32(x), f32(y), f32(z)).add(off)).toVar();
    const diff = vec3(cellpos.sub(p)).toVar();

    NodeStack.if(metric.equal(i32(2)), () => {
      return abs(diff.x).add(abs(diff.y).add(abs(diff.z)));
    });

    NodeStack.if(metric.equal(i32(3)), () => {
      return max(max(abs(diff.x), abs(diff.y)), abs(diff.z));
    });

    return dot(diff, diff);
  },
);

export const mx_worley_distance = overloadingFn([mx_worley_distance_0, mx_worley_distance_1]);

const mx_worley_noise_float_0 = tslFn(([p_immutable, jitter_immutable, metric_immutable]) => {
  const metric = i32(metric_immutable).toVar();
  const jitter = f32(jitter_immutable).toVar();
  const p = vec2(p_immutable).toVar();
  const X = i32().toVar(),
    Y = i32().toVar();
  const localpos = vec2(mx_floorfrac(p.x, X), mx_floorfrac(p.y, Y)).toVar();
  const sqdist = f32(1e6).toVar();

  loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
    loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
      const dist = f32(mx_worley_distance(localpos, x, y, X, Y, jitter, metric)).toVar();
      sqdist.assign(min(sqdist, dist));
    });
  });

  NodeStack.if(metric.equal(i32(0)), () => {
    sqdist.assign(sqrt(sqdist));
  });

  return sqdist;
});

const mx_worley_noise_vec2_0 = tslFn(([p_immutable, jitter_immutable, metric_immutable]) => {
  const metric = i32(metric_immutable).toVar();
  const jitter = f32(jitter_immutable).toVar();
  const p = vec2(p_immutable).toVar();
  const X = i32().toVar(),
    Y = i32().toVar();
  const localpos = vec2(mx_floorfrac(p.x, X), mx_floorfrac(p.y, Y)).toVar();
  const sqdist = vec2(1e6, 1e6).toVar();

  loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
    loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
      const dist = f32(mx_worley_distance(localpos, x, y, X, Y, jitter, metric)).toVar();

      NodeStack.if(dist.lessThan(sqdist.x), () => {
        sqdist.y.assign(sqdist.x);
        sqdist.x.assign(dist);
      }).elseif(dist.lessThan(sqdist.y), () => {
        sqdist.y.assign(dist);
      });
    });
  });

  NodeStack.if(metric.equal(i32(0)), () => {
    sqdist.assign(sqrt(sqdist));
  });

  return sqdist;
});

const mx_worley_noise_vec3_0 = tslFn(([p_immutable, jitter_immutable, metric_immutable]) => {
  const metric = i32(metric_immutable).toVar();
  const jitter = f32(jitter_immutable).toVar();
  const p = vec2(p_immutable).toVar();
  const X = i32().toVar(),
    Y = i32().toVar();
  const localpos = vec2(mx_floorfrac(p.x, X), mx_floorfrac(p.y, Y)).toVar();
  const sqdist = vec3(1e6, 1e6, 1e6).toVar();

  loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
    loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
      const dist = f32(mx_worley_distance(localpos, x, y, X, Y, jitter, metric)).toVar();

      NodeStack.if(dist.lessThan(sqdist.x), () => {
        sqdist.z.assign(sqdist.y);
        sqdist.y.assign(sqdist.x);
        sqdist.x.assign(dist);
      })
        .elseif(dist.lessThan(sqdist.y), () => {
          sqdist.z.assign(sqdist.y);
          sqdist.y.assign(dist);
        })
        .elseif(dist.lessThan(sqdist.z), () => {
          sqdist.z.assign(dist);
        });
    });
  });

  NodeStack.if(metric.equal(i32(0)), () => {
    sqdist.assign(sqrt(sqdist));
  });

  return sqdist;
});

const mx_worley_noise_float_1 = tslFn(([p_immutable, jitter_immutable, metric_immutable]) => {
  const metric = i32(metric_immutable).toVar();
  const jitter = f32(jitter_immutable).toVar();
  const p = vec3(p_immutable).toVar();
  const X = i32().toVar(),
    Y = i32().toVar(),
    Z = i32().toVar();
  const localpos = vec3(mx_floorfrac(p.x, X), mx_floorfrac(p.y, Y), mx_floorfrac(p.z, Z)).toVar();
  const sqdist = f32(1e6).toVar();

  loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
    loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
      loop({ start: -1, end: i32(1), name: 'z', condition: '<=' }, ({ z }) => {
        const dist = f32(mx_worley_distance(localpos, x, y, z, X, Y, Z, jitter, metric)).toVar();
        sqdist.assign(min(sqdist, dist));
      });
    });
  });

  NodeStack.if(metric.equal(i32(0)), () => {
    sqdist.assign(sqrt(sqdist));
  });

  return sqdist;
});

export const mx_worley_noise_float = overloadingFn([mx_worley_noise_float_0, mx_worley_noise_float_1]);

const mx_worley_noise_vec2_1 = tslFn(([p_immutable, jitter_immutable, metric_immutable]) => {
  const metric = i32(metric_immutable).toVar();
  const jitter = f32(jitter_immutable).toVar();
  const p = vec3(p_immutable).toVar();
  const X = i32().toVar(),
    Y = i32().toVar(),
    Z = i32().toVar();
  const localpos = vec3(mx_floorfrac(p.x, X), mx_floorfrac(p.y, Y), mx_floorfrac(p.z, Z)).toVar();
  const sqdist = vec2(1e6, 1e6).toVar();

  loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
    loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
      loop({ start: -1, end: i32(1), name: 'z', condition: '<=' }, ({ z }) => {
        const dist = f32(mx_worley_distance(localpos, x, y, z, X, Y, Z, jitter, metric)).toVar();

        NodeStack.if(dist.lessThan(sqdist.x), () => {
          sqdist.y.assign(sqdist.x);
          sqdist.x.assign(dist);
        }).elseif(dist.lessThan(sqdist.y), () => {
          sqdist.y.assign(dist);
        });
      });
    });
  });

  NodeStack.if(metric.equal(i32(0)), () => {
    sqdist.assign(sqrt(sqdist));
  });

  return sqdist;
});

export const mx_worley_noise_vec2 = overloadingFn([mx_worley_noise_vec2_0, mx_worley_noise_vec2_1]);

const mx_worley_noise_vec3_1 = tslFn(([p_immutable, jitter_immutable, metric_immutable]) => {
  const metric = i32(metric_immutable).toVar();
  const jitter = f32(jitter_immutable).toVar();
  const p = vec3(p_immutable).toVar();
  const X = i32().toVar(),
    Y = i32().toVar(),
    Z = i32().toVar();
  const localpos = vec3(mx_floorfrac(p.x, X), mx_floorfrac(p.y, Y), mx_floorfrac(p.z, Z)).toVar();
  const sqdist = vec3(1e6, 1e6, 1e6).toVar();

  loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
    loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
      loop({ start: -1, end: i32(1), name: 'z', condition: '<=' }, ({ z }) => {
        const dist = f32(mx_worley_distance(localpos, x, y, z, X, Y, Z, jitter, metric)).toVar();

        NodeStack.if(dist.lessThan(sqdist.x), () => {
          sqdist.z.assign(sqdist.y);
          sqdist.y.assign(sqdist.x);
          sqdist.x.assign(dist);
        })
          .elseif(dist.lessThan(sqdist.y), () => {
            sqdist.z.assign(sqdist.y);
            sqdist.y.assign(dist);
          })
          .elseif(dist.lessThan(sqdist.z), () => {
            sqdist.z.assign(dist);
          });
      });
    });
  });

  NodeStack.if(metric.equal(i32(0)), () => {
    sqdist.assign(sqrt(sqdist));
  });

  return sqdist;
});

export const mx_worley_noise_vec3 = overloadingFn([mx_worley_noise_vec3_0, mx_worley_noise_vec3_1]);

// layouts

mx_select.setLayout({
  name: 'mx_select',
  type: 'f32',
  inputs: [
    { name: 'b', type: 'bool' },
    { name: 't', type: 'f32' },
    { name: 'f', type: 'f32' },
  ],
});

mx_negate_if.setLayout({
  name: 'mx_negate_if',
  type: 'f32',
  inputs: [
    { name: 'val', type: 'f32' },
    { name: 'b', type: 'bool' },
  ],
});

mx_floor.setLayout({
  name: 'mx_floor',
  type: 'i32',
  inputs: [{ name: 'x', type: 'f32' }],
});

mx_bilerp_0.setLayout({
  name: 'mx_bilerp_0',
  type: 'f32',
  inputs: [
    { name: 'v0', type: 'f32' },
    { name: 'v1', type: 'f32' },
    { name: 'v2', type: 'f32' },
    { name: 'v3', type: 'f32' },
    { name: 's', type: 'f32' },
    { name: 't', type: 'f32' },
  ],
});

mx_bilerp_1.setLayout({
  name: 'mx_bilerp_1',
  type: 'vec3',
  inputs: [
    { name: 'v0', type: 'vec3' },
    { name: 'v1', type: 'vec3' },
    { name: 'v2', type: 'vec3' },
    { name: 'v3', type: 'vec3' },
    { name: 's', type: 'f32' },
    { name: 't', type: 'f32' },
  ],
});

mx_trilerp_0.setLayout({
  name: 'mx_trilerp_0',
  type: 'f32',
  inputs: [
    { name: 'v0', type: 'f32' },
    { name: 'v1', type: 'f32' },
    { name: 'v2', type: 'f32' },
    { name: 'v3', type: 'f32' },
    { name: 'v4', type: 'f32' },
    { name: 'v5', type: 'f32' },
    { name: 'v6', type: 'f32' },
    { name: 'v7', type: 'f32' },
    { name: 's', type: 'f32' },
    { name: 't', type: 'f32' },
    { name: 'r', type: 'f32' },
  ],
});

mx_trilerp_1.setLayout({
  name: 'mx_trilerp_1',
  type: 'vec3',
  inputs: [
    { name: 'v0', type: 'vec3' },
    { name: 'v1', type: 'vec3' },
    { name: 'v2', type: 'vec3' },
    { name: 'v3', type: 'vec3' },
    { name: 'v4', type: 'vec3' },
    { name: 'v5', type: 'vec3' },
    { name: 'v6', type: 'vec3' },
    { name: 'v7', type: 'vec3' },
    { name: 's', type: 'f32' },
    { name: 't', type: 'f32' },
    { name: 'r', type: 'f32' },
  ],
});

mx_gradient_float_0.setLayout({
  name: 'mx_gradient_float_0',
  type: 'f32',
  inputs: [
    { name: 'hash', type: 'u32' },
    { name: 'x', type: 'f32' },
    { name: 'y', type: 'f32' },
  ],
});

mx_gradient_float_1.setLayout({
  name: 'mx_gradient_float_1',
  type: 'f32',
  inputs: [
    { name: 'hash', type: 'u32' },
    { name: 'x', type: 'f32' },
    { name: 'y', type: 'f32' },
    { name: 'z', type: 'f32' },
  ],
});

mx_gradient_vec3_0.setLayout({
  name: 'mx_gradient_vec3_0',
  type: 'vec3',
  inputs: [
    { name: 'hash', type: 'uvec3' },
    { name: 'x', type: 'f32' },
    { name: 'y', type: 'f32' },
  ],
});

mx_gradient_vec3_1.setLayout({
  name: 'mx_gradient_vec3_1',
  type: 'vec3',
  inputs: [
    { name: 'hash', type: 'uvec3' },
    { name: 'x', type: 'f32' },
    { name: 'y', type: 'f32' },
    { name: 'z', type: 'f32' },
  ],
});

mx_gradient_scale2d_0.setLayout({
  name: 'mx_gradient_scale2d_0',
  type: 'f32',
  inputs: [{ name: 'v', type: 'f32' }],
});

mx_gradient_scale3d_0.setLayout({
  name: 'mx_gradient_scale3d_0',
  type: 'f32',
  inputs: [{ name: 'v', type: 'f32' }],
});

mx_gradient_scale2d_1.setLayout({
  name: 'mx_gradient_scale2d_1',
  type: 'vec3',
  inputs: [{ name: 'v', type: 'vec3' }],
});

mx_gradient_scale3d_1.setLayout({
  name: 'mx_gradient_scale3d_1',
  type: 'vec3',
  inputs: [{ name: 'v', type: 'vec3' }],
});

mx_rotl32.setLayout({
  name: 'mx_rotl32',
  type: 'u32',
  inputs: [
    { name: 'x', type: 'u32' },
    { name: 'k', type: 'i32' },
  ],
});

mx_bjfinal.setLayout({
  name: 'mx_bjfinal',
  type: 'u32',
  inputs: [
    { name: 'a', type: 'u32' },
    { name: 'b', type: 'u32' },
    { name: 'c', type: 'u32' },
  ],
});

mx_bits_to_01.setLayout({
  name: 'mx_bits_to_01',
  type: 'f32',
  inputs: [{ name: 'bits', type: 'u32' }],
});

mx_fade.setLayout({
  name: 'mx_fade',
  type: 'f32',
  inputs: [{ name: 't', type: 'f32' }],
});

mx_hash_int_0.setLayout({
  name: 'mx_hash_int_0',
  type: 'u32',
  inputs: [{ name: 'x', type: 'i32' }],
});

mx_hash_int_1.setLayout({
  name: 'mx_hash_int_1',
  type: 'u32',
  inputs: [
    { name: 'x', type: 'i32' },
    { name: 'y', type: 'i32' },
  ],
});

mx_hash_int_2.setLayout({
  name: 'mx_hash_int_2',
  type: 'u32',
  inputs: [
    { name: 'x', type: 'i32' },
    { name: 'y', type: 'i32' },
    { name: 'z', type: 'i32' },
  ],
});

mx_hash_int_3.setLayout({
  name: 'mx_hash_int_3',
  type: 'u32',
  inputs: [
    { name: 'x', type: 'i32' },
    { name: 'y', type: 'i32' },
    { name: 'z', type: 'i32' },
    { name: 'xx', type: 'i32' },
  ],
});

mx_hash_int_4.setLayout({
  name: 'mx_hash_int_4',
  type: 'u32',
  inputs: [
    { name: 'x', type: 'i32' },
    { name: 'y', type: 'i32' },
    { name: 'z', type: 'i32' },
    { name: 'xx', type: 'i32' },
    { name: 'yy', type: 'i32' },
  ],
});

mx_hash_vec3_0.setLayout({
  name: 'mx_hash_vec3_0',
  type: 'uvec3',
  inputs: [
    { name: 'x', type: 'i32' },
    { name: 'y', type: 'i32' },
  ],
});

mx_hash_vec3_1.setLayout({
  name: 'mx_hash_vec3_1',
  type: 'uvec3',
  inputs: [
    { name: 'x', type: 'i32' },
    { name: 'y', type: 'i32' },
    { name: 'z', type: 'i32' },
  ],
});

mx_perlin_noise_float_0.setLayout({
  name: 'mx_perlin_noise_float_0',
  type: 'f32',
  inputs: [{ name: 'p', type: 'vec2' }],
});

mx_perlin_noise_float_1.setLayout({
  name: 'mx_perlin_noise_float_1',
  type: 'f32',
  inputs: [{ name: 'p', type: 'vec3' }],
});

mx_perlin_noise_vec3_0.setLayout({
  name: 'mx_perlin_noise_vec3_0',
  type: 'vec3',
  inputs: [{ name: 'p', type: 'vec2' }],
});

mx_perlin_noise_vec3_1.setLayout({
  name: 'mx_perlin_noise_vec3_1',
  type: 'vec3',
  inputs: [{ name: 'p', type: 'vec3' }],
});

mx_cell_noise_float_0.setLayout({
  name: 'mx_cell_noise_float_0',
  type: 'f32',
  inputs: [{ name: 'p', type: 'f32' }],
});

mx_cell_noise_float_1.setLayout({
  name: 'mx_cell_noise_float_1',
  type: 'f32',
  inputs: [{ name: 'p', type: 'vec2' }],
});

mx_cell_noise_float_2.setLayout({
  name: 'mx_cell_noise_float_2',
  type: 'f32',
  inputs: [{ name: 'p', type: 'vec3' }],
});

mx_cell_noise_float_3.setLayout({
  name: 'mx_cell_noise_float_3',
  type: 'f32',
  inputs: [{ name: 'p', type: 'vec4' }],
});

mx_cell_noise_vec3_0.setLayout({
  name: 'mx_cell_noise_vec3_0',
  type: 'vec3',
  inputs: [{ name: 'p', type: 'f32' }],
});

mx_cell_noise_vec3_1.setLayout({
  name: 'mx_cell_noise_vec3_1',
  type: 'vec3',
  inputs: [{ name: 'p', type: 'vec2' }],
});

mx_cell_noise_vec3_2.setLayout({
  name: 'mx_cell_noise_vec3_2',
  type: 'vec3',
  inputs: [{ name: 'p', type: 'vec3' }],
});

mx_cell_noise_vec3_3.setLayout({
  name: 'mx_cell_noise_vec3_3',
  type: 'vec3',
  inputs: [{ name: 'p', type: 'vec4' }],
});

mx_fractal_noise_float.setLayout({
  name: 'mx_fractal_noise_float',
  type: 'f32',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'octaves', type: 'i32' },
    { name: 'lacunarity', type: 'f32' },
    { name: 'diminish', type: 'f32' },
  ],
});

mx_fractal_noise_vec3.setLayout({
  name: 'mx_fractal_noise_vec3',
  type: 'vec3',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'octaves', type: 'i32' },
    { name: 'lacunarity', type: 'f32' },
    { name: 'diminish', type: 'f32' },
  ],
});

mx_fractal_noise_vec2.setLayout({
  name: 'mx_fractal_noise_vec2',
  type: 'vec2',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'octaves', type: 'i32' },
    { name: 'lacunarity', type: 'f32' },
    { name: 'diminish', type: 'f32' },
  ],
});

mx_fractal_noise_vec4.setLayout({
  name: 'mx_fractal_noise_vec4',
  type: 'vec4',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'octaves', type: 'i32' },
    { name: 'lacunarity', type: 'f32' },
    { name: 'diminish', type: 'f32' },
  ],
});

mx_worley_distance_0.setLayout({
  name: 'mx_worley_distance_0',
  type: 'f32',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'x', type: 'i32' },
    { name: 'y', type: 'i32' },
    { name: 'xoff', type: 'i32' },
    { name: 'yoff', type: 'i32' },
    { name: 'jitter', type: 'f32' },
    { name: 'metric', type: 'i32' },
  ],
});

mx_worley_distance_1.setLayout({
  name: 'mx_worley_distance_1',
  type: 'f32',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'x', type: 'i32' },
    { name: 'y', type: 'i32' },
    { name: 'z', type: 'i32' },
    { name: 'xoff', type: 'i32' },
    { name: 'yoff', type: 'i32' },
    { name: 'zoff', type: 'i32' },
    { name: 'jitter', type: 'f32' },
    { name: 'metric', type: 'i32' },
  ],
});

mx_worley_noise_float_0.setLayout({
  name: 'mx_worley_noise_float_0',
  type: 'f32',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'jitter', type: 'f32' },
    { name: 'metric', type: 'i32' },
  ],
});

mx_worley_noise_vec2_0.setLayout({
  name: 'mx_worley_noise_vec2_0',
  type: 'vec2',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'jitter', type: 'f32' },
    { name: 'metric', type: 'i32' },
  ],
});

mx_worley_noise_vec3_0.setLayout({
  name: 'mx_worley_noise_vec3_0',
  type: 'vec3',
  inputs: [
    { name: 'p', type: 'vec2' },
    { name: 'jitter', type: 'f32' },
    { name: 'metric', type: 'i32' },
  ],
});

mx_worley_noise_float_1.setLayout({
  name: 'mx_worley_noise_float_1',
  type: 'f32',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'jitter', type: 'f32' },
    { name: 'metric', type: 'i32' },
  ],
});

mx_worley_noise_vec2_1.setLayout({
  name: 'mx_worley_noise_vec2_1',
  type: 'vec2',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'jitter', type: 'f32' },
    { name: 'metric', type: 'i32' },
  ],
});

mx_worley_noise_vec3_1.setLayout({
  name: 'mx_worley_noise_vec3_1',
  type: 'vec3',
  inputs: [
    { name: 'p', type: 'vec3' },
    { name: 'jitter', type: 'f32' },
    { name: 'metric', type: 'i32' },
  ],
});
