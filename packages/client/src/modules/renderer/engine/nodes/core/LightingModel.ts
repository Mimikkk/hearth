import type { NodeBuilder } from '@modules/renderer/engine/nodes/builder/NodeBuilder.js';
import type { StackNode } from '@modules/renderer/engine/nodes/core/StackNode.js';
import type { Node } from '@modules/renderer/engine/nodes/core/Node.js';

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

export abstract class LightingModel {
  start(parameters: Parameters, stack: StackNode, builder: NodeBuilder): void {}

  finish(parameters: Parameters, stack: StackNode, builder: NodeBuilder): void {}

  direct(parameters: DirectLight, stack: StackNode, builder: NodeBuilder): void {}

  directRectArea(parameters: RectLight, stack: StackNode, builder: NodeBuilder): void {}

  indirect(parameters: Parameters, stack: StackNode, builder: NodeBuilder): void {}

  ambientOcclusion(parameters: Parameters, stack: StackNode, builder: NodeBuilder): void {}
}
