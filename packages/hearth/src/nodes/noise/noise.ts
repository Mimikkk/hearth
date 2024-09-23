import { bool, f32, i32, u32, uvec3, vec2, vec3, vec4 } from '../shadernode/ShaderNode.primitves.js';
import { cond } from '../../nodes/math/CondNode.js';
import { mul, sub } from '../../nodes/math/OperatorNode.js';
import { abs, dot, floor, max, min, sqrt } from '../../nodes/math/MathNode.js';
import { overloadHsl } from '../utils/OverloadShaderNode.js';
import { loop } from '../utils/LoopNode.js';
import { TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { NodeStack } from '../shadernode/ShaderNode.stack.js';
import { hsl } from '../../nodes/shadernode/hsl.js';

export const select = hsl(
  ([b_i, t_i, f_i]) => {
    const f = f32(f_i).toVar();
    const t = f32(t_i).toVar();
    const b = bool(b_i).toVar();

    return cond(b, t, f);
  },
  {
    name: 'mx_select',
    type: TypeName.f32,
    inputs: [
      { name: 'b', type: TypeName.bool },
      { name: 't', type: TypeName.f32 },
      { name: 'f', type: TypeName.f32 },
    ],
  },
);

export const negateIf = hsl(
  ([val_i, b_i]) => {
    const b = bool(b_i).toVar();
    const val = f32(val_i).toVar();

    return cond(b, val.negate(), val);
  },
  {
    name: 'mx_negate_if',
    type: TypeName.f32,
    inputs: [
      { name: 'val', type: TypeName.f32 },
      { name: 'b', type: TypeName.bool },
    ],
  },
);

export const floor_ = hsl(
  ([x_i]) => {
    const x = f32(x_i).toVar();

    return i32(floor(x));
  },
  {
    name: 'mx_floor',
    type: TypeName.i32,
    inputs: [{ name: 'x', type: TypeName.f32 }],
  },
);

export const floorfrac = hsl(([x_i, i]) => {
  const x = f32(x_i).toVar();
  i.assign(floor_(x));

  return x.sub(f32(i));
});

export const bilerp = overloadHsl([
  hsl(
    ([v0_i, v1_i, v2_i, v3_i, s_i, t_i]) => {
      const t = f32(t_i).toVar();
      const s = f32(s_i).toVar();
      const v3 = f32(v3_i).toVar();
      const v2 = f32(v2_i).toVar();
      const v1 = f32(v1_i).toVar();
      const v0 = f32(v0_i).toVar();
      const s1 = f32(sub(1.0, s)).toVar();

      return sub(1.0, t)
        .mul(v0.mul(s1).add(v1.mul(s)))
        .add(t.mul(v2.mul(s1).add(v3.mul(s))));
    },
    {
      name: 'mx_bilerp_0',
      type: TypeName.f32,
      inputs: [
        { name: 'v0', type: TypeName.f32 },
        { name: 'v1', type: TypeName.f32 },
        { name: 'v2', type: TypeName.f32 },
        { name: 'v3', type: TypeName.f32 },
        { name: 's', type: TypeName.f32 },
        { name: 't', type: TypeName.f32 },
      ],
    },
  ),
  hsl(
    ([v0_i, v1_i, v2_i, v3_i, s_i, t_i]) => {
      const t = f32(t_i).toVar();
      const s = f32(s_i).toVar();
      const v3 = vec3(v3_i).toVar();
      const v2 = vec3(v2_i).toVar();
      const v1 = vec3(v1_i).toVar();
      const v0 = vec3(v0_i).toVar();
      const s1 = f32(sub(1.0, s)).toVar();

      return sub(1.0, t)
        .mul(v0.mul(s1).add(v1.mul(s)))
        .add(t.mul(v2.mul(s1).add(v3.mul(s))));
    },
    {
      name: 'mx_bilerp_1',
      type: TypeName.vec3,
      inputs: [
        { name: 'v0', type: TypeName.vec3 },
        { name: 'v1', type: TypeName.vec3 },
        { name: 'v2', type: TypeName.vec3 },
        { name: 'v3', type: TypeName.vec3 },
        { name: 's', type: TypeName.f32 },
        { name: 't', type: TypeName.f32 },
      ],
    },
  ),
]);

export const trilerp = overloadHsl([
  hsl(
    ([v0_i, v1_i, v2_i, v3_i, v4_i, v5_i, v6_i, v7_i, s_i, t_i, r_i]) => {
      const r = f32(r_i).toVar();
      const t = f32(t_i).toVar();
      const s = f32(s_i).toVar();
      const v7 = f32(v7_i).toVar();
      const v6 = f32(v6_i).toVar();
      const v5 = f32(v5_i).toVar();
      const v4 = f32(v4_i).toVar();
      const v3 = f32(v3_i).toVar();
      const v2 = f32(v2_i).toVar();
      const v1 = f32(v1_i).toVar();
      const v0 = f32(v0_i).toVar();
      const s1 = f32(sub(1.0, s)).toVar();
      const t1 = f32(sub(1.0, t)).toVar();
      const r1 = f32(sub(1.0, r)).toVar();

      return r1
        .mul(t1.mul(v0.mul(s1).add(v1.mul(s))).add(t.mul(v2.mul(s1).add(v3.mul(s)))))
        .add(r.mul(t1.mul(v4.mul(s1).add(v5.mul(s))).add(t.mul(v6.mul(s1).add(v7.mul(s))))));
    },
    {
      name: 'mx_trilerp_0',
      type: TypeName.f32,
      inputs: [
        { name: 'v0', type: TypeName.f32 },
        { name: 'v1', type: TypeName.f32 },
        { name: 'v2', type: TypeName.f32 },
        { name: 'v3', type: TypeName.f32 },
        { name: 'v4', type: TypeName.f32 },
        { name: 'v5', type: TypeName.f32 },
        { name: 'v6', type: TypeName.f32 },
        { name: 'v7', type: TypeName.f32 },
        { name: 's', type: TypeName.f32 },
        { name: 't', type: TypeName.f32 },
        { name: 'r', type: TypeName.f32 },
      ],
    },
  ),
  hsl(
    ([v0_i, v1_i, v2_i, v3_i, v4_i, v5_i, v6_i, v7_i, s_i, t_i, r_i]) => {
      const r = f32(r_i).toVar();
      const t = f32(t_i).toVar();
      const s = f32(s_i).toVar();
      const v7 = vec3(v7_i).toVar();
      const v6 = vec3(v6_i).toVar();
      const v5 = vec3(v5_i).toVar();
      const v4 = vec3(v4_i).toVar();
      const v3 = vec3(v3_i).toVar();
      const v2 = vec3(v2_i).toVar();
      const v1 = vec3(v1_i).toVar();
      const v0 = vec3(v0_i).toVar();
      const s1 = f32(sub(1.0, s)).toVar();
      const t1 = f32(sub(1.0, t)).toVar();
      const r1 = f32(sub(1.0, r)).toVar();

      return r1
        .mul(t1.mul(v0.mul(s1).add(v1.mul(s))).add(t.mul(v2.mul(s1).add(v3.mul(s)))))
        .add(r.mul(t1.mul(v4.mul(s1).add(v5.mul(s))).add(t.mul(v6.mul(s1).add(v7.mul(s))))));
    },
    {
      name: 'mx_trilerp_1',
      type: TypeName.vec3,
      inputs: [
        { name: 'v0', type: TypeName.vec3 },
        { name: 'v1', type: TypeName.vec3 },
        { name: 'v2', type: TypeName.vec3 },
        { name: 'v3', type: TypeName.vec3 },
        { name: 'v4', type: TypeName.vec3 },
        { name: 'v5', type: TypeName.vec3 },
        { name: 'v6', type: TypeName.vec3 },
        { name: 'v7', type: TypeName.vec3 },
        { name: 's', type: TypeName.f32 },
        { name: 't', type: TypeName.f32 },
        { name: 'r', type: TypeName.f32 },
      ],
    },
  ),
]);

export const gradientF32 = overloadHsl([
  hsl(
    ([hash_i, x_i, y_i]) => {
      const y = f32(y_i).toVar();
      const x = f32(x_i).toVar();
      const hash = u32(hash_i).toVar();
      const h = u32(hash.bitAnd(u32(7))).toVar();
      const u = f32(select(h.lessThan(u32(4)), x, y)).toVar();
      const v = f32(mul(2.0, select(h.lessThan(u32(4)), y, x))).toVar();

      return negateIf(u, bool(h.bitAnd(u32(1)))).add(negateIf(v, bool(h.bitAnd(u32(2)))));
    },
    {
      name: 'mx_gradient_f32_0',
      type: TypeName.f32,
      inputs: [
        { name: 'hash', type: TypeName.u32 },
        { name: 'x', type: TypeName.f32 },
        { name: 'y', type: TypeName.f32 },
      ],
    },
  ),
  hsl(
    ([hash_i, x_i, y_i, z_i]) => {
      const z = f32(z_i).toVar();
      const y = f32(y_i).toVar();
      const x = f32(x_i).toVar();
      const hash = u32(hash_i).toVar();
      const h = u32(hash.bitAnd(u32(15))).toVar();
      const u = f32(select(h.lessThan(u32(8)), x, y)).toVar();
      const v = f32(select(h.lessThan(u32(4)), y, select(h.equal(u32(12)).or(h.equal(u32(14))), x, z))).toVar();

      return negateIf(u, bool(h.bitAnd(u32(1)))).add(negateIf(v, bool(h.bitAnd(u32(2)))));
    },
    {
      name: 'mx_gradient_f32_1',
      type: TypeName.f32,
      inputs: [
        { name: 'hash', type: TypeName.u32 },
        { name: 'x', type: TypeName.f32 },
        { name: 'y', type: TypeName.f32 },
        { name: 'z', type: TypeName.f32 },
      ],
    },
  ),
]);

export const gradientVec3 = overloadHsl([
  hsl(
    ([hash_i, x_i, y_i]) => {
      const y = f32(y_i).toVar();
      const x = f32(x_i).toVar();
      const hash = uvec3(hash_i).toVar();

      return vec3(gradientF32(hash.x, x, y), gradientF32(hash.y, x, y), gradientF32(hash.z, x, y));
    },
    {
      name: 'mx_gradient_vec3_0',
      type: TypeName.vec3,
      inputs: [
        { name: 'hash', type: TypeName.uvec3 },
        { name: 'x', type: TypeName.f32 },
        { name: 'y', type: TypeName.f32 },
      ],
    },
  ),
  hsl(
    ([hash_i, x_i, y_i, z_i]) => {
      const z = f32(z_i).toVar();
      const y = f32(y_i).toVar();
      const x = f32(x_i).toVar();
      const hash = uvec3(hash_i).toVar();

      return vec3(gradientF32(hash.x, x, y, z), gradientF32(hash.y, x, y, z), gradientF32(hash.z, x, y, z));
    },
    {
      name: 'mx_gradient_vec3_1',
      type: TypeName.vec3,
      inputs: [
        { name: 'hash', type: TypeName.uvec3 },
        { name: 'x', type: TypeName.f32 },
        { name: 'y', type: TypeName.f32 },
        { name: 'z', type: TypeName.f32 },
      ],
    },
  ),
]);

export const gradientScale2d = overloadHsl([
  hsl(
    ([v_i]) => {
      const v = f32(v_i).toVar();

      return mul(0.6616, v);
    },
    {
      name: 'mx_gradient_scale2d_0',
      type: TypeName.f32,
      inputs: [{ name: 'v', type: TypeName.f32 }],
    },
  ),
  hsl(
    ([v_i]) => {
      const v = vec3(v_i).toVar();

      return mul(0.6616, v);
    },
    {
      name: 'mx_gradient_scale2d_1',
      type: TypeName.vec3,
      inputs: [{ name: 'v', type: TypeName.vec3 }],
    },
  ),
]);

export const gradientScale3d = overloadHsl([
  hsl(
    ([v_i]) => {
      const v = f32(v_i).toVar();

      return mul(0.982, v);
    },
    {
      name: 'mx_gradient_scale3d_0',
      type: TypeName.f32,
      inputs: [{ name: 'v', type: TypeName.f32 }],
    },
  ),
  hsl(
    ([v_i]) => {
      const v = vec3(v_i).toVar();

      return mul(0.982, v);
    },
    {
      name: 'mx_gradient_scale3d_1',
      type: TypeName.vec3,
      inputs: [{ name: 'v', type: TypeName.vec3 }],
    },
  ),
]);

export const rotl32 = hsl(
  ([x_i, k_i]) => {
    const k = i32(k_i).toVar();
    const x = u32(x_i).toVar();

    return x.shiftLeft(k).bitOr(x.shiftRight(i32(32).sub(k)));
  },
  {
    name: 'mx_rotl32',
    type: TypeName.u32,
    inputs: [
      { name: 'x', type: TypeName.u32 },
      { name: 'k', type: TypeName.i32 },
    ],
  },
);

export const bjmix = hsl(
  ([a, b, c]) => {
    a.subAssign(c);
    a.bitXorAssign(rotl32(c, i32(4)));
    c.addAssign(b);
    b.subAssign(a);
    b.bitXorAssign(rotl32(a, i32(6)));
    a.addAssign(c);
    c.subAssign(b);
    c.bitXorAssign(rotl32(b, i32(8)));
    b.addAssign(a);
    a.subAssign(c);
    a.bitXorAssign(rotl32(c, i32(16)));
    c.addAssign(b);
    b.subAssign(a);
    b.bitXorAssign(rotl32(a, i32(19)));
    a.addAssign(c);
    c.subAssign(b);
    c.bitXorAssign(rotl32(b, i32(4)));
    b.addAssign(a);
  },
  {
    name: 'mx_bjmix',
    type: TypeName.void,
    inputs: [
      { name: 'a', type: TypeName.u32 },
      { name: 'b', type: TypeName.u32 },
      { name: 'c', type: TypeName.u32 },
    ],
  },
);

export const bjfinal = hsl(
  ([a_i, b_i, c_i]) => {
    const c = u32(c_i).toVar();
    const b = u32(b_i).toVar();
    const a = u32(a_i).toVar();
    c.bitXorAssign(b);
    c.subAssign(rotl32(b, i32(14)));
    a.bitXorAssign(c);
    a.subAssign(rotl32(c, i32(11)));
    b.bitXorAssign(a);
    b.subAssign(rotl32(a, i32(25)));
    c.bitXorAssign(b);
    c.subAssign(rotl32(b, i32(16)));
    a.bitXorAssign(c);
    a.subAssign(rotl32(c, i32(4)));
    b.bitXorAssign(a);
    b.subAssign(rotl32(a, i32(14)));
    c.bitXorAssign(b);
    c.subAssign(rotl32(b, i32(24)));

    return c;
  },
  {
    name: 'mx_bjfinal',
    type: TypeName.u32,
    inputs: [
      { name: 'a', type: TypeName.u32 },
      { name: 'b', type: TypeName.u32 },
      { name: 'c', type: TypeName.u32 },
    ],
  },
);

export const bitsTo01 = hsl(
  ([bits_i]) => {
    const bits = u32(bits_i).toVar();

    return f32(bits).div(f32(u32(i32(0xffffffff))));
  },
  {
    name: 'mx_bits_to_01',
    type: TypeName.f32,
    inputs: [{ name: 'bits', type: TypeName.u32 }],
  },
);

export const fade = hsl(
  ([t_i]) => {
    const t = f32(t_i).toVar();

    return t.mul(t.mul(t.mul(t.mul(t.mul(6.0).sub(15.0)).add(10.0))));
  },
  {
    name: 'mx_fade',
    type: TypeName.f32,
    inputs: [{ name: 't', type: TypeName.f32 }],
  },
);

export const hashI32 = overloadHsl([
  hsl(
    ([x_i]) => {
      const x = i32(x_i).toVar();
      const len = u32(u32(1)).toVar();
      const seed = u32(u32(i32(0xdeadbeef)).add(len.shiftLeft(u32(2)).add(u32(13)))).toVar();

      return bjfinal(seed.add(u32(x)), seed, seed);
    },
    {
      name: 'mx_hash_i32_0',
      type: TypeName.u32,
      inputs: [{ name: 'x', type: TypeName.i32 }],
    },
  ),
  hsl(
    ([x_i, y_i]) => {
      const y = i32(y_i).toVar();
      const x = i32(x_i).toVar();
      const len = u32(u32(2)).toVar();
      const a = u32().toVar(),
        b = u32().toVar(),
        c = u32().toVar();
      a.assign(b.assign(c.assign(u32(i32(0xdeadbeef)).add(len.shiftLeft(u32(2)).add(u32(13))))));
      a.addAssign(u32(x));
      b.addAssign(u32(y));

      return bjfinal(a, b, c);
    },
    {
      name: 'mx_hash_i32_1',
      type: TypeName.u32,
      inputs: [
        { name: 'x', type: TypeName.i32 },
        { name: 'y', type: TypeName.i32 },
      ],
    },
  ),
  hsl(
    ([x_i, y_i, z_i]) => {
      const z = i32(z_i).toVar();
      const y = i32(y_i).toVar();
      const x = i32(x_i).toVar();
      const len = u32(u32(3)).toVar();
      const a = u32().toVar(),
        b = u32().toVar(),
        c = u32().toVar();
      a.assign(b.assign(c.assign(u32(i32(0xdeadbeef)).add(len.shiftLeft(u32(2)).add(u32(13))))));
      a.addAssign(u32(x));
      b.addAssign(u32(y));
      c.addAssign(u32(z));

      return bjfinal(a, b, c);
    },
    {
      name: 'mx_hash_i32_2',
      type: TypeName.u32,
      inputs: [
        { name: 'x', type: TypeName.i32 },
        { name: 'y', type: TypeName.i32 },
        { name: 'z', type: TypeName.i32 },
      ],
    },
  ),
  hsl(
    ([x_i, y_i, z_i, xx_i]) => {
      const xx = i32(xx_i).toVar();
      const z = i32(z_i).toVar();
      const y = i32(y_i).toVar();
      const x = i32(x_i).toVar();
      const len = u32(u32(4)).toVar();
      const a = u32().toVar(),
        b = u32().toVar(),
        c = u32().toVar();
      a.assign(b.assign(c.assign(u32(i32(0xdeadbeef)).add(len.shiftLeft(u32(2)).add(u32(13))))));
      a.addAssign(u32(x));
      b.addAssign(u32(y));
      c.addAssign(u32(z));
      bjmix(a, b, c);
      a.addAssign(u32(xx));

      return bjfinal(a, b, c);
    },
    {
      name: 'mx_hash_i32_3',
      type: TypeName.u32,
      inputs: [
        { name: 'x', type: TypeName.i32 },
        { name: 'y', type: TypeName.i32 },
        { name: 'z', type: TypeName.i32 },
        { name: 'xx', type: TypeName.i32 },
      ],
    },
  ),
  hsl(
    ([x_i, y_i, z_i, xx_i, yy_i]) => {
      const yy = i32(yy_i).toVar();
      const xx = i32(xx_i).toVar();
      const z = i32(z_i).toVar();
      const y = i32(y_i).toVar();
      const x = i32(x_i).toVar();
      const len = u32(u32(5)).toVar();
      const a = u32().toVar(),
        b = u32().toVar(),
        c = u32().toVar();
      a.assign(b.assign(c.assign(u32(i32(0xdeadbeef)).add(len.shiftLeft(u32(2)).add(u32(13))))));
      a.addAssign(u32(x));
      b.addAssign(u32(y));
      c.addAssign(u32(z));
      bjmix(a, b, c);
      a.addAssign(u32(xx));
      b.addAssign(u32(yy));

      return bjfinal(a, b, c);
    },
    {
      name: 'mx_hash_i32_4',
      type: TypeName.u32,
      inputs: [
        { name: 'x', type: TypeName.i32 },
        { name: 'y', type: TypeName.i32 },
        { name: 'z', type: TypeName.i32 },
        { name: 'xx', type: TypeName.i32 },
        { name: 'yy', type: TypeName.i32 },
      ],
    },
  ),
]);

export const hashVec3 = overloadHsl([
  hsl(
    ([x_i, y_i]) => {
      const y = i32(y_i).toVar();
      const x = i32(x_i).toVar();
      const h = u32(hashI32(x, y)).toVar();
      const result = uvec3().toVar();
      result.x.assign(h.bitAnd(i32(0xff)));
      result.y.assign(h.shiftRight(i32(8)).bitAnd(i32(0xff)));
      result.z.assign(h.shiftRight(i32(16)).bitAnd(i32(0xff)));

      return result;
    },
    {
      name: 'mx_hash_vec3_0',
      type: TypeName.uvec3,
      inputs: [
        { name: 'x', type: TypeName.i32 },
        { name: 'y', type: TypeName.i32 },
      ],
    },
  ),
  hsl(
    ([x_i, y_i, z_i]) => {
      const z = i32(z_i).toVar();
      const y = i32(y_i).toVar();
      const x = i32(x_i).toVar();
      const h = u32(hashI32(x, y, z)).toVar();
      const result = uvec3().toVar();
      result.x.assign(h.bitAnd(i32(0xff)));
      result.y.assign(h.shiftRight(i32(8)).bitAnd(i32(0xff)));
      result.z.assign(h.shiftRight(i32(16)).bitAnd(i32(0xff)));

      return result;
    },
    {
      name: 'mx_hash_vec3_1',
      type: TypeName.uvec3,
      inputs: [
        { name: 'x', type: TypeName.i32 },
        { name: 'y', type: TypeName.i32 },
        { name: 'z', type: TypeName.i32 },
      ],
    },
  ),
]);

export const perlinF32 = overloadHsl([
  hsl(
    ([p_i]) => {
      const p = vec2(p_i).toVar();
      const X = i32().toVar(),
        Y = i32().toVar();
      const fx = f32(floorfrac(p.x, X)).toVar();
      const fy = f32(floorfrac(p.y, Y)).toVar();
      const u = f32(fade(fx)).toVar();
      const v = f32(fade(fy)).toVar();
      const result = f32(
        bilerp(
          gradientF32(hashI32(X, Y), fx, fy),
          gradientF32(hashI32(X.add(i32(1)), Y), fx.sub(1.0), fy),
          gradientF32(hashI32(X, Y.add(i32(1))), fx, fy.sub(1.0)),
          gradientF32(hashI32(X.add(i32(1)), Y.add(i32(1))), fx.sub(1.0), fy.sub(1.0)),
          u,
          v,
        ),
      ).toVar();

      return gradientScale2d(result);
    },
    {
      name: 'mx_perlin_noise_f32_0',
      type: TypeName.f32,
      inputs: [{ name: 'p', type: TypeName.vec2 }],
    },
  ),
  hsl(
    ([p_i]) => {
      const p = vec3(p_i).toVar();
      const X = i32().toVar(),
        Y = i32().toVar(),
        Z = i32().toVar();
      const fx = f32(floorfrac(p.x, X)).toVar();
      const fy = f32(floorfrac(p.y, Y)).toVar();
      const fz = f32(floorfrac(p.z, Z)).toVar();
      const u = f32(fade(fx)).toVar();
      const v = f32(fade(fy)).toVar();
      const w = f32(fade(fz)).toVar();
      const result = f32(
        trilerp(
          gradientF32(hashI32(X, Y, Z), fx, fy, fz),
          gradientF32(hashI32(X.add(i32(1)), Y, Z), fx.sub(1.0), fy, fz),
          gradientF32(hashI32(X, Y.add(i32(1)), Z), fx, fy.sub(1.0), fz),
          gradientF32(hashI32(X.add(i32(1)), Y.add(i32(1)), Z), fx.sub(1.0), fy.sub(1.0), fz),
          gradientF32(hashI32(X, Y, Z.add(i32(1))), fx, fy, fz.sub(1.0)),
          gradientF32(hashI32(X.add(i32(1)), Y, Z.add(i32(1))), fx.sub(1.0), fy, fz.sub(1.0)),
          gradientF32(hashI32(X, Y.add(i32(1)), Z.add(i32(1))), fx, fy.sub(1.0), fz.sub(1.0)),
          gradientF32(hashI32(X.add(i32(1)), Y.add(i32(1)), Z.add(i32(1))), fx.sub(1.0), fy.sub(1.0), fz.sub(1.0)),
          u,
          v,
          w,
        ),
      ).toVar();

      return gradientScale3d(result);
    },
    {
      name: 'mx_perlin_noise_f32_1',
      type: TypeName.f32,
      inputs: [{ name: 'p', type: TypeName.vec3 }],
    },
  ),
]);

export const perlinVec3 = overloadHsl([
  hsl(
    ([p_i]) => {
      const p = vec2(p_i).toVar();
      const X = i32().toVar(),
        Y = i32().toVar();
      const fx = f32(floorfrac(p.x, X)).toVar();
      const fy = f32(floorfrac(p.y, Y)).toVar();
      const u = f32(fade(fx)).toVar();
      const v = f32(fade(fy)).toVar();
      const result = vec3(
        bilerp(
          gradientVec3(hashVec3(X, Y), fx, fy),
          gradientVec3(hashVec3(X.add(i32(1)), Y), fx.sub(1.0), fy),
          gradientVec3(hashVec3(X, Y.add(i32(1))), fx, fy.sub(1.0)),
          gradientVec3(hashVec3(X.add(i32(1)), Y.add(i32(1))), fx.sub(1.0), fy.sub(1.0)),
          u,
          v,
        ),
      ).toVar();

      return gradientScale2d(result);
    },
    {
      name: 'mx_perlin_noise_vec3_0',
      type: TypeName.vec3,
      inputs: [{ name: 'p', type: TypeName.vec2 }],
    },
  ),
  hsl(
    ([p_i]) => {
      const p = vec3(p_i).toVar();
      const X = i32().toVar(),
        Y = i32().toVar(),
        Z = i32().toVar();
      const fx = f32(floorfrac(p.x, X)).toVar();
      const fy = f32(floorfrac(p.y, Y)).toVar();
      const fz = f32(floorfrac(p.z, Z)).toVar();
      const u = f32(fade(fx)).toVar();
      const v = f32(fade(fy)).toVar();
      const w = f32(fade(fz)).toVar();
      const result = vec3(
        trilerp(
          gradientVec3(hashVec3(X, Y, Z), fx, fy, fz),
          gradientVec3(hashVec3(X.add(i32(1)), Y, Z), fx.sub(1.0), fy, fz),
          gradientVec3(hashVec3(X, Y.add(i32(1)), Z), fx, fy.sub(1.0), fz),
          gradientVec3(hashVec3(X.add(i32(1)), Y.add(i32(1)), Z), fx.sub(1.0), fy.sub(1.0), fz),
          gradientVec3(hashVec3(X, Y, Z.add(i32(1))), fx, fy, fz.sub(1.0)),
          gradientVec3(hashVec3(X.add(i32(1)), Y, Z.add(i32(1))), fx.sub(1.0), fy, fz.sub(1.0)),
          gradientVec3(hashVec3(X, Y.add(i32(1)), Z.add(i32(1))), fx, fy.sub(1.0), fz.sub(1.0)),
          gradientVec3(hashVec3(X.add(i32(1)), Y.add(i32(1)), Z.add(i32(1))), fx.sub(1.0), fy.sub(1.0), fz.sub(1.0)),
          u,
          v,
          w,
        ),
      ).toVar();

      return gradientScale3d(result);
    },
    {
      name: 'mx_perlin_noise_vec3_1',
      type: TypeName.vec3,
      inputs: [{ name: 'p', type: TypeName.vec3 }],
    },
  ),
]);

export const cellF32 = overloadHsl([
  hsl(
    ([p_i]) => {
      const p = f32(p_i).toVar();
      const ix = i32(floor_(p)).toVar();

      return bitsTo01(hashI32(ix));
    },
    {
      name: 'mx_cell_noise_f32_0',
      type: TypeName.f32,
      inputs: [{ name: 'p', type: TypeName.f32 }],
    },
  ),
  hsl(
    ([p_i]) => {
      const p = vec2(p_i).toVar();
      const ix = i32(floor_(p.x)).toVar();
      const iy = i32(floor_(p.y)).toVar();

      return bitsTo01(hashI32(ix, iy));
    },
    {
      name: 'mx_cell_noise_f32_1',
      type: TypeName.f32,
      inputs: [{ name: 'p', type: TypeName.vec2 }],
    },
  ),
  hsl(
    ([p_i]) => {
      const p = vec3(p_i).toVar();
      const ix = i32(floor_(p.x)).toVar();
      const iy = i32(floor_(p.y)).toVar();
      const iz = i32(floor_(p.z)).toVar();

      return bitsTo01(hashI32(ix, iy, iz));
    },
    {
      name: 'mx_cell_noise_f32_2',
      type: TypeName.f32,
      inputs: [{ name: 'p', type: TypeName.vec3 }],
    },
  ),
  hsl(
    ([p_i]) => {
      const p = vec4(p_i).toVar();
      const ix = i32(floor_(p.x)).toVar();
      const iy = i32(floor_(p.y)).toVar();
      const iz = i32(floor_(p.z)).toVar();
      const iw = i32(floor_(p.w)).toVar();

      return bitsTo01(hashI32(ix, iy, iz, iw));
    },
    {
      name: 'mx_cell_noise_f32_3',
      type: TypeName.f32,
      inputs: [{ name: 'p', type: TypeName.vec4 }],
    },
  ),
]);

export const cellVec3 = overloadHsl([
  hsl(
    ([p_i]) => {
      const p = f32(p_i).toVar();
      const ix = i32(floor_(p)).toVar();

      return vec3(bitsTo01(hashI32(ix, i32(0))), bitsTo01(hashI32(ix, i32(1))), bitsTo01(hashI32(ix, i32(2))));
    },
    {
      name: 'mx_cell_noise_vec3_0',
      type: TypeName.vec3,
      inputs: [{ name: 'p', type: TypeName.f32 }],
    },
  ),
  hsl(
    ([p_i]) => {
      const p = vec2(p_i).toVar();
      const ix = i32(floor_(p.x)).toVar();
      const iy = i32(floor_(p.y)).toVar();

      return vec3(
        bitsTo01(hashI32(ix, iy, i32(0))),
        bitsTo01(hashI32(ix, iy, i32(1))),
        bitsTo01(hashI32(ix, iy, i32(2))),
      );
    },
    {
      name: 'mx_cell_noise_vec3_1',
      type: TypeName.vec3,
      inputs: [{ name: 'p', type: TypeName.vec2 }],
    },
  ),
  hsl(
    ([p_i]) => {
      const p = vec3(p_i).toVar();
      const ix = i32(floor_(p.x)).toVar();
      const iy = i32(floor_(p.y)).toVar();
      const iz = i32(floor_(p.z)).toVar();

      return vec3(
        bitsTo01(hashI32(ix, iy, iz, i32(0))),
        bitsTo01(hashI32(ix, iy, iz, i32(1))),
        bitsTo01(hashI32(ix, iy, iz, i32(2))),
      );
    },
    {
      name: 'mx_cell_noise_vec3_2',
      type: TypeName.vec3,
      inputs: [{ name: 'p', type: TypeName.vec3 }],
    },
  ),
  hsl(
    ([p_i]) => {
      const p = vec4(p_i).toVar();
      const ix = i32(floor_(p.x)).toVar();
      const iy = i32(floor_(p.y)).toVar();
      const iz = i32(floor_(p.z)).toVar();
      const iw = i32(floor_(p.w)).toVar();

      return vec3(
        bitsTo01(hashI32(ix, iy, iz, iw, i32(0))),
        bitsTo01(hashI32(ix, iy, iz, iw, i32(1))),
        bitsTo01(hashI32(ix, iy, iz, iw, i32(2))),
      );
    },
    {
      name: 'mx_cell_noise_vec3_3',
      type: TypeName.vec3,
      inputs: [{ name: 'p', type: TypeName.vec4 }],
    },
  ),
]);

export const fractalF32 = hsl(
  ([p_i, octaves_i, lacunarity_i, diminish_i]) => {
    const diminish = f32(diminish_i).toVar();
    const lacunarity = f32(lacunarity_i).toVar();
    const octaves = i32(octaves_i).toVar();
    const p = vec3(p_i).toVar();
    const result = f32(0.0).toVar();
    const amplitude = f32(1.0).toVar();

    loop({ start: i32(0), end: octaves }, ({ i }) => {
      result.addAssign(amplitude.mul(perlinF32(p)));
      amplitude.mulAssign(diminish);
      p.mulAssign(lacunarity);
    });

    return result;
  },
  {
    name: 'mx_fractal_noise_f32',
    type: TypeName.f32,
    inputs: [
      { name: 'p', type: TypeName.vec3 },
      { name: 'octaves', type: TypeName.i32 },
      { name: 'lacunarity', type: TypeName.f32 },
      { name: 'diminish', type: TypeName.f32 },
    ],
  },
);

export const fractalVec3 = hsl(
  ([p_i, octaves_i, lacunarity_i, diminish_i]) => {
    const diminish = f32(diminish_i).toVar();
    const lacunarity = f32(lacunarity_i).toVar();
    const octaves = i32(octaves_i).toVar();
    const p = vec3(p_i).toVar();
    const result = vec3(0.0).toVar();
    const amplitude = f32(1.0).toVar();

    loop({ start: i32(0), end: octaves }, ({ i }) => {
      result.addAssign(amplitude.mul(perlinVec3(p)));
      amplitude.mulAssign(diminish);
      p.mulAssign(lacunarity);
    });

    return result;
  },
  {
    name: 'mx_fractal_noise_vec3',
    type: TypeName.vec3,
    inputs: [
      { name: 'p', type: TypeName.vec3 },
      { name: 'octaves', type: TypeName.i32 },
      { name: 'lacunarity', type: TypeName.f32 },
      { name: 'diminish', type: TypeName.f32 },
    ],
  },
);

export const fractalVec2 = hsl(
  ([p_i, octaves_i, lacunarity_i, diminish_i]) => {
    const diminish = f32(diminish_i).toVar();
    const lacunarity = f32(lacunarity_i).toVar();
    const octaves = i32(octaves_i).toVar();
    const p = vec3(p_i).toVar();

    return vec2(
      fractalF32(p, octaves, lacunarity, diminish),
      fractalF32(p.add(vec3(i32(19), i32(193), i32(17))), octaves, lacunarity, diminish),
    );
  },
  {
    name: 'mx_fractal_noise_vec2',
    type: TypeName.vec2,
    inputs: [
      { name: 'p', type: TypeName.vec3 },
      { name: 'octaves', type: TypeName.i32 },
      { name: 'lacunarity', type: TypeName.f32 },
      { name: 'diminish', type: TypeName.f32 },
    ],
  },
);

export const fractalVec4 = hsl(
  ([p_i, octaves_i, lacunarity_i, diminish_i]) => {
    const diminish = f32(diminish_i).toVar();
    const lacunarity = f32(lacunarity_i).toVar();
    const octaves = i32(octaves_i).toVar();
    const p = vec3(p_i).toVar();
    const c = vec3(fractalVec3(p, octaves, lacunarity, diminish)).toVar();
    const f = f32(fractalF32(p.add(vec3(i32(19), i32(193), i32(17))), octaves, lacunarity, diminish)).toVar();

    return vec4(c, f);
  },
  {
    name: 'mx_fractal_noise_vec4',
    type: TypeName.vec4,
    inputs: [
      { name: 'p', type: TypeName.vec3 },
      { name: 'octaves', type: TypeName.i32 },
      { name: 'lacunarity', type: TypeName.f32 },
      { name: 'diminish', type: TypeName.f32 },
    ],
  },
);

export const worleyDistance = overloadHsl([
  hsl(
    ([p_i, x_i, y_i, xoff_i, yoff_i, jitter_i, metric_i]) => {
      const metric = i32(metric_i).toVar();
      const jitter = f32(jitter_i).toVar();
      const yoff = i32(yoff_i).toVar();
      const xoff = i32(xoff_i).toVar();
      const y = i32(y_i).toVar();
      const x = i32(x_i).toVar();
      const p = vec2(p_i).toVar();
      const tmp = vec3(cellVec3(vec2(x.add(xoff), y.add(yoff)))).toVar();
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
    {
      name: 'mx_worley_distance_0',
      type: TypeName.f32,
      inputs: [
        { name: 'p', type: TypeName.vec2 },
        { name: 'x', type: TypeName.i32 },
        { name: 'y', type: TypeName.i32 },
        { name: 'xoff', type: TypeName.i32 },
        { name: 'yoff', type: TypeName.i32 },
        { name: 'jitter', type: TypeName.f32 },
        { name: 'metric', type: TypeName.i32 },
      ],
    },
  ),
  hsl(
    ([p_i, x_i, y_i, z_i, xoff_i, yoff_i, zoff_i, jitter_i, metric_i]) => {
      const metric = i32(metric_i).toVar();
      const jitter = f32(jitter_i).toVar();
      const zoff = i32(zoff_i).toVar();
      const yoff = i32(yoff_i).toVar();
      const xoff = i32(xoff_i).toVar();
      const z = i32(z_i).toVar();
      const y = i32(y_i).toVar();
      const x = i32(x_i).toVar();
      const p = vec3(p_i).toVar();
      const off = vec3(cellVec3(vec3(x.add(xoff), y.add(yoff), z.add(zoff)))).toVar();
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
    {
      name: 'mx_worley_distance_1',
      type: TypeName.f32,
      inputs: [
        { name: 'p', type: TypeName.vec3 },
        { name: 'x', type: TypeName.i32 },
        { name: 'y', type: TypeName.i32 },
        { name: 'z', type: TypeName.i32 },
        { name: 'xoff', type: TypeName.i32 },
        { name: 'yoff', type: TypeName.i32 },
        { name: 'zoff', type: TypeName.i32 },
        { name: 'jitter', type: TypeName.f32 },
        { name: 'metric', type: TypeName.i32 },
      ],
    },
  ),
]);

export const worleyF32 = overloadHsl([
  hsl(
    ([p_i, jitter_i, metric_i]) => {
      const metric = i32(metric_i).toVar();
      const jitter = f32(jitter_i).toVar();
      const p = vec2(p_i).toVar();
      const X = i32().toVar(),
        Y = i32().toVar();
      const localpos = vec2(floorfrac(p.x, X), floorfrac(p.y, Y)).toVar();
      const sqdist = f32(1e6).toVar();

      loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
        loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
          const dist = f32(worleyDistance(localpos, x, y, X, Y, jitter, metric)).toVar();
          sqdist.assign(min(sqdist, dist));
        });
      });

      NodeStack.if(metric.equal(i32(0)), () => {
        sqdist.assign(sqrt(sqdist));
      });

      return sqdist;
    },
    {
      name: 'mx_worley_noise_f32_0',
      type: TypeName.f32,
      inputs: [
        { name: 'p', type: TypeName.vec2 },
        { name: 'jitter', type: TypeName.f32 },
        { name: 'metric', type: TypeName.i32 },
      ],
    },
  ),
  hsl(
    ([p_i, jitter_i, metric_i]) => {
      const metric = i32(metric_i).toVar();
      const jitter = f32(jitter_i).toVar();
      const p = vec3(p_i).toVar();
      const X = i32().toVar(),
        Y = i32().toVar(),
        Z = i32().toVar();
      const localpos = vec3(floorfrac(p.x, X), floorfrac(p.y, Y), floorfrac(p.z, Z)).toVar();
      const sqdist = f32(1e6).toVar();

      loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
        loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
          loop({ start: -1, end: i32(1), name: 'z', condition: '<=' }, ({ z }) => {
            const dist = f32(worleyDistance(localpos, x, y, z, X, Y, Z, jitter, metric)).toVar();
            sqdist.assign(min(sqdist, dist));
          });
        });
      });

      NodeStack.if(metric.equal(i32(0)), () => {
        sqdist.assign(sqrt(sqdist));
      });

      return sqdist;
    },
    {
      name: 'mx_worley_noise_f32_1',
      type: TypeName.f32,
      inputs: [
        { name: 'p', type: TypeName.vec3 },
        { name: 'jitter', type: TypeName.f32 },
        { name: 'metric', type: TypeName.i32 },
      ],
    },
  ),
]);

