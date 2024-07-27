import { NodeUpdateType } from './constants.js';
import { getCacheKey, getNodeChildren } from './NodeUtils.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';

import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { BuildStage, TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { v4 } from 'uuid';

let _nodeId = 0;

export class Node {
  declare static type: any;
  declare isNode: true;
  name?: string;
  nodeType: TypeName | null;
  updateType: NodeUpdateType;
  updateBeforeType: NodeUpdateType;
  uuid: string;
  version: number;
  _cacheKey: string | null;
  _cacheKeyVersion: number;
  id: number;

  constructor(nodeType: TypeName | null = null) {
    this.nodeType = nodeType;

    this.updateType = NodeUpdateType.None;
    this.updateBeforeType = NodeUpdateType.None;

    this.uuid = v4();

    this.version = 0;

    this._cacheKey = null;
    this._cacheKeyVersion = 0;

    this.isNode = true;

    this.id = _nodeId++;
  }

  static is(node: any): node is Node {
    return node?.isNode === true;
  }

  set needsUpdate(value: boolean) {
    if (value) this.version++;
  }

  get type(): string {
    return (this.constructor as unknown as { type: string }).type;
  }

  getSelf(): this {
    return this;
  }

  updateReference(state: NodeFrame | NodeBuilder): this {
    return this;
  }

  isGlobal(builder: NodeBuilder): boolean {
    return false;
  }

  *getChildren(): Generator<Node> {
    for (const { childNode } of getNodeChildren(this)) {
      yield childNode;
    }
  }

  traverse(callback: (node: Node) => void) {
    callback(this);

    for (const childNode of this.getChildren()) {
      childNode.traverse(callback);
    }
  }

  getCacheKey(force: boolean = false): string {
    force = force || this.version !== this._cacheKeyVersion;

    if (force === true || this._cacheKey === null) {
      this._cacheKey = getCacheKey(this, force);
      this._cacheKeyVersion = this.version;
    }

    return this._cacheKey;
  }

  getHash(builder: NodeBuilder): string {
    return this.uuid;
  }

  getUpdateType(): NodeUpdateType {
    return this.updateType;
  }

  getUpdateBeforeType(): NodeUpdateType {
    return this.updateBeforeType;
  }

  getNodeType(builder: NodeBuilder): TypeName {
    const nodeProperties = builder.getNodeProperties(this);

    if (nodeProperties.outputNode) {
      return nodeProperties.outputNode.getNodeType(builder);
    }

    return this.nodeType;
  }

  getShared(builder: NodeBuilder) {
    const hash = this.getHash(builder);
    const nodeFromHash = builder.hashNodes[hash];

    return nodeFromHash || this;
  }

  setup(builder: NodeBuilder): Node | null | void {
    const nodeProperties = builder.getNodeProperties(this);

    for (const childNode of this.getChildren()) {
      nodeProperties['_node' + childNode.id] = childNode;
    }

    // return a outputNode if exists
    return null;
  }

  increaseUsage(builder: NodeBuilder) {
    const nodeData = builder.getDataFromNode(this);
    nodeData.usageCount = nodeData.usageCount === undefined ? 1 : nodeData.usageCount + 1;

    return nodeData.usageCount;
  }

  analyze(builder: NodeBuilder) {
    const usageCount = this.increaseUsage(builder);

    if (usageCount !== 1) return;
    const nodeProperties = builder.getNodeProperties(this);
    for (const childNode of Object.values(nodeProperties) as Node[]) {
      if (childNode?.isNode) {
        childNode.build(builder);
      }
    }
  }

  generate(builder: NodeBuilder, output: TypeName | null = null) {
    const { outputNode } = builder.getNodeProperties(this);

    if (outputNode && outputNode.isNode) {
      return outputNode.build(builder, output);
    }
  }

  updateBefore(frame: NodeFrame): boolean | void {
    console.warn('Abstract function.');
  }

  update(frame: NodeFrame): boolean | void {
    console.warn('Abstract function.');
  }

  build(builder: NodeBuilder, output: string | null = null): string | null {
    const refNode = this.getShared(builder);

    if (this !== refNode) {
      return refNode.build(builder, output);
    }

    builder.addNode(this);
    builder.addChain(this);

    let result = null;
    const stage = builder.buildStage;

    switch (stage) {
      case BuildStage.Setup:
        {
          this.updateReference(builder);

          const properties = builder.getNodeProperties(this);

          if (properties.initialized !== true) {
            const stackNodesBeforeSetup = builder.stack.nodes.length;

            properties.initialized = true;
            properties.outputNode = this.setup(builder);

            if (properties.outputNode !== null && builder.stack.nodes.length !== stackNodesBeforeSetup) {
              properties.outputNode = builder.stack;
            }

            for (const childNode of Object.values(properties) as Node[]) {
              if (childNode?.isNode) {
                childNode.build(builder);
              }
            }
          }
        }
        break;
      case BuildStage.Analyze:
        {
          this.analyze(builder);
        }
        break;
      case BuildStage.Generate:
        {
          const isGenerateOnce = this.generate.length === 1;

          if (isGenerateOnce) {
            const type = this.getNodeType(builder);
            const nodeData = builder.getDataFromNode(this);

            result = nodeData.snippet;

            if (result === undefined) {
              result = this.generate(builder) || '';

              nodeData.snippet = result;
            }

            result = builder.format(result, type, output);
          } else {
            result = this.generate(builder, output) || '';
          }
        }
        break;
      default:
        throw Error(`Unsupported build stage ${stage}.`);
    }

    builder.removeChain(this);

    return result;
  }
}

export default Node;
