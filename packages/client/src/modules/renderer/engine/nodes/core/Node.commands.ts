import { Node } from './Node.js';
import { StackNode } from './StackNode.js';
import { AssignNode } from './AssignNode.js';
import { asNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.as.js';

const asNodes = (array: any[]): Node[] => {
  for (let i = 0, it = array.length; i < it; ++i) array[i] = asNode(array[i]);
  return array;
};

export const implCommand = (name: string, node: any) => {
  Node.prototype[name] = function (...value: any): Node {
    return Node.as(new node(Node.as(this), ...asNodes(value)));
  };

  StackNode.prototype[name] = function (...value: any): Node {
    return this.push(Node.as(new node(Node.as(value[0]), ...asNodes(value))));
  };

  Node.prototype[`${name}Assign`] = function (...value: any): Node {
    return this.assign(Node.as(new node(Node.as(this), ...asNodes(value))));
  };

  StackNode.prototype[`${name}Assign`] = function (...value: any): Node {
    return this.push(Node.as(new AssignNode(Node.as(value[0]), node(...asNodes(value)))));
  };
};

export const implPrimitive = (name: string, node: any) => {
  Node.prototype[name] = function (...value: any): Node {
    return Node.as(node(Node.as(this), ...asNodes(value)));
  };

  StackNode.prototype[name] = function (...value: any): Node {
    return this.push(Node.as(node(Node.as(value[0]), ...asNodes(value))));
  };

  Node.prototype[`${name}Assign`] = function (...value: any): Node {
    return this.assign(Node.as(node(Node.as(this), ...asNodes(value))));
  };

  StackNode.prototype[`${name}Assign`] = function (...value: any): Node {
    return this.push(Node.as(new AssignNode(Node.as(value[0]), node(...asNodes(value)))));
  };
};
