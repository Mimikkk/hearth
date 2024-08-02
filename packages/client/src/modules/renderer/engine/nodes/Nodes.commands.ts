import { addNodeCommand } from '@modules/renderer/engine/nodes/shadernode/ShaderNodes.js';
import { densityFog } from '@modules/renderer/engine/nodes/fog/FogExp2Node.js';
import { rangeFog } from '@modules/renderer/engine/nodes/fog/FogRangeNode.js';
import { fog } from '@modules/renderer/engine/nodes/fog/FogNode.js';
import { toneMapping } from '@modules/renderer/engine/nodes/display/ToneMappingNode.js';
import { normalMap } from '@modules/renderer/engine/nodes/display/NormalMapNode.js';
import { viewportDepthTexture } from '@modules/renderer/engine/nodes/display/ViewportDepthTextureNode.js';
import { posterize } from '@modules/renderer/engine/nodes/display/PosterizeNode.js';

addNodeCommand('densityFog', densityFog);
addNodeCommand('rangeFog', rangeFog);
addNodeCommand('fog', fog);
addNodeCommand('toneMapping', (color, mapping, exposure) => toneMapping(mapping, exposure, color));
addNodeCommand('normalMap', normalMap);
addNodeCommand('viewportDepthTexture', viewportDepthTexture);
addNodeCommand('posterize', posterize);
