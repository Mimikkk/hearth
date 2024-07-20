import { constMap } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.map.js';
import ConstNode from '@modules/renderer/engine/nodes/core/ConstNode.js';

const rs = /[rs]/g;
const gt = /[gt]/g;
const bp = /[bp]/g;
const aq = /[aq]/g;

export const parseSwizzle = props => props.replace(rs, 'x').replace(gt, 'y').replace(bp, 'z').replace(aq, 'w');

export const getConstNode = (value, type) => {
  if (constMap.has(value)) return constMap.get(value);
  if (value.isNode) return value;
  return new ConstNode(value, type);
};
