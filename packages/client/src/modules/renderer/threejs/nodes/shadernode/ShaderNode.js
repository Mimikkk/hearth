import './ShaderNode.map.initialize.js';
import { NodeElements } from './ShaderNode.map.js';

export const addNodeElement = (name, nodeElement) => NodeElements.set(name, nodeElement);
export * from './ShaderNode.class.js';
export * from './ShaderNode.stack.js';
