import { Color, Mat3, Mat4, Vec2, Vec3, Vec4 } from '@modules/renderer/engine/engine.js';
import { TypeName } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.types.js';

export function getCacheKey(object, force = false) {
  let cacheKey = '{';

  if (object.isNode === true) {
    cacheKey += object.id;
  }

  for (const { property, childNode } of getNodeChildren(object)) {
    cacheKey += ',' + property.slice(0, -4) + ':' + childNode.getCacheKey(force);
  }

  cacheKey += '}';

  return cacheKey;
}

export function* getNodeChildren(node) {
  for (const property in node) {
    // Ignore private properties.
    if (property.startsWith('_') === true) continue;

    const object = node[property];

    if (Array.isArray(object) === true) {
      for (let i = 0; i < object.length; i++) {
        const child = object[i];

        if (child && child.isNode === true) {
          yield { property, index: i, childNode: child };
        }
      }
    } else if (object && object.isNode === true) {
      yield { property, childNode: object };
    } else if (typeof object === 'object') {
      for (const subProperty in object) {
        const child = object[subProperty];

        if (child && child.isNode === true) {
          yield { property, index: subProperty, childNode: child };
        }
      }
    }
  }
}

export function getValueType(value: any): TypeName | null {
  if (value === undefined || value === null) return null;
  if (value.isNode) return TypeName.node;
  const typeOf = typeof value;
  if (typeOf === 'number') return TypeName.f32;
  if (typeOf === 'string') return TypeName.string;
  if (typeOf === 'boolean') return TypeName.bool;
  if (typeOf === 'function') return TypeName.shader;
  if (Vec2.is(value)) return TypeName.vec2;
  if (Vec3.is(value)) return TypeName.vec3;
  if (Vec4.is(value)) return TypeName.vec4;
  if (Mat3.is(value)) return TypeName.mat3;
  if (Mat4.is(value)) return TypeName.mat4;
  if (Color.is(value)) return TypeName.color;

  return null;
}

export function getValueFromType(type: TypeName, ...params: any) {
  if (type === TypeName.color) {
    return Color.new(...params);
  }
  if (type === TypeName.vec2 || type === TypeName.uvec2 || type === TypeName.bvec2 || type === TypeName.ivec2) {
    if (params.length === 1) return Vec2.new(params[0], params[0]);
    return Vec2.new(...params);
  }
  if (type === TypeName.vec3 || type === TypeName.uvec3 || type === TypeName.bvec3 || type === TypeName.ivec3) {
    if (params.length === 1) return Vec3.new(params[0], params[0], params[0]);
    return Vec3.new(...params);
  }
  if (type === TypeName.vec4 || type === TypeName.uvec4 || type === TypeName.bvec4 || type === TypeName.ivec4) {
    if (params.length === 1) return Vec4.new(params[0], params[0], params[0], params[0]);
    return Vec4.new(...params);
  }
  if (type === TypeName.mat3 || type === TypeName.imat3 || type === TypeName.umat3 || type === TypeName.bmat3) {
    return Mat3.fromColumnOrder(...params);
  }
  if (type === TypeName.mat4 || type === TypeName.imat4 || type === TypeName.umat4 || type === TypeName.bmat4) {
    return Mat4.fromColumnOrder(...params);
  }
  if (type === TypeName.bool) {
    return params[0] || false;
  }
  if (type === TypeName.f32 || type === TypeName.i32 || type === TypeName.u32) {
    return params[0] || 0;
  }

  throw new Error(`Unknown type: ${type}`);
}
