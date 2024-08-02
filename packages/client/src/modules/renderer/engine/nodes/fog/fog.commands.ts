import { addNodeCommand } from '@modules/renderer/engine/nodes/shadernode/ShaderNodes.js';
import { densityFog } from '@modules/renderer/engine/nodes/fog/FogExp2Node.js';
import { rangeFog } from '@modules/renderer/engine/nodes/fog/FogRangeNode.js';
import { fog } from '@modules/renderer/engine/nodes/fog/FogNode.js';

addNodeCommand('densityFog', densityFog);
addNodeCommand('rangeFog', rangeFog);
addNodeCommand('fog', fog);
