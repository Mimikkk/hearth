export enum NodeUpdateStage {
  None = 'none',
  Frame = 'frame',
  Render = 'render',
  Object = 'object',
}

export const vectorComponents = ['x', 'y', 'z', 'w'] as const;
