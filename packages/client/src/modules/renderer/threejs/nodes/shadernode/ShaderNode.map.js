import ConstNode from '@modules/renderer/threejs/nodes/core/ConstNode.js';

export const NodeElements = new Map();
const createByType = type => value => [value, new ConstNode(value, type)];
const createBool = createByType('bool');
const createUint = createByType('uint');
const createSint = createByType('int');
const createFloat = createByType('float');

const { PI } = Math;
const pFloats = [0, 1, 2, 3, 4, 0.5, 1.5, 1 / 3, 1e-6, 1e6, PI, PI * 2, 1 / PI, 2 / PI, 1 / (PI * 2)];
const nFloats = [-1, -2, -0.5, -1.5, -1 / 3, -1e-6, -1e6, -PI, -PI * 2, -1 / PI, -2 / PI, -1 / (PI * 2)];
const floats = pFloats.concat(nFloats);

export const boolMap = new Map([false, true].map(createBool));
export const uintMap = new Map([0, 1, 2, 3].map(createUint));
export const sintMap = new Map([-1, -2, 0, 1, 2, 3].map(createSint));
export const floatMap = new Map(floats.map(createFloat));
export const constMap = new Map([...boolMap, ...floatMap]);
