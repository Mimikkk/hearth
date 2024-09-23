import type { Node } from '../../nodes/core/Node.js';

export interface ReflectedLight {
  directDiffuse: Node;
  directSpecular: Node;
  indirectDiffuse: Node;
  indirectSpecular: Node;
}

export interface DirectLight {
  lightDirection: Node;
  lightColor: Node;
  reflectedLight: ReflectedLight;
}

export interface RectLight {
  lightColor: Node;
  lightPosition: Node;
  halfWidth: Node;
  halfHeight: Node;
  reflectedLight: ReflectedLight;
  ltc_1: Node;
  ltc_2: Node;
}

export interface Parameters {
  radiance: Node;
  irradiance: Node;
  iblIrradiance: Node;
  ambientOcclusion: Node;
  reflectedLight: ReflectedLight;
  backdrop: Node;
  backdropAlpha: Node;
  outgoingLight: Node;
}

export abstract class LightModel {
  start(/*input, stack, builder*/) {}

  finish(/*input, stack, builder*/) {}

  direct(/*input, stack, builder*/) {}

  indirectDiffuse(/*input, stack, builder*/) {}

  indirectSpecular(/*input, stack, builder*/) {}

  ambientOcclusion(/*input, stack, builder*/) {}
}
