import { NodeMaterial } from './NodeMaterial.js';
import { varying } from '../core/VaryingNode.js';
import { property } from '../core/PropertyNode.js';
import { attribute } from '../core/AttributeNode.js';
import { cameraProjectionMatrix } from '../accessors/CameraNode.js';
import { materialColor, materialPointWidth } from '../accessors/MaterialNode.js'; 
import { modelViewMatrix } from '../accessors/ModelNode.js';
import { positionGeometry } from '../accessors/PositionNode.js';
import { smoothstep } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { tslFn, vec2, vec4 } from '../shadernode/ShaderNodes.js';
import { uv } from '../accessors/UVNode.js';
import { viewport } from '../display/ViewportNode.js';

import { PointsMaterial } from '@modules/renderer/engine/engine.js';

const defaultValues = new PointsMaterial();

export class InstancedPointsNodeMaterial extends NodeMaterial {
  static type = 'InstancedPointsNodeMaterial';

  constructor(params = {}) {
    super();

    this.normals = false;

    this.lights = false;

    this.useAlphaToCoverage = true;

    this.useColor = params.vertexColors;

    this.pointWidth = 1;

    this.pointColorNode = null;

    this.setDefaultValues(defaultValues);

    this.setupShaders();

    this.setValues(params);
  }

  setupShaders() {
    const useAlphaToCoverage = this.alphaToCoverage;
    const useColor = this.useColor;

    this.vertexNode = tslFn(() => {
      //vUv = uv;
      varying(vec2(), 'vUv').assign(uv()); 

      const instancePosition = attribute('instancePosition');

      
      const mvPos = property('vec4', 'mvPos');
      mvPos.assign(modelViewMatrix.mul(vec4(instancePosition, 1.0)));

      const aspect = viewport.z.div(viewport.w);

      
      const clipPos = cameraProjectionMatrix.mul(mvPos);

      
      const offset = property('vec2', 'offset');
      offset.assign(positionGeometry.xy);
      offset.assign(offset.mul(materialPointWidth));
      offset.assign(offset.div(viewport.z));
      offset.y.assign(offset.y.mul(aspect));

      
      offset.assign(offset.mul(clipPos.w));

      //clipPos.xy += offset;
      clipPos.assign(clipPos.add(vec4(offset, 0, 0)));

      return clipPos;

      //vec4 mvPosition = mvPos; 
    })();

    this.fragmentNode = tslFn(() => {
      const vUv = varying(vec2(), 'vUv');

      
      const alpha = property('f32', 'alpha');
      alpha.assign(1);

      const a = vUv.x;
      const b = vUv.y;

      const len2 = a.mul(a).add(b.mul(b));

      if (useAlphaToCoverage) {
        
        const dlen = property('f32', 'dlen');
        dlen.assign(len2.fwidth());

        alpha.assign(smoothstep(dlen.oneMinus(), dlen.add(1), len2).oneMinus());
      } else {
        len2.greaterThan(1.0).discard();
      }

      let pointColorNode;

      if (this.pointColorNode) {
        pointColorNode = this.pointColorNode;
      } else {
        if (useColor) {
          const instanceColor = attribute('instanceColor');

          pointColorNode = instanceColor.mul(materialColor);
        } else {
          pointColorNode = materialColor;
        }
      }

      return vec4(pointColorNode, alpha);
    })();

    this.needsUpdate = true;
  }

  get alphaToCoverage() {
    return this.useAlphaToCoverage;
  }

  set alphaToCoverage(value) {
    if (this.useAlphaToCoverage !== value) {
      this.useAlphaToCoverage = value;
      this.setupShaders();
    }
  }
}
