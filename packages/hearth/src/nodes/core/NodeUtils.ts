import type { Node } from '../../nodes/core/Node.js';

export function cacheKey(object: any, force = false) {
  let cacheKey = '{';

  if (object.isNode) cacheKey += object.id;

  for (const { property, childNode } of getNodeChildren(object)) {
    cacheKey += ',' + property.slice(0, -4) + ':' + childNode.getCacheKey(force);
  }

  cacheKey += '}';

  return cacheKey;
}

export function* getNodeChildren(node: Node) {
  for (const property in node) {
    if (property.startsWith('_')) continue;

    const object = node[property];

    if (Array.isArray(object) === true) {
      for (let i = 0; i < object.length; i++) {
        const child = object[i];

        if (child?.isNode) {
          yield { property, index: i, childNode: child };
        }
      }
    } else if (object?.isNode) {
      yield { property, childNode: object };
    } else if (typeof object === 'object') {
      for (const subProperty in object) {
        const child = object[subProperty];

        if (child?.isNode) {
          yield { property, index: subProperty, childNode: child };
        }
      }
    }
  }
}
