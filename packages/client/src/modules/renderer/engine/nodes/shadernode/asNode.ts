import { getValueType } from '@modules/renderer/engine/nodes/core/NodeUtils.js';
import { getConstNode } from '@modules/renderer/engine/nodes/shadernode/utils.js';
import { tslFn } from '@modules/renderer/engine/nodes/shadernode/tslFn.js';
import { handlers } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.handlers.js';
import { WeakMemo } from '@modules/renderer/engine/renderers/WeakMemo.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

const memo = WeakMemo.as((value, map) => {
  const node = new Proxy(value, handlers);

  map.set(node, node);

  return node;
});

export const asNode = <T extends WeakKey>(value: T, fallbackType?: TypeName) => {
  const type = getValueType(value);

  if (type === TypeName.node) return memo.get(value);
  if (
    (!fallbackType && (type === TypeName.f32 || type === TypeName.bool)) ||
    (type && type !== TypeName.shader && type !== TypeName.string)
  )
    return asNode(getConstNode(value, fallbackType));
  if (type === TypeName.shader) return tslFn(value);

  return value;
};

export const createShaderNodeObjects = <T extends Record<string, WeakKey>>(record: T, type?: TypeName) => {
  for (const name in record) record[name] = asNode(record[name], type);
  return record;
};

export const createShaderNodeArray = <T extends WeakKey>(values: T[], type?: TypeName) => {
  for (let i = 0, it = values.length; i < it; ++i) values[i] = asNode(values[i], type);
  return values;
};
