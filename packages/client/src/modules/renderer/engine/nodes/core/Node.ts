import { NodeUpdateStage } from './constants.js';
import { cacheKey, getNodeChildren } from './NodeUtils.js';
import type { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import type { NodeFrame } from '@modules/renderer/engine/nodes/core/NodeFrame.js';
import { BuildStage, TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { v4 } from 'uuid';
import type { SetNode } from '@modules/renderer/engine/nodes/utils/SetNode.js';
import type { SplitNode } from '@modules/renderer/engine/nodes/utils/SplitNode.js';
import type { ArrayElementNode } from '@modules/renderer/engine/nodes/utils/ArrayElementNode.js';
import type { NodeVal } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { implIndexAccess, implSwizzle } from '@modules/renderer/engine/nodes/core/Node.swizzle.js';
import { NodeStack } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.stack.js';
import type { StackNode } from '@modules/renderer/engine/nodes/core/StackNode.js';
import type { AssignNode } from '@modules/renderer/engine/nodes/core/AssignNode.js';
import type { CondNode } from '@modules/renderer/engine/nodes/math/CondNode.js';
import type { UnaryNode } from '@modules/renderer/engine/nodes/math/MathNode.js';
import type { TextureNode } from '@modules/renderer/engine/nodes/accessors/TextureNode.js';
import { Vec3 } from '@modules/renderer/engine/math/Vec3.js';
import type { UVNode } from '@modules/renderer/engine/nodes/accessors/UVNode.js';
import type { LightModel } from '@modules/renderer/engine/nodes/functions/LightModel.js';
import type { ColorSpace, ToneMapping } from '@modules/renderer/engine/constants.js';
import { ComputeNode } from '@modules/renderer/engine/nodes/gpgpu/ComputeNode.js';
import { Vec2 } from '@modules/renderer/engine/math/Vec2.js';
import { Vec4 } from '@modules/renderer/engine/math/Vec4.js';

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
      this._cacheKey = cacheKey(this, force);
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

  assign(value: NodeVal): this {
    const assign = Node.Map.assign;
    NodeStack.get()!.push(new assign(this, value));

    return this;
  }

  // swizzle read
  set x(value: NodeVal<number>) {}

  set y(value: NodeVal<number>) {}

  set z(value: NodeVal<number>) {}

  set w(value: NodeVal<number>) {}

  set xy(value: NodeVal<Vec2>) {}

  set yx(value: NodeVal<Vec2>) {}

  set xz(value: NodeVal<Vec2>) {}

  set zx(value: NodeVal<Vec2>) {}

  set xw(value: NodeVal<Vec2>) {}

  set wx(value: NodeVal<Vec2>) {}

  set yz(value: NodeVal<Vec2>) {}

  set zy(value: NodeVal<Vec2>) {}

  set yw(value: NodeVal<Vec2>) {}

  set wy(value: NodeVal<Vec2>) {}

  set zw(value: NodeVal<Vec2>) {}

  set wz(value: NodeVal<Vec2>) {}

  set xyz(value: NodeVal<Vec3>) {}

  set xzy(value: NodeVal<Vec3>) {}

  set yxz(value: NodeVal<Vec3>) {}

  set yzx(value: NodeVal<Vec3>) {}

  set zxy(value: NodeVal<Vec3>) {}

  set zyx(value: NodeVal<Vec3>) {}

  set xyw(value: NodeVal<Vec3>) {}

  set xwy(value: NodeVal<Vec3>) {}

  set yxw(value: NodeVal<Vec3>) {}

  set ywx(value: NodeVal<Vec3>) {}

  set wxy(value: NodeVal<Vec3>) {}

  set wyx(value: NodeVal<Vec3>) {}

  set xzw(value: NodeVal<Vec3>) {}

  set xwz(value: NodeVal<Vec3>) {}

  set zxw(value: NodeVal<Vec3>) {}

  set zwx(value: NodeVal<Vec3>) {}

  set wxz(value: NodeVal<Vec3>) {}

  set wzx(value: NodeVal<Vec3>) {}

  set yzw(value: NodeVal<Vec3>) {}

  set ywz(value: NodeVal<Vec3>) {}

  set zyw(value: NodeVal<Vec3>) {}

  set zwy(value: NodeVal<Vec3>) {}

  set wyz(value: NodeVal<Vec3>) {}

  set wzy(value: NodeVal<Vec3>) {}

  set xyzw(value: NodeVal<Vec4>) {}

  set xywz(value: NodeVal<Vec4>) {}

  set xzyw(value: NodeVal<Vec4>) {}

  set xzwy(value: NodeVal<Vec4>) {}

  set xwyz(value: NodeVal<Vec4>) {}

  set xwzy(value: NodeVal<Vec4>) {}

  set yxzw(value: NodeVal<Vec4>) {}

  set yxwz(value: NodeVal<Vec4>) {}

  set yzxw(value: NodeVal<Vec4>) {}

  set yzwx(value: NodeVal<Vec4>) {}

  set ywxz(value: NodeVal<Vec4>) {}

  set ywzx(value: NodeVal<Vec4>) {}

  set zxyw(value: NodeVal<Vec4>) {}

  set zxwy(value: NodeVal<Vec4>) {}

  set zyxw(value: NodeVal<Vec4>) {}

  set zywx(value: NodeVal<Vec4>) {}

  set zwxy(value: NodeVal<Vec4>) {}

  set zwyx(value: NodeVal<Vec4>) {}

  set wxyz(value: NodeVal<Vec4>) {}

  set wxzy(value: NodeVal<Vec4>) {}

  set wyxz(value: NodeVal<Vec4>) {}

  set wyzx(value: NodeVal<Vec4>) {}

  set wzxy(value: NodeVal<Vec4>) {}

  set wzyx(value: NodeVal<Vec4>) {}

  set r(value: NodeVal<number>) {}

  set g(value: NodeVal<number>) {}

  set b(value: NodeVal<number>) {}

  set a(value: NodeVal<number>) {}

  set rg(value: NodeVal<Vec2>) {}

  set gr(value: NodeVal<Vec2>) {}

  set rb(value: NodeVal<Vec2>) {}

  set br(value: NodeVal<Vec2>) {}

  set ra(value: NodeVal<Vec2>) {}

  set ar(value: NodeVal<Vec2>) {}

  set gb(value: NodeVal<Vec2>) {}

  set bg(value: NodeVal<Vec2>) {}

  set ga(value: NodeVal<Vec2>) {}

  set ag(value: NodeVal<Vec2>) {}

  set ba(value: NodeVal<Vec2>) {}

  set ab(value: NodeVal<Vec2>) {}

  set rgb(value: NodeVal<Vec3>) {}

  set rbg(value: NodeVal<Vec3>) {}

  set grb(value: NodeVal<Vec3>) {}

  set gbr(value: NodeVal<Vec3>) {}

  set brg(value: NodeVal<Vec3>) {}

  set bgr(value: NodeVal<Vec3>) {}

  set rga(value: NodeVal<Vec3>) {}

  set rag(value: NodeVal<Vec3>) {}

  set gra(value: NodeVal<Vec3>) {}

  set gar(value: NodeVal<Vec3>) {}

  set arg(value: NodeVal<Vec3>) {}

  set agr(value: NodeVal<Vec3>) {}

  set rba(value: NodeVal<Vec3>) {}

  set rab(value: NodeVal<Vec3>) {}

  set bra(value: NodeVal<Vec3>) {}

  set bar(value: NodeVal<Vec3>) {}

  set arb(value: NodeVal<Vec3>) {}

  set abr(value: NodeVal<Vec3>) {}

  set gba(value: NodeVal<Vec3>) {}

  set gab(value: NodeVal<Vec3>) {}

  set bga(value: NodeVal<Vec3>) {}

  set bag(value: NodeVal<Vec3>) {}

  set agb(value: NodeVal<Vec3>) {}

  set abg(value: NodeVal<Vec3>) {}

  set rgba(value: NodeVal<Vec4>) {}

  set rgab(value: NodeVal<Vec4>) {}

  set rbga(value: NodeVal<Vec4>) {}

  set rbag(value: NodeVal<Vec4>) {}

  set ragb(value: NodeVal<Vec4>) {}

  set rabg(value: NodeVal<Vec4>) {}

  set grba(value: NodeVal<Vec4>) {}

  set grab(value: NodeVal<Vec4>) {}

  set garb(value: NodeVal<Vec4>) {}

  set gabr(value: NodeVal<Vec4>) {}

  set agrb(value: NodeVal<Vec4>) {}

  set agbr(value: NodeVal<Vec4>) {}

  set brga(value: NodeVal<Vec4>) {}

  set brag(value: NodeVal<Vec4>) {}

  set bgar(value: NodeVal<Vec4>) {}

  set bgra(value: NodeVal<Vec4>) {}

  set abgr(value: NodeVal<Vec4>) {}

  set abrg(value: NodeVal<Vec4>) {}

  // swizzle read
  get x(): SplitNode {
    throw Error('panic!');
  }

  get y(): SplitNode {
    throw Error('panic!');
  }

  get z(): SplitNode {
    throw Error('panic!');
  }

  get w(): SplitNode {
    throw Error('panic!');
  }

  get xy(): SplitNode {
    throw Error('panic!');
  }

  get yx(): SplitNode {
    throw Error('panic!');
  }

  get xz(): SplitNode {
    throw Error('panic!');
  }

  get zx(): SplitNode {
    throw Error('panic!');
  }

  get xw(): SplitNode {
    throw Error('panic!');
  }

  get wx(): SplitNode {
    throw Error('panic!');
  }

  get yz(): SplitNode {
    throw Error('panic!');
  }

  get zy(): SplitNode {
    throw Error('panic!');
  }

  get yw(): SplitNode {
    throw Error('panic!');
  }

  get wy(): SplitNode {
    throw Error('panic!');
  }

  get zw(): SplitNode {
    throw Error('panic!');
  }

  get wz(): SplitNode {
    throw Error('panic!');
  }

  get xyz(): SplitNode {
    throw Error('panic!');
  }

  get xzy(): SplitNode {
    throw Error('panic!');
  }

  get yxz(): SplitNode {
    throw Error('panic!');
  }

  get yzx(): SplitNode {
    throw Error('panic!');
  }

  get zxy(): SplitNode {
    throw Error('panic!');
  }

  get zyx(): SplitNode {
    throw Error('panic!');
  }

  get xyw(): SplitNode {
    throw Error('panic!');
  }

  get xwy(): SplitNode {
    throw Error('panic!');
  }

  get yxw(): SplitNode {
    throw Error('panic!');
  }

  get ywx(): SplitNode {
    throw Error('panic!');
  }

  get wxy(): SplitNode {
    throw Error('panic!');
  }

  get wyx(): SplitNode {
    throw Error('panic!');
  }

  get xzw(): SplitNode {
    throw Error('panic!');
  }

  get xwz(): SplitNode {
    throw Error('panic!');
  }

  get zxw(): SplitNode {
    throw Error('panic!');
  }

  get zwx(): SplitNode {
    throw Error('panic!');
  }

  get wxz(): SplitNode {
    throw Error('panic!');
  }

  get wzx(): SplitNode {
    throw Error('panic!');
  }

  get yzw(): SplitNode {
    throw Error('panic!');
  }

  get ywz(): SplitNode {
    throw Error('panic!');
  }

  get zyw(): SplitNode {
    throw Error('panic!');
  }

  get zwy(): SplitNode {
    throw Error('panic!');
  }

  get wyz(): SplitNode {
    throw Error('panic!');
  }

  get wzy(): SplitNode {
    throw Error('panic!');
  }

  get xyzw(): SplitNode {
    throw Error('panic!');
  }

  get xywz(): SplitNode {
    throw Error('panic!');
  }

  get xzyw(): SplitNode {
    throw Error('panic!');
  }

  get xzwy(): SplitNode {
    throw Error('panic!');
  }

  get xwyz(): SplitNode {
    throw Error('panic!');
  }

  get xwzy(): SplitNode {
    throw Error('panic!');
  }

  get yxzw(): SplitNode {
    throw Error('panic!');
  }

  get yxwz(): SplitNode {
    throw Error('panic!');
  }

  get yzxw(): SplitNode {
    throw Error('panic!');
  }

  get yzwx(): SplitNode {
    throw Error('panic!');
  }

  get ywxz(): SplitNode {
    throw Error('panic!');
  }

  get ywzx(): SplitNode {
    throw Error('panic!');
  }

  get zxyw(): SplitNode {
    throw Error('panic!');
  }

  get zxwy(): SplitNode {
    throw Error('panic!');
  }

  get zyxw(): SplitNode {
    throw Error('panic!');
  }

  get zywx(): SplitNode {
    throw Error('panic!');
  }

  get zwxy(): SplitNode {
    throw Error('panic!');
  }

  get zwyx(): SplitNode {
    throw Error('panic!');
  }

  get wxyz(): SplitNode {
    throw Error('panic!');
  }

  get wxzy(): SplitNode {
    throw Error('panic!');
  }

  get wyxz(): SplitNode {
    throw Error('panic!');
  }

  get wyzx(): SplitNode {
    throw Error('panic!');
  }

  get wzxy(): SplitNode {
    throw Error('panic!');
  }

  get wzyx(): SplitNode {
    throw Error('panic!');
  }

  get r(): SplitNode {
    throw Error('panic!');
  }

  get g(): SplitNode {
    throw Error('panic!');
  }

  get b(): SplitNode {
    throw Error('panic!');
  }

  get a(): SplitNode {
    throw Error('panic!');
  }

  get rg(): SplitNode {
    throw Error('panic!');
  }

  get gr(): SplitNode {
    throw Error('panic!');
  }

  get rb(): SplitNode {
    throw Error('panic!');
  }

  get br(): SplitNode {
    throw Error('panic!');
  }

  get ra(): SplitNode {
    throw Error('panic!');
  }

  get ar(): SplitNode {
    throw Error('panic!');
  }

  get gb(): SplitNode {
    throw Error('panic!');
  }

  get bg(): SplitNode {
    throw Error('panic!');
  }

  get ga(): SplitNode {
    throw Error('panic!');
  }

  get ag(): SplitNode {
    throw Error('panic!');
  }

  get ba(): SplitNode {
    throw Error('panic!');
  }

  get ab(): SplitNode {
    throw Error('panic!');
  }

  get rgb(): SplitNode {
    throw Error('panic!');
  }

  get rbg(): SplitNode {
    throw Error('panic!');
  }

  get grb(): SplitNode {
    throw Error('panic!');
  }

  get gbr(): SplitNode {
    throw Error('panic!');
  }

  get brg(): SplitNode {
    throw Error('panic!');
  }

  get bgr(): SplitNode {
    throw Error('panic!');
  }

  get rga(): SplitNode {
    throw Error('panic!');
  }

  get rag(): SplitNode {
    throw Error('panic!');
  }

  get gra(): SplitNode {
    throw Error('panic!');
  }

  get gar(): SplitNode {
    throw Error('panic!');
  }

  get arg(): SplitNode {
    throw Error('panic!');
  }

  get agr(): SplitNode {
    throw Error('panic!');
  }

  get rba(): SplitNode {
    throw Error('panic!');
  }

  get rab(): SplitNode {
    throw Error('panic!');
  }

  get bra(): SplitNode {
    throw Error('panic!');
  }

  get bar(): SplitNode {
    throw Error('panic!');
  }

  get arb(): SplitNode {
    throw Error('panic!');
  }

  get abr(): SplitNode {
    throw Error('panic!');
  }

  get gba(): SplitNode {
    throw Error('panic!');
  }

  get gab(): SplitNode {
    throw Error('panic!');
  }

  get bga(): SplitNode {
    throw Error('panic!');
  }

  get bag(): SplitNode {
    throw Error('panic!');
  }

  get agb(): SplitNode {
    throw Error('panic!');
  }

  get abg(): SplitNode {
    throw Error('panic!');
  }

  get rgba(): SplitNode {
    throw Error('panic!');
  }

  get rgab(): SplitNode {
    throw Error('panic!');
  }

  get rbga(): SplitNode {
    throw Error('panic!');
  }

  get rbag(): SplitNode {
    throw Error('panic!');
  }

  get ragb(): SplitNode {
    throw Error('panic!');
  }

  get rabg(): SplitNode {
    throw Error('panic!');
  }

  get grba(): SplitNode {
    throw Error('panic!');
  }

  get grab(): SplitNode {
    throw Error('panic!');
  }

  get garb(): SplitNode {
    throw Error('panic!');
  }

  get gabr(): SplitNode {
    throw Error('panic!');
  }

  get agrb(): SplitNode {
    throw Error('panic!');
  }

  get agbr(): SplitNode {
    throw Error('panic!');
  }

  get brga(): SplitNode {
    throw Error('panic!');
  }

  get brag(): SplitNode {
    throw Error('panic!');
  }

  get bgar(): SplitNode {
    throw Error('panic!');
  }

  get bgra(): SplitNode {
    throw Error('panic!');
  }

  get abgr(): SplitNode {
    throw Error('panic!');
  }

  get abrg(): SplitNode {
    throw Error('panic!');
  }

  // swizzle set
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

  // math nodes
  declare all: () => Node;
  declare any: () => Node;
  declare equals: () => Node;
  declare radians: () => Node;
  declare degrees: () => Node;
  declare exp: () => Node;
  declare exp2: () => Node;
  declare log: () => Node;
  declare log2: () => Node;
  declare sqrt: () => Node;
  declare inverseSqrt: () => Node;
  declare floor: () => Node;
  declare ceil: () => Node;
  declare normalize: () => Node;
  declare fract: () => Node;
  declare sin: () => Node;
  declare cos: () => Node;
  declare tan: () => Node;
  declare asin: () => Node;
  declare acos: () => Node;
  declare atan: () => Node;
  declare abs: () => Node;
  declare sign: () => Node;
  declare length: () => Node;
  declare lengthSq: () => Node;
  declare negate: () => Node;
  declare oneMinus: () => Node;
  declare dpdx: () => Node;
  declare dpdy: () => Node;
  declare round: () => Node;
  declare reciprocal: () => Node;
  declare trunc: () => Node;
  declare fwidth: () => Node;
  declare bitcast: () => Node;
  declare atan2: (y: NodeVal<number>) => Node;
  declare min: (b: NodeVal<number>) => Node;
  declare max: (b: NodeVal<number>) => Node;
  declare mod: (b: NodeVal<number>) => Node;
  declare step: (b: NodeVal<number>) => Node;
  declare reflect: (b: NodeVal<number>) => Node;
  declare distance: (b: NodeVal<number>) => Node;
  declare difference: (b: NodeVal<number>) => Node;
  declare dot: (b: NodeVal<number>) => Node;
  declare cross: (b: NodeVal<number>) => Node;
  declare pow: (b: NodeVal<number>) => Node;
  declare pow2: () => Node;
  declare pow3: () => Node;
  declare transformDirection: (b: NodeVal<number>) => Node;
  declare mix: (a: NodeVal<number>, b: NodeVal<number>) => Node;
  declare clamp: (min: NodeVal<number>, max: NodeVal<number>) => Node;
  declare refract: (normal: NodeVal<number>, eta: NodeVal<number>) => Node;
  declare smoothstep: (min: NodeVal<number>, max: NodeVal<number>) => Node;
  declare faceforward: (normal: NodeVal<number>, incident: NodeVal<number>) => Node;
  declare saturate: () => Node;
  declare cbrt: () => Node;
  // operators
  declare add: (...values: NodeVal<number>[]) => Node;
  declare sub: (...values: NodeVal<number>[]) => Node;
  declare mul: (...values: NodeVal<number>[]) => Node;
  declare div: (...values: NodeVal<number>[]) => Node;
  declare remainder: (...values: NodeVal<number>[]) => Node;
  declare equal: (...values: NodeVal<number>[]) => Node;
  declare notEqual: (...values: NodeVal<number>[]) => Node;
  declare lessThan: (...values: NodeVal<number>[]) => Node;
  declare greaterThan: (...values: NodeVal<number>[]) => Node;
  declare lessThanEqual: (...values: NodeVal<number>[]) => Node;
  declare greaterThanEqual: (...values: NodeVal<number>[]) => Node;
  declare and: (...values: NodeVal<number>[]) => Node;
  declare or: (...values: NodeVal<number>[]) => Node;
  declare not: () => UnaryNode;
  declare bitAnd: (...values: NodeVal<number>[]) => Node;
  declare bitNot: () => UnaryNode;
  declare bitOr: (...values: NodeVal<number>[]) => Node;
  declare bitXor: (...values: NodeVal<number>[]) => Node;
  declare shiftLeft: (...values: NodeVal<number>[]) => Node;
  declare shiftRight: (...values: NodeVal<number>[]) => Node;
  // primitive nodes
  declare color: (r?: NodeVal<number>, g?: NodeVal<number>, b?: NodeVal<number>, a?: NodeVal<number>) => Node;
  declare f32: (value?: NodeVal<number>) => Node;
  declare i32: (value?: NodeVal<number>) => Node;
  declare u32: (value?: NodeVal<number>) => Node;
  declare bool: (value?: NodeVal<number>) => Node;
  declare vec2: (x?: NodeVal<number>, y?: NodeVal<number>) => Node;
  declare ivec2: (x?: NodeVal<number>, y?: NodeVal<number>) => Node;
  declare uvec2: (x?: NodeVal<number>, y?: NodeVal<number>) => Node;
  declare bvec2: (x?: NodeVal<number>, y?: NodeVal<number>) => Node;
  declare vec3: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>) => Node;
  declare ivec3: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>) => Node;
  declare uvec3: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>) => Node;
  declare bvec3: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>) => Node;
  declare vec4: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>) => Node;
  declare ivec4: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>) => Node;
  declare uvec4: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>) => Node;
  declare bvec4: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>) => Node;
  declare mat2: (a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>) => Node;
  declare imat2: (a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>) => Node;
  declare umat2: (a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>) => Node;
  declare bmat2: (a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>) => Node;
  declare mat3: (...values: NodeVal<number>[]) => Node;
  declare imat3: (...values: NodeVal<number>[]) => Node;
  declare umat3: (...values: NodeVal<number>[]) => Node;
  declare bmat3: (...values: NodeVal<number>[]) => Node;
  declare mat4: (...values: NodeVal<number>[]) => Node;
  declare imat4: (...values: NodeVal<number>[]) => Node;
  declare umat4: (...values: NodeVal<number>[]) => Node;
  declare bmat4: (...values: NodeVal<number>[]) => Node;
  declare convert: (type: TypeName) => Node;

  // up to 1...16
  [index: number]: ArrayElementNode;

  declare toAttribute: (type?: TypeName, stride?: number, offset?: number) => Node;

  // shader nodes
  declare checker: () => Node;
  declare discard: () => Node;
  declare directionToColor: () => Node;
  declare colorToDirection: () => Node;
  declare remap: (
    fromMin: NodeVal<number>,
    fromMax: NodeVal<number>,
    toMin: NodeVal<number>,
    toMax: NodeVal<number>,
  ) => Node;
  declare remapClamp: (
    fromMin: NodeVal<number>,
    fromMax: NodeVal<number>,
    toMin: NodeVal<number>,
    toMax: NodeVal<number>,
  ) => Node;
  declare rotate: (angle: NodeVal<number>) => Node;
  declare rotateUV: (angle: NodeVal<number>, center: NodeVal<number>) => Node;
  declare storageElement: (index: NodeVal<number>) => Node;
  // functions
  declare gaussianBlur: (sigma?: NodeVal<number>) => Node;
  declare bumpMap: (scale: NodeVal<number>) => Node;
  declare normalMap: (scale: NodeVal<number>) => Node;
  declare cubeTexture: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare triplanarTexture: (
    textureY: TextureNode,
    textureZ: TextureNode,
    scale: NodeVal<number>,
    position: NodeVal<Vec3>,
    normal: NodeVal<Vec3>,
  ) => Node;
  declare bicubic: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare texture: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare textureSize: (levelNode: NodeVal<number>) => Node;
  declare hash: () => Node;
  declare cond: (then: Node, or: Node) => Node;
  declare lightingContext: (lightingModel: LightModel, backdrop: Node, alpha: NodeVal<number>) => Node;
  declare compute: (count: NodeVal<number>, size?: number[]) => ComputeNode;
  declare viewportTexture: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare viewportMipTexture: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare viewportDepthTexture: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare viewportSharedTexture: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare toneMapping: (mapping: ToneMapping, exposure: NodeVal<number>) => Node;
  declare posterize: (steps: NodeVal<number>) => Node;
  declare linearTosRGB: () => Node;
  declare sRGBToLinear: () => Node;
  declare linearToColorSpace: (space: ColorSpace) => Node;
  declare colorSpaceToLinear: (space: ColorSpace) => Node;
  declare saturation: (value: NodeVal<number>) => Node;
  declare vibrance: (value: NodeVal<number>) => Node;
  declare hue: (value: NodeVal<number>) => Node;
  declare threshold: (value: NodeVal<number>) => Node;
  declare burn: (value: NodeVal<number>) => Node;
  declare dodge: (value: NodeVal<number>) => Node;
  declare overlay: (value: NodeVal<number>) => Node;
  declare screen: (value: NodeVal<number>) => Node;
  declare anamorphic: (threshold: NodeVal<number>, scale: NodeVal<number>, samples: NodeVal<number>) => Node;
  declare afterImage: (value: NodeVal<number>) => Node;
  declare toVar: (name: string) => Node;
  declare temp: (name: string) => Node;
  declare label: (name: string) => Node;
  declare context: (context: object) => Node;
  declare cache: (value: WeakMap<any, any>) => Node;
  declare globalCache: () => Node;
  declare bypass: (call: Node) => Node;
  declare scriptable: (parameters: Record<string, any>) => Node;
  declare scriptableValue: () => Node;
  declare call: (parameters: Record<string, any>) => Node;
  declare element: (index: NodeVal<number>) => ArrayElementNode;

  // assign variant

  // math nodes
  declare allAssign: () => Node;
  declare anyAssign: () => Node;
  declare equalsAssign: () => Node;
  declare radiansAssign: () => Node;
  declare degreesAssign: () => Node;
  declare expAssign: () => Node;
  declare exp2Assign: () => Node;
  declare logAssign: () => Node;
  declare log2Assign: () => Node;
  declare sqrtAssign: () => Node;
  declare inverseSqrtAssign: () => Node;
  declare floorAssign: () => Node;
  declare ceilAssign: () => Node;
  declare normalizeAssign: () => Node;
  declare fractAssign: () => Node;
  declare sinAssign: () => Node;
  declare cosAssign: () => Node;
  declare tanAssign: () => Node;
  declare asinAssign: () => Node;
  declare acosAssign: () => Node;
  declare atanAssign: () => Node;
  declare absAssign: () => Node;
  declare signAssign: () => Node;
  declare lengthAssign: () => Node;
  declare lengthSqAssign: () => Node;
  declare negateAssign: () => Node;
  declare oneMinusAssign: () => Node;
  declare dpdxAssign: () => Node;
  declare dpdyAssign: () => Node;
  declare roundAssign: () => Node;
  declare reciprocalAssign: () => Node;
  declare truncAssign: () => Node;
  declare fwidthAssign: () => Node;
  declare bitcastAssign: () => Node;
  declare atan2Assign: (y: NodeVal<number>) => Node;
  declare minAssign: (b: NodeVal<number>) => Node;
  declare maxAssign: (b: NodeVal<number>) => Node;
  declare modAssign: (b: NodeVal<number>) => Node;
  declare stepAssign: (b: NodeVal<number>) => Node;
  declare reflectAssign: (b: NodeVal<number>) => Node;
  declare distanceAssign: (b: NodeVal<number>) => Node;
  declare differenceAssign: (b: NodeVal<number>) => Node;
  declare dotAssign: (b: NodeVal<number>) => Node;
  declare crossAssign: (b: NodeVal<number>) => Node;
  declare powAssign: (b: NodeVal<number>) => Node;
  declare pow2Assign: () => Node;
  declare pow3Assign: () => Node;
  declare transformDirectionAssign: (b: NodeVal<number>) => Node;
  declare mixAssign: (a: NodeVal<number>, b: NodeVal<number>) => Node;
  declare clampAssign: (min: NodeVal<number>, max: NodeVal<number>) => Node;
  declare refractAssign: (normal: NodeVal<number>, eta: NodeVal<number>) => Node;
  declare smoothstepAssign: (min: NodeVal<number>, max: NodeVal<number>) => Node;
  declare faceforwardAssign: (normal: NodeVal<number>, incident: NodeVal<number>) => Node;
  declare saturateAssign: () => Node;
  declare cbrtAssign: () => Node;
  // operators
  declare addAssign: (b: NodeVal<number>) => Node;
  declare subAssign: (b: NodeVal<number>) => Node;
  declare mulAssign: (b: NodeVal<number>) => Node;
  declare divAssign: (b: NodeVal<number>) => Node;
  declare remainderAssign: (b: NodeVal<number>) => Node;
  declare equalAssign: (b: NodeVal<number>) => Node;
  declare notEqualAssign: (b: NodeVal<number>) => Node;
  declare lessThanAssign: (b: NodeVal<number>) => Node;
  declare greaterThanAssign: (b: NodeVal<number>) => Node;
  declare lessThanEqualAssign: (b: NodeVal<number>) => Node;
  declare greaterThanEqualAssign: (b: NodeVal<number>) => Node;
  declare andAssign: (b: NodeVal<number>) => Node;
  declare orAssign: (b: NodeVal<number>) => Node;
  declare notAssign: () => UnaryNode;
  declare bitAndAssign: (b: NodeVal<number>) => Node;
  declare bitNotAssign: () => UnaryNode;
  declare bitOrAssign: (b: NodeVal<number>) => Node;
  declare bitXorAssign: (b: NodeVal<number>) => Node;
  declare shiftLeftAssign: (b: NodeVal<number>) => Node;
  declare shiftRightAssign: (b: NodeVal<number>) => Node;
  // primitive nodes
  declare colorAssign: (r?: NodeVal<number>, g?: NodeVal<number>, b?: NodeVal<number>, a?: NodeVal<number>) => Node;
  declare f32Assign: (value?: NodeVal<number>) => Node;
  declare i32Assign: (value?: NodeVal<number>) => Node;
  declare u32Assign: (value?: NodeVal<number>) => Node;
  declare boolAssign: (value?: NodeVal<number>) => Node;
  declare vec2Assign: (x?: NodeVal<number>, y?: NodeVal<number>) => Node;
  declare ivec2Assign: (x?: NodeVal<number>, y?: NodeVal<number>) => Node;
  declare uvec2Assign: (x?: NodeVal<number>, y?: NodeVal<number>) => Node;
  declare bvec2Assign: (x?: NodeVal<number>, y?: NodeVal<number>) => Node;
  declare vec3Assign: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>) => Node;
  declare ivec3Assign: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>) => Node;
  declare uvec3Assign: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>) => Node;
  declare bvec3Assign: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>) => Node;
  declare vec4Assign: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>) => Node;
  declare ivec4Assign: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>) => Node;
  declare uvec4Assign: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>) => Node;
  declare bvec4Assign: (x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>) => Node;
  declare mat2Assign: (a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>) => Node;
  declare imat2Assign: (a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>) => Node;
  declare umat2Assign: (a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>) => Node;
  declare bmat2Assign: (a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>) => Node;
  declare mat3Assign: (...values: NodeVal<number>[]) => Node;
  declare imat3Assign: (...values: NodeVal<number>[]) => Node;
  declare umat3Assign: (...values: NodeVal<number>[]) => Node;
  declare bmat3Assign: (...values: NodeVal<number>[]) => Node;
  declare mat4Assign: (...values: NodeVal<number>[]) => Node;
  declare imat4Assign: (...values: NodeVal<number>[]) => Node;
  declare umat4Assign: (...values: NodeVal<number>[]) => Node;
  declare bmat4Assign: (...values: NodeVal<number>[]) => Node;
  declare convertAssign: (type: TypeName) => Node;
  // up to 1...16
  declare toAttributeAssign: (type?: TypeName, stride?: number, offset?: number) => Node;

  // shader nodes
  declare checkerAssign: () => Node;
  declare discardAssign: () => Node;
  declare directionToColorAssign: () => Node;
  declare colorToDirectionAssign: () => Node;
  declare remapAssign: (
    fromMin: NodeVal<number>,
    fromMax: NodeVal<number>,
    toMin: NodeVal<number>,
    toMax: NodeVal<number>,
  ) => Node;
  declare remapClampAssign: (
    fromMin: NodeVal<number>,
    fromMax: NodeVal<number>,
    toMin: NodeVal<number>,
    toMax: NodeVal<number>,
  ) => Node;
  declare rotateAssign: (angle: NodeVal<number>) => Node;
  declare rotateUVAssign: (angle: NodeVal<number>, center: NodeVal<number>) => Node;
  declare storageElementAssign: (index: NodeVal<number>) => Node;
  // functions
  declare gaussianBlurAssign: (sigma?: NodeVal<number>) => Node;
  declare bumpMapAssign: (scale: NodeVal<number>) => Node;
  declare normalMapAssign: (scale: NodeVal<number>) => Node;
  declare cubeTextureAssign: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare triplanarTextureAssign: (
    textureY: TextureNode,
    textureZ: TextureNode,
    scale: NodeVal<number>,
    position: NodeVal<Vec3>,
    normal: NodeVal<Vec3>,
  ) => Node;
  declare bicubicAssign: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare textureAssign: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare textureSizeAssign: (levelNode: NodeVal<number>) => Node;
  declare hashAssign: () => Node;
  declare condAssign: (then: Node, or: Node) => Node;
  declare lightingContextAssign: (lightingModel: LightModel, backdrop: Node, alpha: NodeVal<number>) => Node;
  declare computeAssign: (count: NodeVal<number>, size?: number[]) => Node;
  declare viewportTextureAssign: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare viewportMipTextureAssign: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare viewportDepthTextureAssign: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare viewportSharedTextureAssign: (uv: UVNode, levelNode: NodeVal<number>) => Node;
  declare toneMappingAssign: (mapping: ToneMapping, exposure: NodeVal<number>) => Node;
  declare posterizeAssign: (steps: NodeVal<number>) => Node;
  declare linearTosRGBAssign: () => Node;
  declare sRGBToLinearAssign: () => Node;
  declare linearToColorSpaceAssign: (space: ColorSpace) => Node;
  declare colorSpaceToLinearAssign: (space: ColorSpace) => Node;
  declare saturationAssign: (value: NodeVal<number>) => Node;
  declare vibranceAssign: (value: NodeVal<number>) => Node;
  declare hueAssign: (value: NodeVal<number>) => Node;
  declare thresholdAssign: (value: NodeVal<number>) => Node;
  declare burnAssign: (value: NodeVal<number>) => Node;
  declare dodgeAssign: (value: NodeVal<number>) => Node;
  declare overlayAssign: (value: NodeVal<number>) => Node;
  declare screenAssign: (value: NodeVal<number>) => Node;
  declare anamorphicAssign: (threshold: NodeVal<number>, scale: NodeVal<number>, samples: NodeVal<number>) => Node;
  declare afterImageAssign: (value: NodeVal<number>) => Node;
  declare toVarAssign: (name: string) => Node;
  declare tempAssign: (name: string) => Node;
  declare labelAssign: (name: string) => Node;
  declare contextAssign: (context: object) => Node;
  declare cacheAssign: (value: WeakMap<any, any>) => Node;
  declare globalCacheAssign: () => Node;
  declare bypassAssign: (call: Node) => Node;
  declare scriptableAssign: (parameters: Record<string, any>) => Node;
  declare scriptableValueAssign: () => Node;
  declare callAssign: (parameters: Record<string, any>) => Node;
  declare elementAssign: (index: NodeVal<number>) => Node;
}

implSwizzle();
implIndexAccess();
