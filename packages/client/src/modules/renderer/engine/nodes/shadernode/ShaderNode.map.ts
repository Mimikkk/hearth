import '@modules/renderer/engine/nodes/core/ConstNode.js';

export const NodeCommands = new Map();

export const addNodeCommand = (name: string, nodeElement: Node) => NodeCommands.set(name, nodeElement);
