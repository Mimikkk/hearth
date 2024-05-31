import { EventDispatcher } from '../../../threejs/Three.js';
import { NodeTypeOption, NodeUpdateType } from './constants.ts';
import { getCacheKey, getNodeChildren } from './NodeUtils.js';
import { generateUuid } from '../../math/MathUtils.ts';
import NodeBuilder from '@modules/renderer/threejs/nodes/core/NodeBuilder.js';
import NodeFrame from '@modules/renderer/threejs/nodes/core/NodeFrame.js';
import { NodeType } from 'three/examples/jsm/nodes/core/constants.js';
import NodeBuilderState from '@modules/renderer/threejs/renderers/common/nodes/NodeBuilderState.js';

export const NodeClasses = new Map();

let _nodeId = 0;

class Node {
  declare static type: number;
  declare isNode: true;
  eventDispatcher = new EventDispatcher<{ dispose: {} }>();
  nodeType: NodeTypeOption | null;
  updateType: NodeUpdateType;
  updateBeforeType: NodeUpdateType;
  uuid: string;
  version: number;
  _cacheKey: string | null;
  _cacheKeyVersion: number;
  id: number;

  constructor(nodeType: NodeTypeOption | null = null) {
    this.nodeType = nodeType;

    this.updateType = NodeUpdateType.NONE;
    this.updateBeforeType = NodeUpdateType.NONE;

    this.uuid = generateUuid();

    this.version = 0;

    this._cacheKey = null;
    this._cacheKeyVersion = 0;

    this.isNode = true;

    this.id = _nodeId++;
  }

  set needsUpdate(value: boolean) {
    if (value === true) {
      this.version++;
    }
  }

  get type(): string {
    return (this.constructor as unknown as { type: string }).type;
  }

  declare self: this;

  getSelf(): this {
    // Returns non-node object.

    return this.self || this;
  }

  setReference(state: NodeBuilder) {
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

  dispose() {
    this.eventDispatcher.dispatch({ type: 'dispose' }, this);
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

  getNodeType(builder: NodeBuilder): NodeTypeOption | null {
    const nodeProperties = builder.getNodeProperties(this);

    if (nodeProperties.outputNode) {
      return nodeProperties.outputNode.getNodeType(builder);
    }

    return this.nodeType;
  }

  getShared(builder: NodeBuilder) {
    const hash = this.getHash(builder);
    const nodeFromHash = builder.getNodeFromHash(hash);

    return nodeFromHash || this;
  }

  setup(builder: NodeBuilder): Node | null {
    const nodeProperties = builder.getNodeProperties(this);

    for (const childNode of this.getChildren()) {
      nodeProperties['_node' + childNode.id] = childNode;
    }

    // return a outputNode if exists
    return null;
  }

  construct(builder: NodeBuilder) {
    // @deprecated, r157

    console.warn('THREE.Node: construct() is deprecated. Use setup() instead.');

    return this.setup(builder);
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

  generate(builder: NodeBuilder, output: string | null = null) {
    const { outputNode } = builder.getNodeProperties(this);

    if (outputNode && outputNode.isNode) {
      return outputNode.build(builder, output);
    }
  }

  updateBefore(frame: NodeFrame) {
    console.warn('Abstract function.');
  }

  update(frame: NodeFrame) {
    console.warn('Abstract function.');
  }

  build(builder: NodeBuilder, output: string | null = null) {
    const refNode = this.getShared(builder);

    if (this !== refNode) {
      return refNode.build(builder, output);
    }

    builder.addNode(this);
    builder.addChain(this);

    /* Build stages expected results:
			- "setup"		-> Node
			- "analyze"		-> null
			- "generate"	-> String
		*/
    let result = null;

    const buildStage = builder.getBuildStage();

    if (buildStage === 'setup') {
      this.setReference(builder);

      const properties = builder.getNodeProperties(this);

      if (properties.initialized !== true || builder.context.tempRead === false) {
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
    } else if (buildStage === 'analyze') {
      this.analyze(builder);
    } else if (buildStage === 'generate') {
      const isGenerateOnce = this.generate.length === 1;

      if (isGenerateOnce) {
        const type = this.getNodeType(builder);
        const nodeData = builder.getDataFromNode(this);

        result = nodeData.snippet;

        if (result === undefined /*|| builder.context.tempRead === false*/) {
          result = this.generate(builder) || '';

          nodeData.snippet = result;
        }

        result = builder.format(result, type, output);
      } else {
        result = this.generate(builder, output) || '';
      }
    }

    builder.removeChain(this);

    return result;
  }
}

export default Node;

export function addNodeClass(type: string, nodeClass: any) {
  if (typeof nodeClass !== 'function' || !type) throw new Error(`Node class ${type} is not a class`);
  if (NodeClasses.has(type)) {
    console.warn(`Redefinition of node class ${type}`);
    return;
  }

  NodeClasses.set(type, nodeClass);
  nodeClass.type = type;
}

export function createNodeFromType(type: NodeType) {
  const Class = NodeClasses.get(type);

  if (Class !== undefined) return new Class();
}
