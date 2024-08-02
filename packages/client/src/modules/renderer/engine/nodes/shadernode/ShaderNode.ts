import { Node } from '../core/Node.js';
import { asNode } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.asNode.js';
import { handlers } from '@modules/renderer/engine/nodes/shadernode/ShaderNode.handlers.js';
import { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';
import { TslLayout } from '@modules/renderer/engine/nodes/shadernode/tsl.js';

const map = new WeakMap();

export class ShaderCallNode extends Node {
  constructor(
    public shader: ShaderNode,
    public inputs: Record<string, Node> | null = null,
  ) {
    super();
  }

  getNodeType(builder: NodeBuilder): TypeName {
    const { outputNode } = builder.getNodeProperties(this);

    return outputNode ? outputNode.getNodeType(builder) : super.getNodeType(builder);
  }

  call(builder: NodeBuilder): Node {
    const { shader, inputs } = this;

    if (shader.layout) {
      let fn = map.get(shader);

      if (!fn) {
        fn = asNode(builder.buildFunctionNode(shader));

        map.set(shader, fn);
      }

      if (builder.currentFunctionNode) builder.currentFunctionNode.includes.push(fn);

      return asNode(fn.call(inputs));
    }

    const fn = shader.fn;
    const output = inputs !== null ? fn(inputs, builder.stack, builder) : fn(builder.stack, builder);

    return asNode(output);
  }

  setup(builder: NodeBuilder): Node {
    builder.addStack();

    builder.stack.outputNode = this.call(builder);

    return builder.removeStack();
  }

  generate(builder: NodeBuilder, output: TypeName): string {
    const { outputNode } = builder.getNodeProperties(this);

    if (outputNode) return super.generate(builder, output)!;
    return this.call(builder).build(builder, output);
  }
}

export class ShaderNode<Fn extends (...params: any) => any = any> extends Node {
  constructor(
    public fn: Fn,
    public layout?: TslLayout,
  ) {
    super();
  }

  get isArrayInput() {
    return /^\((\s+)?\[/.test(this.fn.toString());
  }

  setLayout(layout: TslLayout) {
    this.layout = layout;
    return this;
  }

  call(inputs?: Parameters<Fn>[0]): ShaderCallNode {
    for (const name in inputs) inputs[name] = asNode(inputs[name]);

    return asNode(new ShaderCallNode(this, inputs)) as ShaderCallNode;
  }

  setup() {
    return this.call();
  }
}

export const createShaderNode = <Fn extends (...params: any) => any = any>(
  fn: Fn,
  layout?: TslLayout,
): ShaderNode<Fn> => new Proxy(new ShaderNode<Fn>(fn, layout), handlers);