export const worleyVec2 = overloadHsl([
  hsl(
    ([p_i, jitter_i, metric_i]) => {
      const metric = i32(metric_i).toVar();
      const jitter = f32(jitter_i).toVar();
      const p = vec2(p_i).toVar();
      const X = i32().toVar(),
        Y = i32().toVar();
      const localpos = vec2(floorfrac(p.x, X), floorfrac(p.y, Y)).toVar();
      const sqdist = vec2(1e6, 1e6).toVar();

      loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
        loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
          const dist = f32(worleyDistance(localpos, x, y, X, Y, jitter, metric)).toVar();

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
    },
    {
      name: 'mx_worley_noise_vec2_0',
      type: TypeName.vec2,
      inputs: [
        { name: 'p', type: TypeName.vec2 },
        { name: 'jitter', type: TypeName.f32 },
        { name: 'metric', type: TypeName.i32 },
      ],
    },
  ),
  hsl(
    ([p_i, jitter_i, metric_i]) => {
      const metric = i32(metric_i).toVar();
      const jitter = f32(jitter_i).toVar();
      const p = vec2(p_i).toVar();
      const X = i32().toVar(),
        Y = i32().toVar();
      const localpos = vec2(floorfrac(p.x, X), floorfrac(p.y, Y)).toVar();
      const sqdist = vec3(1e6, 1e6, 1e6).toVar();

      loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
        loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
          const dist = f32(worleyDistance(localpos, x, y, X, Y, jitter, metric)).toVar();

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
    },
    {
      name: 'mx_worley_noise_vec3_0',
      type: TypeName.vec3,
      inputs: [
        { name: 'p', type: TypeName.vec2 },
        { name: 'jitter', type: TypeName.f32 },
        { name: 'metric', type: TypeName.i32 },
      ],
    },
  ),
]);

