import { NodeUpdateStage } from './constants.js';
import { cacheKey, getNodeChildren } from './NodeUtils.js';
import type { NodeBuilder } from '../../nodes/builder/NodeBuilder.js';
import type { NodeFrame } from '../../nodes/core/NodeFrame.js';
import { BuildStage, TypeName } from '../../nodes/builder/NodeBuilder.types.js';
import { v4 } from 'uuid';
import type { SetNode } from '../../nodes/utils/SetNode.js';
import type { SplitNode } from '../../nodes/utils/SplitNode.js';
import type { ArrayElementNode } from '../../nodes/utils/ArrayElementNode.js';
import type { NodeVal } from '../../nodes/core/ConstNode.js';
import { implIndexAccess, implSwizzle } from '../../nodes/core/Node.swizzle.js';
import { NodeStack } from '../../nodes/shadernode/ShaderNode.stack.js';
import type { StackNode } from '../../nodes/core/StackNode.js';
import type { AssignNode } from '../../nodes/core/AssignNode.js';
import type { CondNode } from '../../nodes/math/CondNode.js';
import type { UnaryNode } from '../../nodes/math/MathNode.js';
import type { TextureNode } from '../../nodes/accessors/TextureNode.js';
import { Vec3 } from '../../math/Vec3.js';
import type { UVNode } from '../../nodes/accessors/UVNode.js';
import type { LightModel } from '../../nodes/functions/LightModel.js';
import type { ColorSpace, ToneMapping } from '../../constants.js';
import { ComputeNode } from '../../nodes/gpgpu/ComputeNode.js';
import { Vec2 } from '../../math/Vec2.js';
import { Vec4 } from '../../math/Vec4.js';
import { GaussianBlurNode } from '../../nodes/display/GaussianBlurNode.js';

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

  set useUpdate(value: boolean) {
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
  setX(x: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setY(y: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setZ(z: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setW(w: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setXY(x: NodeVal<number>, y: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setXYZ(x: NodeVal<number>, y: NodeVal<number>, z: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setXYZW(x: NodeVal<number>, y: NodeVal<number>, z: NodeVal<number>, w: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setR(r: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setG(g: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setB(b: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setA(a: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setRG(r: NodeVal<number>, g: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setRGB(r: NodeVal<number>, g: NodeVal<number>, b: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  setRGBA(r: NodeVal<number>, g: NodeVal<number>, b: NodeVal<number>, a: NodeVal<number>): SetNode {
    throw Error('panic!');
  }

  // math nodes
  all(): Node {
    throw Error('panic!');
  }

  any(): Node {
    throw Error('panic!');
  }

  equals(): Node {
    throw Error('panic!');
  }

  radians(): Node {
    throw Error('panic!');
  }

  degrees(): Node {
    throw Error('panic!');
  }

  exp(): Node {
    throw Error('panic!');
  }

  exp2(): Node {
    throw Error('panic!');
  }

  log(): Node {
    throw Error('panic!');
  }

  log2(): Node {
    throw Error('panic!');
  }

  sqrt(): Node {
    throw Error('panic!');
  }

  inverseSqrt(): Node {
    throw Error('panic!');
  }

  floor(): Node {
    throw Error('panic!');
  }

  ceil(): Node {
    throw Error('panic!');
  }

  normalize(): Node {
    throw Error('panic!');
  }

  fract(): Node {
    throw Error('panic!');
  }

  sin(): Node {
    throw Error('panic!');
  }

  cos(): Node {
    throw Error('panic!');
  }

  tan(): Node {
    throw Error('panic!');
  }

  asin(): Node {
    throw Error('panic!');
  }

  acos(): Node {
    throw Error('panic!');
  }

  atan(): Node {
    throw Error('panic!');
  }

  abs(): Node {
    throw Error('panic!');
  }

  sign(): Node {
    throw Error('panic!');
  }

  length(): Node {
    throw Error('panic!');
  }

  lengthSq(): Node {
    throw Error('panic!');
  }

  negate(): Node {
    throw Error('panic!');
  }

  oneMinus(): Node {
    throw Error('panic!');
  }

  dpdx(): Node {
    throw Error('panic!');
  }

  dpdy(): Node {
    throw Error('panic!');
  }

  round(): Node {
    throw Error('panic!');
  }

  reciprocal(): Node {
    throw Error('panic!');
  }

  trunc(): Node {
    throw Error('panic!');
  }

  fwidth(): Node {
    throw Error('panic!');
  }

  bitcast(): Node {
    throw Error('panic!');
  }

  atan2(y: NodeVal<number>): Node {
    throw Error('panic!');
  }

  min(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  max(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  mod(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  step(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  reflect(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  distance(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  difference(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  dot(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  cross(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  pow(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  pow2(): Node {
    throw Error('panic!');
  }

  pow3(): Node {
    throw Error('panic!');
  }

  transformDirection(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  mix(a: NodeVal<number>, b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  clamp(min?: NodeVal<number>, max?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  refract(normal: NodeVal<number>, eta: NodeVal<number>): Node {
    throw Error('panic!');
  }

  smoothstep(min: NodeVal<number>, max: NodeVal<number>): Node {
    throw Error('panic!');
  }

  faceforward(normal: NodeVal<number>, incident: NodeVal<number>): Node {
    throw Error('panic!');
  }

  saturate(): Node {
    throw Error('panic!');
  }

  cbrt(): Node {
    throw Error('panic!');
  }

  // operators
  add(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  sub(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  mul(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  div(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  remainder(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  equal(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  notEqual(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  lessThan(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  greaterThan(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  lessThanEqual(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  greaterThanEqual(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  and(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  or(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  not(): UnaryNode {
    throw Error('panic!');
  }

  bitAnd(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  bitNot(): UnaryNode {
    throw Error('panic!');
  }

  bitOr(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  bitXor(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  shiftLeft(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  shiftRight(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  // primitive nodes
  color(r?: NodeVal<number>, g?: NodeVal<number>, b?: NodeVal<number>, a?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  f32(value?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  i32(value?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  u32(value?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bool(value?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  vec2(x?: NodeVal<number>, y?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  ivec2(x?: NodeVal<number>, y?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  uvec2(x?: NodeVal<number>, y?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bvec2(x?: NodeVal<number>, y?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  vec3(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  ivec3(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  uvec3(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bvec3(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  vec4(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  ivec4(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  uvec4(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bvec4(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  mat2(a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  imat2(a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  umat2(a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bmat2(a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  mat3(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  imat3(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  umat3(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  bmat3(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  mat4(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  imat4(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  umat4(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  bmat4(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  convert(type: TypeName): Node {
    throw Error('panic!');
  }

  // up to 1...16
  [index: number]: ArrayElementNode;

  toAttribute(type?: TypeName, stride?: number, offset?: number): Node {
    throw Error('panic!');
  }

  // shader nodes
  checker(): Node {
    throw Error('panic!');
  }

  discard(): Node {
    throw Error('panic!');
  }

  directionToColor(): Node {
    throw Error('panic!');
  }

  colorToDirection(): Node {
    throw Error('panic!');
  }

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

  rotate(angle: NodeVal<number>): Node {
    throw Error('panic!');
  }

  rotateUV(angle: NodeVal<number>, center: NodeVal<number>): Node {
    throw Error('panic!');
  }

  storageElement(index: NodeVal<number>): Node {
    throw Error('panic!');
  }

  // functions
  gaussianBlur(sigma?: NodeVal<number>): GaussianBlurNode {
    throw Error('panic!');
  }

  bumpMap(scale: NodeVal<number>): Node {
    throw Error('panic!');
  }

  normalMap(scale: NodeVal<number>): Node {
    throw Error('panic!');
  }

  cubeTexture(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  declare triplanarTexture: (
    textureY: TextureNode,
    textureZ: TextureNode,
    scale: NodeVal<number>,
    position: NodeVal<Vec3>,
    normal: NodeVal<Vec3>,
  ) => Node;

  bicubic(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  texture(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  textureSize(levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  hash(): Node {
    throw Error('panic!');
  }

  cond(then: Node, or: Node): Node {
    throw Error('panic!');
  }

  lightingContext(lightingModel: LightModel, backdrop: Node, alpha: NodeVal<number>): Node {
    throw Error('panic!');
  }

  compute(count: NodeVal<number>, size?: number[]): ComputeNode {
    throw Error('panic!');
  }

  viewportTexture(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  viewportMipTexture(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  viewportDepthTexture(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  viewportSharedTexture(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  toneMapping(mapping: ToneMapping, exposure: NodeVal<number>): Node {
    throw Error('panic!');
  }

  posterize(steps: NodeVal<number>): Node {
    throw Error('panic!');
  }

  linearTosRGB(): Node {
    throw Error('panic!');
  }

  sRGBToLinear(): Node {
    throw Error('panic!');
  }

  linearToColorSpace(space: ColorSpace): Node {
    throw Error('panic!');
  }

  colorSpaceToLinear(space: ColorSpace): Node {
    throw Error('panic!');
  }

  saturation(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  vibrance(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  hue(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  threshold(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  burn(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  dodge(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  overlay(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  screen(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  anamorphic(threshold: NodeVal<number>, scale: NodeVal<number>, samples: NodeVal<number>): Node {
    throw Error('panic!');
  }

  afterImage(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  toVar(name?: string): Node {
    throw Error('panic!');
  }

  temp(name?: string): Node {
    throw Error('panic!');
  }

  label(name: string): Node {
    throw Error('panic!');
  }

  context(context: object): Node {
    throw Error('panic!');
  }

  cache(value?: WeakMap<any, any>): Node {
    throw Error('panic!');
  }

  globalCache(): Node {
    throw Error('panic!');
  }

  bypass(call: Node): Node {
    throw Error('panic!');
  }

  scriptable(parameters: Record<string, any>): Node {
    throw Error('panic!');
  }

  scriptableValue(): Node {
    throw Error('panic!');
  }

  call(parameters: Record<string, any>): Node {
    throw Error('panic!');
  }

  element(index: NodeVal<number>): ArrayElementNode {
    throw Error('panic!');
  }

  // assign variant

  // math nodes
  allAssign(): Node {
    throw Error('panic!');
  }

  anyAssign(): Node {
    throw Error('panic!');
  }

  equalsAssign(): Node {
    throw Error('panic!');
  }

  radiansAssign(): Node {
    throw Error('panic!');
  }

  degreesAssign(): Node {
    throw Error('panic!');
  }

  expAssign(): Node {
    throw Error('panic!');
  }

  exp2Assign(): Node {
    throw Error('panic!');
  }

  logAssign(): Node {
    throw Error('panic!');
  }

  log2Assign(): Node {
    throw Error('panic!');
  }

  sqrtAssign(): Node {
    throw Error('panic!');
  }

  inverseSqrtAssign(): Node {
    throw Error('panic!');
  }

  floorAssign(): Node {
    throw Error('panic!');
  }

  ceilAssign(): Node {
    throw Error('panic!');
  }

  normalizeAssign(): Node {
    throw Error('panic!');
  }

  fractAssign(): Node {
    throw Error('panic!');
  }

  sinAssign(): Node {
    throw Error('panic!');
  }

  cosAssign(): Node {
    throw Error('panic!');
  }

  tanAssign(): Node {
    throw Error('panic!');
  }

  asinAssign(): Node {
    throw Error('panic!');
  }

  acosAssign(): Node {
    throw Error('panic!');
  }

  atanAssign(): Node {
    throw Error('panic!');
  }

  absAssign(): Node {
    throw Error('panic!');
  }

  signAssign(): Node {
    throw Error('panic!');
  }

  lengthAssign(): Node {
    throw Error('panic!');
  }

  lengthSqAssign(): Node {
    throw Error('panic!');
  }

  negateAssign(): Node {
    throw Error('panic!');
  }

  oneMinusAssign(): Node {
    throw Error('panic!');
  }

  dpdxAssign(): Node {
    throw Error('panic!');
  }

  dpdyAssign(): Node {
    throw Error('panic!');
  }

  roundAssign(): Node {
    throw Error('panic!');
  }

  reciprocalAssign(): Node {
    throw Error('panic!');
  }

  truncAssign(): Node {
    throw Error('panic!');
  }

  fwidthAssign(): Node {
    throw Error('panic!');
  }

  bitcastAssign(): Node {
    throw Error('panic!');
  }

  atan2Assign(y: NodeVal<number>): Node {
    throw Error('panic!');
  }

  minAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  maxAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  modAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  stepAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  reflectAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  distanceAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  differenceAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  dotAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  crossAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  powAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  pow2Assign(): Node {
    throw Error('panic!');
  }

  pow3Assign(): Node {
    throw Error('panic!');
  }

  transformDirectionAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  mixAssign(a: NodeVal<number>, b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  clampAssign(min: NodeVal<number>, max: NodeVal<number>): Node {
    throw Error('panic!');
  }

  refractAssign(normal: NodeVal<number>, eta: NodeVal<number>): Node {
    throw Error('panic!');
  }

  smoothstepAssign(min: NodeVal<number>, max: NodeVal<number>): Node {
    throw Error('panic!');
  }

  faceforwardAssign(normal: NodeVal<number>, incident: NodeVal<number>): Node {
    throw Error('panic!');
  }

  saturateAssign(): Node {
    throw Error('panic!');
  }

  cbrtAssign(): Node {
    throw Error('panic!');
  }

  // operators
  addAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  subAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  mulAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  divAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  remainderAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  equalAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  notEqualAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  lessThanAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  greaterThanAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  lessThanEqualAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  greaterThanEqualAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  andAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  orAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  notAssign(): UnaryNode {
    throw Error('panic!');
  }

  bitAndAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bitNotAssign(): UnaryNode {
    throw Error('panic!');
  }

  bitOrAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bitXorAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  shiftLeftAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  shiftRightAssign(b: NodeVal<number>): Node {
    throw Error('panic!');
  }

  // primitive nodes
  colorAssign(r?: NodeVal<number>, g?: NodeVal<number>, b?: NodeVal<number>, a?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  f32Assign(value?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  i32Assign(value?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  u32Assign(value?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  boolAssign(value?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  vec2Assign(x?: NodeVal<number>, y?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  ivec2Assign(x?: NodeVal<number>, y?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  uvec2Assign(x?: NodeVal<number>, y?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bvec2Assign(x?: NodeVal<number>, y?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  vec3Assign(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  ivec3Assign(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  uvec3Assign(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bvec3Assign(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  vec4Assign(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  ivec4Assign(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  uvec4Assign(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bvec4Assign(x?: NodeVal<number>, y?: NodeVal<number>, z?: NodeVal<number>, w?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  mat2Assign(a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  imat2Assign(a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  umat2Assign(a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bmat2Assign(a?: NodeVal<number>, b?: NodeVal<number>, c?: NodeVal<number>, d?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  mat3Assign(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  imat3Assign(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  umat3Assign(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  bmat3Assign(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  mat4Assign(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  imat4Assign(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  umat4Assign(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  bmat4Assign(...values: NodeVal<number>[]): Node {
    throw Error('panic!');
  }

  convertAssign(type: TypeName): Node {
    throw Error('panic!');
  }

  // up to 1...16
  toAttributeAssign(type?: TypeName, stride?: number, offset?: number): Node {
    throw Error('panic!');
  }

  // shader nodes
  checkerAssign(): Node {
    throw Error('panic!');
  }

  discardAssign(): Node {
    throw Error('panic!');
  }

  directionToColorAssign(): Node {
    throw Error('panic!');
  }

  colorToDirectionAssign(): Node {
    throw Error('panic!');
  }

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

  rotateAssign(angle: NodeVal<number>): Node {
    throw Error('panic!');
  }

  rotateUVAssign(angle: NodeVal<number>, center: NodeVal<number>): Node {
    throw Error('panic!');
  }

  storageElementAssign(index: NodeVal<number>): Node {
    throw Error('panic!');
  }

  // functions
  gaussianBlurAssign(sigma?: NodeVal<number>): Node {
    throw Error('panic!');
  }

  bumpMapAssign(scale: NodeVal<number>): Node {
    throw Error('panic!');
  }

  normalMapAssign(scale: NodeVal<number>): Node {
    throw Error('panic!');
  }

  cubeTextureAssign(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  declare triplanarTextureAssign: (
    textureY: TextureNode,
    textureZ: TextureNode,
    scale: NodeVal<number>,
    position: NodeVal<Vec3>,
    normal: NodeVal<Vec3>,
  ) => Node;

  bicubicAssign(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  textureAssign(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  textureSizeAssign(levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  hashAssign(): Node {
    throw Error('panic!');
  }

  condAssign(then: Node, or: Node): Node {
    throw Error('panic!');
  }

  lightingContextAssign(lightingModel: LightModel, backdrop: Node, alpha: NodeVal<number>): Node {
    throw Error('panic!');
  }

  computeAssign(count: NodeVal<number>, size?: number[]): Node {
    throw Error('panic!');
  }

  viewportTextureAssign(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  viewportMipTextureAssign(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  viewportDepthTextureAssign(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  viewportSharedTextureAssign(uv: UVNode, levelNode: NodeVal<number>): Node {
    throw Error('panic!');
  }

  toneMappingAssign(mapping: ToneMapping, exposure: NodeVal<number>): Node {
    throw Error('panic!');
  }

  posterizeAssign(steps: NodeVal<number>): Node {
    throw Error('panic!');
  }

  linearTosRGBAssign(): Node {
    throw Error('panic!');
  }

  sRGBToLinearAssign(): Node {
    throw Error('panic!');
  }

  linearToColorSpaceAssign(space: ColorSpace): Node {
    throw Error('panic!');
  }

  colorSpaceToLinearAssign(space: ColorSpace): Node {
    throw Error('panic!');
  }

  saturationAssign(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  vibranceAssign(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  hueAssign(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  thresholdAssign(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  burnAssign(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  dodgeAssign(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  overlayAssign(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  screenAssign(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  anamorphicAssign(threshold: NodeVal<number>, scale: NodeVal<number>, samples: NodeVal<number>): Node {
    throw Error('panic!');
  }

  afterImageAssign(value: NodeVal<number>): Node {
    throw Error('panic!');
  }

  toVarAssign(name: string): Node {
    throw Error('panic!');
  }

  tempAssign(name: string): Node {
    throw Error('panic!');
  }

  labelAssign(name: string): Node {
    throw Error('panic!');
  }

  contextAssign(context: object): Node {
    throw Error('panic!');
  }

  cacheAssign(value: WeakMap<any, any>): Node {
    throw Error('panic!');
  }

  globalCacheAssign(): Node {
    throw Error('panic!');
  }

  bypassAssign(call: Node): Node {
    throw Error('panic!');
  }

  scriptableAssign(parameters: Record<string, any>): Node {
    throw Error('panic!');
  }

  scriptableValueAssign(): Node {
    throw Error('panic!');
  }

  callAssign(parameters: Record<string, any>): Node {
    throw Error('panic!');
  }

  elementAssign(index: NodeVal<number>): Node {
    throw Error('panic!');
  }
}

implSwizzle();
implIndexAccess();
