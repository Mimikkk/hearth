export enum NodeUpdateType {
  NONE = 'none',
  FRAME = 'frame',
  RENDER = 'render',
  OBJECT = 'object',
}

export const vectorComponents = ['x', 'y', 'z', 'w'] as const;

export type SwizzleCharacter = 'x' | 'y' | 'z' | 'w' | 'r' | 'g' | 'b' | 'a' | 's' | 't' | 'p' | 'q';

export type SwizzleOption = Exclude<
  | `${SwizzleCharacter}`
  | `${SwizzleCharacter}${SwizzleCharacter}`
  | `${SwizzleCharacter}${SwizzleCharacter}${SwizzleCharacter}`
  | `${SwizzleCharacter}${SwizzleCharacter}${SwizzleCharacter}${SwizzleCharacter}`,
  'abs' | 'sqrt'
>;
