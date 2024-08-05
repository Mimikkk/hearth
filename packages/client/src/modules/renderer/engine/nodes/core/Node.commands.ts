import { Node } from './Node.js';
import { StackNode } from './StackNode.js';
import { AssignNode } from './AssignNode.js';

export const implCommand = (name: string, command: any) => {
  Node.prototype[name] = function (...value: any): Node {
    return command(this, ...value);
  };

  StackNode.prototype[name] = function (...value: any): Node {
    return this.push(command(value[0], ...value));
  };

  Node.prototype[`${name}Assign`] = function (...value: any): Node {
    return this.assign(command(this, ...value));
  };

  StackNode.prototype[`${name}Assign`] = function (...value: any): Node {
    return this.push(new AssignNode(Node.as(value[0]), command(...value.map(Node.as))));
  };
};

export const implCommands = (commands: Map<string, string>) => {
  for (const [name, command] of commands) {
    implCommand(name, command);
  }
};
