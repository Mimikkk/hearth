import { CodeNode } from '@modules/renderer/engine/nodes/code/CodeNode.js';

export const PolyfillMap = {
  lessThanEqual: new CodeNode(`
fn lessThanEqual(a: vec3<f32>, b: vec3<f32>) -> vec3<bool> {
	return vec3<bool>(a.x <= b.x, a.y <= b.y, a.z <= b.z);
}
`),
  greaterThan: new CodeNode(`
fn greaterThan(a: vec3<f32>, b: vec3<f32>) -> vec3<bool> {
	return vec3<bool>(a.x > b.x, a.y > b.y, a.z > b.z);
}
`),
  mod_f32: new CodeNode('fn mod_f32(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }'),
  mod_vec2: new CodeNode('fn mod_vec2(x: vec2f, y: vec2f) -> vec2f { return x - y * floor(x / y); }'),
  mod_vec3: new CodeNode('fn mod_vec3(x: vec3f, y: vec3f) -> vec3f { return x - y * floor(x / y); }'),
  mod_vec4: new CodeNode('fn mod_vec4(x: vec4f, y: vec4f) -> vec4f { return x - y * floor(x / y); }'),
  equals_bool: new CodeNode('fn equals_bool(a: bool, b: bool) -> bool { return a == b; }'),
  equals_bvec2: new CodeNode(
    'fn equals_bvec2(a: vec2f, b: vec2f) -> vec2<bool> { return vec2<bool>(a.x == b.x, a.y == b.y); }',
  ),
  equals_bvec3: new CodeNode(
    'fn equals_bvec3(a: vec3f, b: vec3f) -> vec3<bool> { return vec3<bool>(a.x == b.x, a.y == b.y, a.z == b.z); }',
  ),
  equals_bvec4: new CodeNode(
    'fn equals_bvec4(a: vec4f, b: vec4f) -> vec4<bool> { return vec4<bool>(a.x == b.x, a.y == b.y, a.z == b.z, a.w == b.w); }',
  ),
  repeatWrapping: new CodeNode(`
fn repeatWrapping(uv: vec2<f32>, dimension: vec2<u32>) -> vec2<u32> {
  let uvScaled = vec2<u32>(uv * vec2<f32>(dimension));
  
  return ((uvScaled % dimension) + dimension) % dimension;
}
`),
};

export type PolyfillName = keyof typeof PolyfillMap;
