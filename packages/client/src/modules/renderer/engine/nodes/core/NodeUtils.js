import { Color, Mat3, Mat4, Vec3, Vec4 } from '@modules/renderer/engine/engine.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.ts';

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

export function getValueType(value) {
  if (value === undefined || value === null) return null;
  if (value.isNode) return 'node';

  const type = typeof value;
  if (type === 'number') return 'float';
  if (type === 'boolean') return 'bool';
  if (type === 'string') return 'string';
  if (type === 'function') return 'shader';
  if (value.isVec2) return 'vec2';
  if (value.isVec3) return 'vec3';
  if (value.isVec4) return 'vec4';
  if (value.isMat3) return 'mat3';
  if (value.isMat4) return 'mat4';
  if (value.isColor) return 'color';
  if (value instanceof ArrayBuffer) return 'ArrayBuffer';
  return null;
}

export function getValueFromType(type, ...params) {
  const last4 = type ? type.slice(-4) : undefined;

  if (params.length === 1) {
    // ensure same behaviour as in NodeBuilder.format()
    if (last4 === 'vec2') params = [params[0], params[0]];
    else if (last4 === 'vec3') params = [params[0], params[0], params[0]];
    else if (last4 === 'vec4') params = [params[0], params[0], params[0], params[0]];
  }

  if (type === 'color') return Color.new(...params);
  if (last4 === 'vec2') return Vec2.new(...params);
  if (last4 === 'vec3') return Vec3.new(...params);
  if (last4 === 'vec4') return Vec4.new(...params);
  if (last4 === 'mat3') return Mat3.new(...params);
  if (last4 === 'mat4') return new Mat4(...params);
  if (type === 'bool') return params[0] || false;
  if (type === 'float' || type === 'int' || type === 'uint') return params[0] || 0;
  if (type === 'string') return params[0] || '';

  if (type === 'ArrayBuffer') return base64ToArrayBuffer(params[0]);

  return null;
}

export function arrayBufferToBase64(arrayBuffer) {
  let chars = '';

  const array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < array.length; i++) {
    chars += String.fromCharCode(array[i]);
  }

  return btoa(chars);
}

export function base64ToArrayBuffer(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
}
