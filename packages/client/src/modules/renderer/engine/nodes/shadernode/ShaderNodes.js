import './ShaderNode.map.initialize.js';
import { NodeElements } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.map.js';

export const addNodeElement = (name, nodeElement) => NodeElements.set(name, nodeElement);

export * from './ShaderNode.primitves.js';
export * from './ShaderNode.stack.ts';
export * from './ShaderNode.js';
export * from './tslFn.js';
