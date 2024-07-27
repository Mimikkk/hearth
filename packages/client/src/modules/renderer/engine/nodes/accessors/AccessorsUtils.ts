import { bitangentView } from './BitangentNode.js';
import { normalView } from './NormalNode.js';
import { tangentView } from './TangentNode.js';
import { mat3 } from '../shadernode/ShaderNodes.js';
import { positionViewDirection } from './PositionNode.js';

export const TBNViewMatrix = mat3(tangentView, bitangentView, normalView);

export const parallaxDirection = positionViewDirection.mul(TBNViewMatrix);
export const parallaxUV = (uv: Node, scale: Node): Node => uv.sub(parallaxDirection.mul(scale));
