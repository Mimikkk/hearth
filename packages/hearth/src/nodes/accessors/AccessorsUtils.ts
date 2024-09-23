import { bitangentView } from './BitangentNode.js';
import { normalView } from './NormalNode.js';
import { tangentView } from './TangentNode.js';
import { mat3 } from '../shadernode/ShaderNode.primitves.js';
import { positionViewDirection } from './PositionNode.js';
import { UVNode } from '../../nodes/accessors/UVNode.js';
import { ConstNode } from '../../nodes/core/ConstNode.js';
import { Node } from '../../nodes/core/Node.js';

export const TBNViewMatrix = mat3(tangentView, bitangentView, normalView);
export const parallaxDirection = positionViewDirection.mul(TBNViewMatrix);
export const parallaxUV = (uv: UVNode, scale: ConstNode<number> | number): Node => uv.sub(parallaxDirection.mul(scale));
