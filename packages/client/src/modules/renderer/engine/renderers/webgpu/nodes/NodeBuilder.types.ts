export enum ShaderStage {
  Vertex = 'vertex',
  Fragment = 'fragment',
  Compute = 'compute',
}

export namespace ShaderStage {
  export const all: ShaderStage[] = [ShaderStage.Vertex, ShaderStage.Fragment, ShaderStage.Compute];
}

export enum BuildStage {
  Setup = 'setup',
  Analyze = 'analyze',
  Generate = 'generate',
}

export namespace BuildStage {
  export const all: BuildStage[] = [BuildStage.Setup, BuildStage.Analyze, BuildStage.Generate];
}

export enum BuiltinType {
  Attribute = 'attribute',
  Output = 'output',
  Vertex = 'vertex',
  Compute = 'compute',
  Fragment = 'fragment',
}
