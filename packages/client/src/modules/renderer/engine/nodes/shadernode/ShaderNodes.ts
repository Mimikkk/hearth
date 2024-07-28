import './ShaderNode.map.initialize.js';
import { NodeCommands } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.map.js';

export const addNodeCommand = (name: string, nodeElement: Node) => NodeCommands.set(name, nodeElement);

export * from './ShaderNode.primitves.js';
export * from './ShaderNode.stack.js';
export * from './ShaderNode.js';
export * from './tslFn.js';
