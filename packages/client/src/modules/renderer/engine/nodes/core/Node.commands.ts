import { Node } from './Node.js';
import { StackNode } from './StackNode.js';
import { AssignNode } from './AssignNode.js';
import { asNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.as.js';

const asNodes = (array: any[]): Node[] => {
  for (let i = 0, it = array.length; i < it; ++i) array[i] = asNode(array[i]);
  return array;
};

export const implCommand = (name: string, command: any) => {
  Node.prototype[name] = function (...value: any): Node {
    return new command(this, ...asNodes(value));
  };

  StackNode.prototype[name] = function (...value: any): Node {
    return this.push(new command(asNode(value[0]), ...asNodes(value)));
  };

  Node.prototype[`${name}Assign`] = function (...value: any): Node {
    return this.assign(new command(this, ...asNodes(value)));
  };

  StackNode.prototype[`${name}Assign`] = function (...value: any): Node {
    return this.push(new AssignNode(asNode(value[0]), command(...asNodes(value))));
  };
};

export const implPrimitive = (name: string, primitive: any) => {
  Node.prototype[name] = function (...value: any): Node {
    return primitive(this, ...asNodes(value));
  };

  StackNode.prototype[name] = function (...value: any): Node {
    return this.push(primitive(asNode(value[0]), ...asNodes(value)));
  };

  Node.prototype[`${name}Assign`] = function (...value: any): Node {
    return this.assign(primitive(this, ...asNodes(value)));
  };

  StackNode.prototype[`${name}Assign`] = function (...value: any): Node {
    return this.push(new AssignNode(asNode(value[0]), primitive(...asNodes(value))));
  };
};
