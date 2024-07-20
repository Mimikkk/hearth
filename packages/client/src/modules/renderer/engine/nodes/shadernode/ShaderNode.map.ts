import ConstNode from '@modules/renderer/engine/nodes/core/ConstNode.js';

export const NodeElements = new Map();

const createEntryByType = type => value => [value, new ConstNode(value, type)];
const createBool = createEntryByType('bool');
const createUint = createEntryByType('uint');
const createSint = createEntryByType('int');
const createFloat = createEntryByType('float');

export const boolMap = new Map([false, true].map(createBool));
export const uintMap = new Map([0, 1, 2, 3].map(createUint));
export const sintMap = new Map([0, 1, 2, 3, -1, -2].map(createSint));

const floats = [
  0,
  1,
  2,
  3,
  -1,
  -2,
  0.5,
  1.5,
  1 / 3,
  1e-6,
  1e6,
  Math.PI,
  Math.PI * 2,
  1 / Math.PI,
  2 / Math.PI,
  1 / (Math.PI * 2),
  Math.PI / 2,
];
export const floatMap = new Map(floats.map(createFloat));
export const constMap = new Map([...boolMap, ...floatMap]);
