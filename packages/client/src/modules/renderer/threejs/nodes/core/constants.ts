export enum NodeUpdateType {
  NONE = 'none',
  FRAME = 'frame',
  RENDER = 'render',
  OBJECT = 'object',
}

export const buildStages = ['setup', 'analyze', 'generate'] as const;
export const shaderStages = ['fragment', 'vertex', 'compute'] as const;
export const vectorComponents = ['x', 'y', 'z', 'w'] as const;
