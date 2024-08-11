import { SpotLightNode } from './SpotLightNode.js';
import { texture } from '../accessors/TextureNode.js';
import { vec2 } from '../shadernode/ShaderNode.primitves.ts';
import { Node } from '../core/Node.js';
import { IESSpotLight } from '@modules/renderer/engine/entities/lights/IESSpotLight.js';

export class IESSpotLightNode extends SpotLightNode {
  getSpotAttenuation(angleCosine: Node): Node {
    const map = (this.light as IESSpotLight).iesMap;

    const angle = angleCosine.acos().mul(1.0 / Math.PI);
    return texture(map, vec2(angle, 0), 0).r;
  }
}