export const worleyVec3 = overloadHsl([
  hsl(
    ([p_i, jitter_i, metric_i]) => {
      const metric = i32(metric_i).toVar();
      const jitter = f32(jitter_i).toVar();
      const p = vec2(p_i).toVar();
      const X = i32().toVar(),
        Y = i32().toVar();
      const localpos = vec2(floorfrac(p.x, X), floorfrac(p.y, Y)).toVar();
      const sqdist = vec3(1e6, 1e6, 1e6).toVar();

      loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
        loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
          const dist = f32(worleyDistance(localpos, x, y, X, Y, jitter, metric)).toVar();

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
    },
    {
      name: 'mx_worley_noise_vec3_0',
      type: TypeName.vec3,
      inputs: [
        { name: 'p', type: TypeName.vec2 },
        { name: 'jitter', type: TypeName.f32 },
        { name: 'metric', type: TypeName.i32 },
      ],
    },
  ),
  hsl(
    ([p_i, jitter_i, metric_i]) => {
      const metric = i32(metric_i).toVar();
      const jitter = f32(jitter_i).toVar();
      const p = vec3(p_i).toVar();
      const X = i32().toVar(),
        Y = i32().toVar(),
        Z = i32().toVar();
      const localpos = vec3(floorfrac(p.x, X), floorfrac(p.y, Y), floorfrac(p.z, Z)).toVar();
      const sqdist = vec3(1e6, 1e6, 1e6).toVar();

      loop({ start: -1, end: i32(1), name: 'x', condition: '<=' }, ({ x }) => {
        loop({ start: -1, end: i32(1), name: 'y', condition: '<=' }, ({ y }) => {
          loop({ start: -1, end: i32(1), name: 'z', condition: '<=' }, ({ z }) => {
            const dist = f32(worleyDistance(localpos, x, y, z, X, Y, Z, jitter, metric)).toVar();

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
    },
    {
      name: 'mx_worley_noise_vec3_1',
      type: TypeName.vec3,
      inputs: [
        { name: 'p', type: TypeName.vec3 },
        { name: 'jitter', type: TypeName.f32 },
        { name: 'metric', type: TypeName.i32 },
      ],
    },
  ),
]);

const tri = hsl(
  ([x]) => {
    return x.fract().sub(0.5).abs();
  },
  {
    name: 'tri',
    type: TypeName.f32,
    inputs: [{ name: 'x', type: TypeName.f32 }],
  },
);

const tri3 = hsl(
  ([p]) => {
    return vec3(tri(p.z.add(tri(p.y.mul(1)))), tri(p.z.add(tri(p.x.mul(1)))), tri(p.y.add(tri(p.x.mul(1)))));
  },
  {
    name: 'tri3',
    type: TypeName.vec3,
    inputs: [{ name: 'p', type: TypeName.vec3 }],
  },
);

export const triF32 = hsl(
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
