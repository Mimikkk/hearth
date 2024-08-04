import { TempNode } from '../core/TempNode.js';
import { EPSILON } from '../math/MathNode.js';
import { addNodeCommand, proxyNode, hsl, vec3 } from '../shadernode/ShaderNodes.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

export class BlendModeNode extends TempNode {
  mode: NodeVariant;

  constructor(
    public baseNode: Node,
    public blendNode: Node,
  ) {
    super();
  }

  setup() {
    const { baseNode, blendNode } = this;
    const params = { base: baseNode, blend: blendNode };

    switch (this.mode) {
      case NodeVariant.Burn:
        return calcBurn(params);
      case NodeVariant.Dodge:
        return calcDodge(params);
      case NodeVariant.Screen:
        return calcScreen(params);
      case NodeVariant.Overlay:
        return calcOverlay(params);
    }
  }
}



enum NodeVariant {
  Burn = 'burn',
  Dodge = 'dodge',
  Screen = 'screen',
  Overlay = 'overlay',
}

interface Params {
  base: Node;
  blend: Node;
}

export const burn = proxyNode(
  class extends BlendModeNode {
    mode = NodeVariant.Burn;
  },
);
export const dodge = proxyNode(
  class extends BlendModeNode {
    mode = NodeVariant.Dodge;
  },
);
export const overlay = proxyNode(
  class extends BlendModeNode {
    mode = NodeVariant.Overlay;
  },
);
export const screen = proxyNode(
  class extends BlendModeNode {
    mode = NodeVariant.Screen;
  },
);

export const calcBurn = hsl(
  ({ base, blend }: Params) => {
    const fn = (c: 'x' | 'y' | 'z') =>
      blend[c].lessThan(EPSILON).cond(blend[c], base[c].oneMinus().div(blend[c]).oneMinus().max(0));

    return vec3(fn('x'), fn('y'), fn('z'));
  },
  {
    name: 'burnColor',
    type: TypeName.vec3,
    inputs: [
      { name: 'base', type: TypeName.vec3 },
      { name: 'blend', type: TypeName.vec3 },
    ],
  },
);
export const calcDodge = hsl(
  ({ base, blend }: Params) => {
    const fn = (c: 'x' | 'y' | 'z') => blend[c].equal(1.0).cond(blend[c], base[c].div(blend[c].oneMinus()).max(0));

    return vec3(fn('x'), fn('y'), fn('z'));
  },
  {
    name: 'dodgeColor',
    type: TypeName.vec3,
    inputs: [
      { name: 'base', type: TypeName.vec3 },
      { name: 'blend', type: TypeName.vec3 },
    ],
  },
);
export const calcScreen = hsl(
  ({ base, blend }: Params) => {
    const fn = (c: 'x' | 'y' | 'z') => base[c].oneMinus().mul(blend[c].oneMinus()).oneMinus();

    return vec3(fn('x'), fn('y'), fn('z'));
  },
  {
    name: 'screenColor',
    type: TypeName.vec3,
    inputs: [
      { name: 'base', type: TypeName.vec3 },
      { name: 'blend', type: TypeName.vec3 },
    ],
  },
);
export const calcOverlay = hsl(
  ({ base, blend }: Params) => {
    const fn = (c: 'x' | 'y' | 'z') =>
      base[c].lessThan(0.5).cond(base[c].mul(blend[c], 2.0), base[c].oneMinus().mul(blend[c].oneMinus()).oneMinus());

    return vec3(fn('x'), fn('y'), fn('z'));
  },
  {
    name: 'overlayColor',
    type: TypeName.vec3,
    inputs: [
      { name: 'base', type: TypeName.vec3 },
      { name: 'blend', type: TypeName.vec3 },
    ],
  },
);

addNodeCommand('burn', burn);
addNodeCommand('dodge', dodge);
addNodeCommand('overlay', overlay);
addNodeCommand('screen', screen);
