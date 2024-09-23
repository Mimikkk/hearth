import { viewportTopLeft } from '../../nodes/display/ViewportNode.js';
import type { NodeVal } from '../../nodes/core/ConstNode.js';

export const vignette = (strength: NodeVal<number> = 1.35) =>
  viewportTopLeft.distance(0.5).mul(strength).clamp().oneMinus();
