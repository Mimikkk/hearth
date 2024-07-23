import ConstNode from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { TypeName } from '@modules/renderer/engine/renderers/webgpu/nodes/NodeBuilder.types.js';

export const NodeElements = new Map();

const createEntryByType =
  (type: TypeName) =>
  <T>(value: T): [T, ConstNode<T>] => [value, new ConstNode(value, type)];
const createBool = createEntryByType(TypeName.bool);
const createU32 = createEntryByType(TypeName.u32);
const createI32 = createEntryByType(TypeName.i32);
const createF32 = createEntryByType(TypeName.f32);

export const boolMap = new Map([false, true].map(createBool));
export const uintMap = new Map([0, 1, 2, 3].map(createU32));
export const sintMap = new Map([0, 1, 2, 3, -1, -2].map(createI32));
export const floatMap = new Map(
  [
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
  ].map(createF32),
);
