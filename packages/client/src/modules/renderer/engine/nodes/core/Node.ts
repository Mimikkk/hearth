import { NodeUpdateStage } from './constants.js';
import { getNodeCacheKey, getNodeChildren } from './NodeUtils.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { BuildStage, TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { v4 } from 'uuid';
import type { SetNode } from '@modules/renderer/engine/nodes/utils/SetNode.js';
import type { SplitNode } from '@modules/renderer/engine/nodes/utils/SplitNode.js';
import type { ArrayElementNode } from '@modules/renderer/engine/nodes/utils/ArrayElementNode.js';
import { asNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.as.js';
import { NodeVal } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { implIndexAccess, implSwizzle } from '@modules/renderer/engine/nodes/core/Node.swizzle.js';
import { NodeStack } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.stack.js';
import { StackNode } from '@modules/renderer/engine/nodes/core/StackNode.js';
import type { AssignNode } from '@modules/renderer/engine/nodes/core/AssignNode.js';
import type { CondNode } from '@modules/renderer/engine/nodes/math/CondNode.js';

let _nodeId = 0;

export class Node {
  declare static Stack: new (...params: any) => StackNode;
  static Map: {
    split: typeof SplitNode;
    element: typeof ArrayElementNode;
    assign: typeof AssignNode;
    set: typeof SetNode;
    cond: typeof CondNode;
  } = {
    assign: null!,
    element: null!,
    split: null!,
    set: null!,
    cond: null!,
  };
  declare isNode: true;
  name?: string;
  nodeType: TypeName | null;
  stage: NodeUpdateStage;
  updateBeforeType: NodeUpdateStage;
  uuid: string;
  version: number;
  _cacheKey: string | null;
  _cacheKeyVersion: number;
  id: number;

  constructor(nodeType: TypeName | null = null) {
    this.nodeType = nodeType;

    this.stage = NodeUpdateStage.None;
    this.updateBeforeType = NodeUpdateStage.None;

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
      this._cacheKey = getNodeCacheKey(this, force);
      this._cacheKeyVersion = this.version;
    }

    return this._cacheKey;
  }

  getHash(builder: NodeBuilder): string {
    return this.uuid;
  }

  getUpdateType(): NodeUpdateStage {
    return this.stage;
  }

  getUpdateBeforeType(): NodeUpdateStage {
    return this.updateBeforeType;
  }

  getNodeType(builder: NodeBuilder, output?: TypeName): TypeName {
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

    if (Node.is(outputNode)) return outputNode.build(builder, output);
  }

  updateBefore(frame: NodeFrame): boolean | void {
    console.warn('Abstract function.');
  }

  update(frame: NodeFrame): boolean | void {
    console.warn('Abstract function.');
  }

  build(builder: NodeBuilder, output: string | null = null): string {
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

  append(): this {
    const stack = NodeStack.get()!;
    stack?.push(this);

    return this;
  }

  assign(value: Node): this {
    const assign = Node.Map.assign;
    NodeStack.get()!.push(new assign(this, value));

    return this;
  }

  [index: number]: ArrayElementNode;

  declare static as: typeof asNode;
  declare x: SplitNode;
  declare y: SplitNode;
  declare z: SplitNode;
  declare w: SplitNode;
  declare xy: SplitNode;
  declare yx: SplitNode;
  declare xz: SplitNode;
  declare zx: SplitNode;
  declare xw: SplitNode;
  declare wx: SplitNode;
  declare yz: SplitNode;
  declare zy: SplitNode;
  declare yw: SplitNode;
  declare wy: SplitNode;
  declare zw: SplitNode;
  declare wz: SplitNode;
  declare xyz: SplitNode;
  declare xzy: SplitNode;
  declare yxz: SplitNode;
  declare yzx: SplitNode;
  declare zxy: SplitNode;
  declare zyx: SplitNode;
  declare xyw: SplitNode;
  declare xwy: SplitNode;
  declare yxw: SplitNode;
  declare ywx: SplitNode;
  declare wxy: SplitNode;
  declare wyx: SplitNode;
  declare xzw: SplitNode;
  declare xwz: SplitNode;
  declare zxw: SplitNode;
  declare zwx: SplitNode;
  declare wxz: SplitNode;
  declare wzx: SplitNode;
  declare yzw: SplitNode;
  declare ywz: SplitNode;
  declare zyw: SplitNode;
  declare zwy: SplitNode;
  declare wyz: SplitNode;
  declare wzy: SplitNode;
  declare xyzw: SplitNode;
  declare xywz: SplitNode;
  declare xzyw: SplitNode;
  declare xzwy: SplitNode;
  declare xwyz: SplitNode;
  declare xwzy: SplitNode;
  declare yxzw: SplitNode;
  declare yxwz: SplitNode;
  declare yzxw: SplitNode;
  declare yzwx: SplitNode;
  declare ywxz: SplitNode;
  declare ywzx: SplitNode;
  declare zxyw: SplitNode;
  declare zxwy: SplitNode;
  declare zyxw: SplitNode;
  declare zywx: SplitNode;
  declare zwxy: SplitNode;
  declare zwyx: SplitNode;
  declare wxyz: SplitNode;
  declare wxzy: SplitNode;
  declare wyxz: SplitNode;
  declare wyzx: SplitNode;
  declare wzxy: SplitNode;
  declare wzyx: SplitNode;
  declare r: SplitNode;
  declare g: SplitNode;
  declare b: SplitNode;
  declare a: SplitNode;
  declare rg: SplitNode;
  declare gr: SplitNode;
  declare rb: SplitNode;
  declare br: SplitNode;
  declare ra: SplitNode;
  declare ar: SplitNode;
  declare gb: SplitNode;
  declare bg: SplitNode;
  declare ga: SplitNode;
  declare ag: SplitNode;
  declare ba: SplitNode;
  declare ab: SplitNode;
  declare rgb: SplitNode;
  declare rbg: SplitNode;
  declare grb: SplitNode;
  declare gbr: SplitNode;
  declare brg: SplitNode;
  declare bgr: SplitNode;
  declare rga: SplitNode;
  declare rag: SplitNode;
  declare gra: SplitNode;
  declare gar: SplitNode;
  declare arg: SplitNode;
  declare agr: SplitNode;
  declare rba: SplitNode;
  declare rab: SplitNode;
  declare bra: SplitNode;
  declare bar: SplitNode;
  declare arb: SplitNode;
  declare abr: SplitNode;
  declare gba: SplitNode;
  declare gab: SplitNode;
  declare bga: SplitNode;
  declare bag: SplitNode;
  declare agb: SplitNode;
  declare abg: SplitNode;
  declare rgba: SplitNode;
  declare rgab: SplitNode;
  declare rbga: SplitNode;
  declare rbag: SplitNode;
  declare ragb: SplitNode;
  declare rabg: SplitNode;
  declare grba: SplitNode;
  declare grab: SplitNode;
  declare garb: SplitNode;
  declare gabr: SplitNode;
  declare agrb: SplitNode;
  declare agbr: SplitNode;
  declare brga: SplitNode;
  declare brag: SplitNode;
  declare bgar: SplitNode;
  declare bgra: SplitNode;
  declare abgr: SplitNode;
  declare abrg: SplitNode;

  declare setX: (x: NodeVal<number>) => SetNode;
  declare setY: (y: NodeVal<number>) => SetNode;
  declare setZ: (z: NodeVal<number>) => SetNode;
  declare setW: (w: NodeVal<number>) => SetNode;
  declare setXY: (x: NodeVal<number>, y: NodeVal<number>) => SetNode;
  declare setXYZ: (x: NodeVal<number>, y: NodeVal<number>, z: NodeVal<number>) => SetNode;
  declare setXYZW: (x: NodeVal<number>, y: NodeVal<number>, z: NodeVal<number>, w: NodeVal<number>) => SetNode;
  declare setR: (r: NodeVal<number>) => SetNode;
  declare setG: (g: NodeVal<number>) => SetNode;
  declare setB: (b: NodeVal<number>) => SetNode;
  declare setA: (a: NodeVal<number>) => SetNode;
  declare setRG: (r: NodeVal<number>, g: NodeVal<number>) => SetNode;
  declare setRGB: (r: NodeVal<number>, g: NodeVal<number>, b: NodeVal<number>) => SetNode;
  declare setRGBA: (r: NodeVal<number>, g: NodeVal<number>, b: NodeVal<number>, a: NodeVal<number>) => SetNode;
}

implSwizzle();
implIndexAccess();
