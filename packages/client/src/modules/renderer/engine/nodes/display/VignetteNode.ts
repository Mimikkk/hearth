import { viewportTopLeft } from '@modules/renderer/engine/nodes/display/ViewportNode.js';
import type { NodeVal } from '@modules/renderer/engine/nodes/core/ConstNode.js';

export const vignette = (strength: NodeVal<number> = 1.35) => viewportTopLeft.distance(0.5).mul(strength).clamp().oneMinus();
