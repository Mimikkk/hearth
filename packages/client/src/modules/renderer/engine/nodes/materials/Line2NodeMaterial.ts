import { NodeMaterial } from './NodeMaterial.js';
import { temp } from '../core/VarNode.js';
import { varying } from '../core/VaryingNode.js';
import { dashSize, gapSize, property, varyingProperty } from '../core/PropertyNode.js';
import { attribute } from '../core/AttributeNode.js';
import { cameraProjectionMatrix } from '../accessors/CameraNode.js';
import {
  materialColor,
  materialLineDashOffset,
  materialLineDashSize,
  materialLineGapSize,
  materialLineScale,
  materialLineWidth,
} from '../accessors/MaterialNode.js';
import { modelViewMatrix } from '../accessors/ModelNode.js';
import { positionGeometry } from '../accessors/PositionNode.js';
import { mix, smoothstep } from '@modules/renderer/engine/nodes/math/MathNode.js';
import { f32, hsl, NodeStack, vec2, vec3, vec4 } from '../shadernode/ShaderNodes.js';
import { uv } from '../accessors/UVNode.js';
import { viewport } from '../display/ViewportNode.js';

import { LineDashedMaterial } from '@modules/renderer/engine/engine.js';

const defaultValues = new LineDashedMaterial();

export class Line2NodeMaterial extends NodeMaterial {
  static type = 'Line2NodeMaterial';

  constructor(params = {}) {
    super();

    this.normals = false;
    this.lights = false;

    this.setDefaultValues(defaultValues);

    this.useAlphaToCoverage = true;
    this.useColor = params.vertexColors;
    this.useDash = params.dashed;
    this.useWorldUnits = false;

    this.dashOffset = 0;
    this.lineWidth = 1;

    this.lineColorNode = null;

    this.offsetNode = null;
    this.dashScaleNode = null;
    this.dashSizeNode = null;
    this.gapSizeNode = null;

    this.setupShaders();

    this.setValues(params);
  }

