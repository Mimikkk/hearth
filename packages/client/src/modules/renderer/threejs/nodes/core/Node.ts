import { EventDispatcher } from '../../../threejs/Three.js';
import { NodeUpdateType } from './constants.ts';
import { getCacheKey, getNodeChildren } from './NodeUtils.js';
import { generateUuid } from '../../math/MathUtils.ts';

const NodeClasses = new Map();

let _nodeId = 0;

class Node {
  eventDispatcher = new EventDispatcher();

  constructor(nodeType = null) {
    this.nodeType = nodeType;

    this.updateType = NodeUpdateType.NONE;
    this.updateBeforeType = NodeUpdateType.NONE;

    this.uuid = generateUuid();

    this.version = 0;

    this._cacheKey = null;
    this._cacheKeyVersion = 0;

    this.isNode = true;

    Object.defineProperty(this, 'id', { value: _nodeId++ });
  }

  set needsUpdate(value) {
    if (value === true) {
      this.version++;
    }
  }

  get type() {
    return this.constructor.type;
  }

  getSelf() {
    // Returns non-node object.

    return this.self || this;
  }

  setReference(state) {
    return this;
  }

  isGlobal(builder) {
    return false;
  }

  *getChildren() {
    for (const { childNode } of getNodeChildren(this)) {
      yield childNode;
    }
  }

  dispose() {
    this.eventDispatcher.dispatch({ type: 'dispose' }, this);
  }

  traverse(callback) {
    callback(this);

    for (const childNode of this.getChildren()) {
      childNode.traverse(callback);
    }
  }

  getCacheKey(force = false) {
    force = force || this.version !== this._cacheKeyVersion;

    if (force === true || this._cacheKey === null) {
      this._cacheKey = getCacheKey(this, force);
      this._cacheKeyVersion = this.version;
    }

    return this._cacheKey;
  }

  getHash(builder) {
    return this.uuid;
  }

  getUpdateType() {
    return this.updateType;
  }

  getUpdateBeforeType() {
    return this.updateBeforeType;
  }

  getNodeType(builder) {
    const nodeProperties = builder.getNodeProperties(this);

    if (nodeProperties.outputNode) {
      return nodeProperties.outputNode.getNodeType(builder);
    }

    return this.nodeType;
  }

  getShared(builder) {
    const hash = this.getHash(builder);
    const nodeFromHash = builder.getNodeFromHash(hash);

    return nodeFromHash || this;
  }

  setup(builder) {
    const nodeProperties = builder.getNodeProperties(this);

    for (const childNode of this.getChildren()) {
      nodeProperties['_node' + childNode.id] = childNode;
    }

    // return a outputNode if exists
    return null;
  }

  construct(builder) {
    // @deprecated, r157

    console.warn('THREE.Node: construct() is deprecated. Use setup() instead.');

    return this.setup(builder);
  }

  increaseUsage(builder) {
    const nodeData = builder.getDataFromNode(this);
    nodeData.usageCount = nodeData.usageCount === undefined ? 1 : nodeData.usageCount + 1;

    return nodeData.usageCount;
  }

  analyze(builder) {
    const usageCount = this.increaseUsage(builder);

    if (usageCount === 1) {
      // node flow children

      const nodeProperties = builder.getNodeProperties(this);

      for (const childNode of Object.values(nodeProperties)) {
        if (childNode && childNode.isNode === true) {
          childNode.build(builder);
        }
      }
    }
  }

  generate(builder, output) {
    const { outputNode } = builder.getNodeProperties(this);

    if (outputNode && outputNode.isNode === true) {
      return outputNode.build(builder, output);
    }
  }

  updateBefore(frame) {
    console.warn('Abstract function.');
  }

  update(frame) {
    console.warn('Abstract function.');
  }

  build(builder, output = null) {
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

        for (const childNode of Object.values(properties)) {
          if (childNode && childNode.isNode === true) {
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

export function addNodeClass(type, nodeClass) {
  if (typeof nodeClass !== 'function' || !type) throw new Error(`Node class ${type} is not a class`);
  if (NodeClasses.has(type)) {
    console.warn(`Redefinition of node class ${type}`);
    return;
  }

  NodeClasses.set(type, nodeClass);
  nodeClass.type = type;
}

export function createNodeFromType(type) {
  const Class = NodeClasses.get(type);

  if (Class !== undefined) {
    return new Class();
  }
}
