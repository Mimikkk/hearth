import { bitangentView } from './BitangentNode.js';
import { normalView } from './NormalNode.js';
import { tangentView } from './TangentNode.js';
import { mat3 } from '../shadernode/ShaderNodes.js';
import { positionViewDirection } from './PositionNode.js';
import { UVNode } from '@modules/renderer/engine/nodes/accessors/UVNode.js';
import { ConstNode } from '@modules/renderer/engine/nodes/core/ConstNode.js';
import { Node } from '@modules/renderer/engine/nodes/core/Node.js';

export const TBNViewMatrix = mat3(tangentView, bitangentView, normalView);
export const parallaxDirection = positionViewDirection.mul(TBNViewMatrix);
export const parallaxUV = (uv: UVNode, scale: ConstNode<number> | number): Node => uv.sub(parallaxDirection.mul(scale));
