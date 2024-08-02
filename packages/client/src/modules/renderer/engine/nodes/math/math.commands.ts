import { addNodeCommand } from '@modules/renderer/engine/nodes/shadernode/ShaderNodes.js';
import { cond } from '@modules/renderer/engine/nodes/math/CondNode.js';
import { hash } from '@modules/renderer/engine/nodes/math/HashNode.js';
import {
  abs,
  acos,
  all,
  any,
  asin,
  atan,
  atan2,
  cbrt,
  ceil,
  clamp,
  cos,
  cross,
  degrees,
  difference,
  distance,
  dot,
  dpdx,
  dpdy,
  equals,
  exp,
  exp2,
  faceForward,
  floor,
  fract,
  fwidth,
  inverseSqrt,
  length,
  lengthSq,
  log,
  log2,
  max,
  min,
  mixElement,
  mod,
  negate,
  normalize,
  oneMinus,
  pow,
  pow2,
  pow3,
  pow4,
  radians,
  reciprocal,
  reflect,
  refract,
  round,
  saturate,
  sign,
  sin,
  smoothstepElement,
  sqrt,
  step,
  tan,
  transformDirection,
  trunc,
} from '@modules/renderer/engine/nodes/math/MathNode.js';
import { gain, parabola, pcurve, sinc } from '@modules/renderer/engine/nodes/math/MathUtils.js';
import {
  add,
  and,
  bitAnd,
  bitNot,
  bitOr,
  bitXor,
  div,
  equal,
  greaterThan,
  greaterThanEqual,
  lessThan,
  lessThanEqual,
  mul,
  not,
  notEqual,
  or,
  remainder,
  shiftLeft,
  shiftRight,
  sub,
} from '@modules/renderer/engine/nodes/math/OperatorNode.js';

addNodeCommand('cond', cond);

addNodeCommand('hash', hash);

addNodeCommand('all', all);
addNodeCommand('any', any);
addNodeCommand('equals', equals);
addNodeCommand('radians', radians);
addNodeCommand('degrees', degrees);
addNodeCommand('exp', exp);
addNodeCommand('exp2', exp2);
addNodeCommand('log', log);
addNodeCommand('log2', log2);
addNodeCommand('sqrt', sqrt);
addNodeCommand('inverseSqrt', inverseSqrt);
addNodeCommand('floor', floor);
addNodeCommand('ceil', ceil);
addNodeCommand('normalize', normalize);
addNodeCommand('fract', fract);
addNodeCommand('sin', sin);
addNodeCommand('cos', cos);
addNodeCommand('tan', tan);
addNodeCommand('asin', asin);
addNodeCommand('acos', acos);
addNodeCommand('atan', atan);
addNodeCommand('abs', abs);
addNodeCommand('sign', sign);
addNodeCommand('length', length);
addNodeCommand('lengthSq', lengthSq);
addNodeCommand('negate', negate);
addNodeCommand('oneMinus', oneMinus);
addNodeCommand('dpdx', dpdx);
addNodeCommand('dpdy', dpdy);
addNodeCommand('round', round);
addNodeCommand('reciprocal', reciprocal);
addNodeCommand('trunc', trunc);
addNodeCommand('fwidth', fwidth);
addNodeCommand('atan2', atan2);
addNodeCommand('min', min);
addNodeCommand('max', max);
addNodeCommand('mod', mod);
addNodeCommand('step', step);
addNodeCommand('reflect', reflect);
addNodeCommand('distance', distance);
addNodeCommand('dot', dot);
addNodeCommand('cross', cross);
addNodeCommand('pow', pow);
addNodeCommand('pow2', pow2);
addNodeCommand('pow3', pow3);
addNodeCommand('pow4', pow4);
addNodeCommand('transformDirection', transformDirection);
addNodeCommand('mix', mixElement);
addNodeCommand('clamp', clamp);
addNodeCommand('refract', refract);
addNodeCommand('smoothstep', smoothstepElement);
addNodeCommand('faceForward', faceForward);
addNodeCommand('difference', difference);
addNodeCommand('saturate', saturate);
addNodeCommand('cbrt', cbrt);

addNodeCommand('parabola', parabola);
addNodeCommand('gain', gain);
addNodeCommand('pcurve', pcurve);
addNodeCommand('sinc', sinc);

addNodeCommand('add', add);
addNodeCommand('sub', sub);
addNodeCommand('mul', mul);
addNodeCommand('div', div);
addNodeCommand('remainder', remainder);
addNodeCommand('equal', equal);
addNodeCommand('notEqual', notEqual);
addNodeCommand('lessThan', lessThan);
addNodeCommand('greaterThan', greaterThan);
addNodeCommand('lessThanEqual', lessThanEqual);
addNodeCommand('greaterThanEqual', greaterThanEqual);
addNodeCommand('and', and);
addNodeCommand('or', or);
addNodeCommand('not', not);
addNodeCommand('bitAnd', bitAnd);
addNodeCommand('bitNot', bitNot);
addNodeCommand('bitOr', bitOr);
addNodeCommand('bitXor', bitXor);
addNodeCommand('shiftLeft', shiftLeft);
addNodeCommand('shiftRight', shiftRight);