  setupShaders() {
    const useAlphaToCoverage = this.alphaToCoverage;
    const useColor = this.useColor;
    const useDash = this.dashed;
    const useWorldUnits = this.worldUnits;

    const trimSegment = hsl(({ start, end }) => {
      const a = cameraProjectionMatrix.element(2).element(2);
      const b = cameraProjectionMatrix.element(3).element(2);
      const nearEstimate = b.mul(-0.5).div(a);

      const alpha = nearEstimate.sub(start.z).div(end.z.sub(start.z));

      return vec4(mix(start.xyz, end.xyz, alpha), end.w);
    });

    this.vertexNode = hsl(() => {
      varyingProperty('vec2', 'vUv').assign(uv());

      const instanceStart = attribute('instanceStart');
      const instanceEnd = attribute('instanceEnd');

      const start = property('vec4', 'start');
      const end = property('vec4', 'end');

      start.assign(modelViewMatrix.mul(vec4(instanceStart, 1.0)));
      end.assign(modelViewMatrix.mul(vec4(instanceEnd, 1.0)));

      if (useWorldUnits) {
        varyingProperty('vec3', 'worldStart').assign(start.xyz);
        varyingProperty('vec3', 'worldEnd').assign(end.xyz);
      }

      const aspect = viewport.z.div(viewport.w);

      const perspective = cameraProjectionMatrix.element(2).element(3).equal(-1.0);

      NodeStack.if(perspective, () => {
        NodeStack.if(start.z.lessThan(0.0).and(end.z.greaterThan(0.0)), () => {
          end.assign(trimSegment({ start: start, end: end }));
        }).elseif(end.z.lessThan(0.0).and(start.z.greaterThanEqual(0.0)), () => {
          start.assign(trimSegment({ start: end, end: start }));
        });
      });

      const clipStart = cameraProjectionMatrix.mul(start);
      const clipEnd = cameraProjectionMatrix.mul(end);

      const ndcStart = clipStart.xyz.div(clipStart.w);
      const ndcEnd = clipEnd.xyz.div(clipEnd.w);

      const dir = ndcEnd.xy.sub(ndcStart.xy).temp();

      dir.x.assign(dir.x.mul(aspect));
      dir.assign(dir.normalize());

      const clip = temp(vec4());

      if (useWorldUnits) {
        const worldDir = end.xyz.sub(start.xyz).normalize();
        const tmpFwd = mix(start.xyz, end.xyz, 0.5).normalize();
        const worldUp = worldDir.cross(tmpFwd).normalize();
        const worldFwd = worldDir.cross(worldUp);

        const worldPos = varyingProperty('vec4', 'worldPos');

        worldPos.assign(positionGeometry.y.lessThan(0.5).cond(start, end));

        const hw = materialLineWidth.mul(0.5);
        worldPos.addAssign(vec4(positionGeometry.x.lessThan(0.0).cond(worldUp.mul(hw), worldUp.mul(hw).negate()), 0));

        if (!useDash) {
          worldPos.addAssign(
            vec4(positionGeometry.y.lessThan(0.5).cond(worldDir.mul(hw).negate(), worldDir.mul(hw)), 0),
          );

          worldPos.addAssign(vec4(worldFwd.mul(hw), 0));

          NodeStack.if(positionGeometry.y.greaterThan(1.0).or(positionGeometry.y.lessThan(0.0)), () => {
            worldPos.subAssign(vec4(worldFwd.mul(2.0).mul(hw), 0));
          });
        }

        clip.assign(cameraProjectionMatrix.mul(worldPos));

        const clipPose = temp(vec3());

        clipPose.assign(positionGeometry.y.lessThan(0.5).cond(ndcStart, ndcEnd));
        clip.z.assign(clipPose.z.mul(clip.w));
      } else {
        const offset = property('vec2', 'offset');

        offset.assign(vec2(dir.y, dir.x.negate()));

        dir.x.assign(dir.x.div(aspect));
        offset.x.assign(offset.x.div(aspect));

        offset.assign(positionGeometry.x.lessThan(0.0).cond(offset.negate(), offset));

        NodeStack.if(positionGeometry.y.lessThan(0.0), () => {
          offset.assign(offset.sub(dir));
        }).elseif(positionGeometry.y.greaterThan(1.0), () => {
          offset.assign(offset.add(dir));
        });

        offset.assign(offset.mul(materialLineWidth));

        offset.assign(offset.div(viewport.w));

        clip.assign(positionGeometry.y.lessThan(0.5).cond(clipStart, clipEnd));

        offset.assign(offset.mul(clip.w));

        clip.assign(clip.add(vec4(offset, 0, 0)));
      }

      return clip;
    })();

    const closestLineToLine = hsl(({ p1, p2, p3, p4 }) => {
      const p13 = p1.sub(p3);
      const p43 = p4.sub(p3);

      const p21 = p2.sub(p1);

      const d1343 = p13.dot(p43);
      const d4321 = p43.dot(p21);
      const d1321 = p13.dot(p21);
      const d4343 = p43.dot(p43);
      const d2121 = p21.dot(p21);

      const denom = d2121.mul(d4343).sub(d4321.mul(d4321));
      const numer = d1343.mul(d4321).sub(d1321.mul(d4343));

      const mua = numer.div(denom).clamp();
      const mub = d1343.add(d4321.mul(mua)).div(d4343).clamp();

      return vec2(mua, mub);
    });

    this.fragmentNode = hsl(() => {
      const vUv = varyingProperty('vec2', 'vUv');

      if (useDash) {
        const offsetNode = this.offsetNode ? f32(this.offsetNodeNode) : materialLineDashOffset;
        const dashScaleNode = this.dashScaleNode ? f32(this.dashScaleNode) : materialLineScale;
        const dashSizeNode = this.dashSizeNode ? f32(this.dashSizeNode) : materialLineDashSize;
        const gapSizeNode = this.dashSizeNode ? f32(this.dashGapNode) : materialLineGapSize;

        dashSize.assign(dashSizeNode);
        gapSize.assign(gapSizeNode);

        const instanceDistanceStart = attribute('instanceDistanceStart');
        const instanceDistanceEnd = attribute('instanceDistanceEnd');

        const lineDistance = positionGeometry.y
          .lessThan(0.5)
          .cond(dashScaleNode.mul(instanceDistanceStart), materialLineScale.mul(instanceDistanceEnd));

        const vLineDistance = varying(lineDistance.add(materialLineDashOffset));
        const vLineDistanceOffset = offsetNode ? vLineDistance.add(offsetNode) : vLineDistance;

        vUv.y.lessThan(-1.0).or(vUv.y.greaterThan(1.0)).discard();
        vLineDistanceOffset.mod(dashSize.add(gapSize)).greaterThan(dashSize).discard();
      }

      const alpha = property('f32', 'alpha');
      alpha.assign(1);

      if (useWorldUnits) {
        const worldStart = varyingProperty('vec3', 'worldStart');
        const worldEnd = varyingProperty('vec3', 'worldEnd');

        const rayEnd = varyingProperty('vec4', 'worldPos').xyz.normalize().mul(1e5);
        const lineDir = worldEnd.sub(worldStart);
        const params = closestLineToLine({ p1: worldStart, p2: worldEnd, p3: vec3(0.0, 0.0, 0.0), p4: rayEnd });

        const p1 = worldStart.add(lineDir.mul(params.x));
        const p2 = rayEnd.mul(params.y);
        const delta = p1.sub(p2);
        const len = delta.length();
        const norm = len.div(materialLineWidth);

        if (!useDash) {
          if (useAlphaToCoverage) {
            const dnorm = norm.fwidth();
            alpha.assign(smoothstep(dnorm.negate().add(0.5), dnorm.add(0.5), norm).oneMinus());
          } else {
            norm.greaterThan(0.5).discard();
          }
        }
      } else {
        if (useAlphaToCoverage) {
          const a = vUv.x;
          const b = vUv.y.greaterThan(0.0).cond(vUv.y.sub(1.0), vUv.y.add(1.0));

          const len2 = a.mul(a).add(b.mul(b));

          const dlen = property('f32', 'dlen');
          dlen.assign(len2.fwidth());

          NodeStack.if(vUv.y.abs().greaterThan(1.0), () => {
            alpha.assign(smoothstep(dlen.oneMinus(), dlen.add(1), len2).oneMinus());
          });
        } else {
          NodeStack.if(vUv.y.abs().greaterThan(1.0), () => {
            const a = vUv.x;
            const b = vUv.y.greaterThan(0.0).cond(vUv.y.sub(1.0), vUv.y.add(1.0));
            const len2 = a.mul(a).add(b.mul(b));

            len2.greaterThan(1.0).discard();
          });
        }
      }

      let lineColorNode;

      if (this.lineColorNode) {
        lineColorNode = this.lineColorNode;
      } else {
        if (useColor) {
          const instanceColorStart = attribute('instanceColorStart');
          const instanceColorEnd = attribute('instanceColorEnd');

          const instanceColor = positionGeometry.y.lessThan(0.5).cond(instanceColorStart, instanceColorEnd);

          lineColorNode = instanceColor.mul(materialColor);
        } else {
          lineColorNode = materialColor;
        }
      }

      return vec4(lineColorNode, alpha);
    })();

    this.needsUpdate = true;
  }

  get worldUnits() {
    return this.useWorldUnits;
  }

  set worldUnits(value) {
    if (this.useWorldUnits !== value) {
      this.useWorldUnits = value;
      this.setupShaders();
    }
  }

  get dashed() {
    return this.useDash;
  }

  set dashed(value) {
    if (this.useDash !== value) {
      this.useDash = value;
      this.setupShaders();
    }
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
