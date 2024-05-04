export const Revision = '001dev';

export enum Mouse {
  Left = 0,
  Middle = 1,
  Right = 2,
  Rotate = 0,
  Dolly = 1,
  Pan = 2,
}

export enum Touch {
  Rotate = 0,
  Pan = 1,
  DollyPan = 2,
  DollyRotate = 3,
}

export enum CullFace {
  None = 0,
  Back = 1,
  Front = 2,
  FrontBack = 3,
}

export enum ShadowMap {
  Basic = 0,
  PCF = 1,
  PCFSoft = 2,
  VSM = 3,
}

export enum Side {
  Front = 0,
  Back = 1,
  Double = 2,
}

export enum Blending {
  None = 0,
  Normal = 1,
  Additive = 2,
  Subtractive = 3,
  Multiply = 4,
  Custom = 5,
}

export enum BlendingEquation {
  Add = 100,
  Subtract = 101,
  ReverseSubtract = 102,
  Min = 103,
  Max = 104,
}

export enum BlendingFactor {
  Zero = 200,
  One = 201,
  SrcColor = 202,
  OneMinusSrcColor = 203,
  SrcAlpha = 204,
  OneMinusSrcAlpha = 205,
  DstAlpha = 206,
  OneMinusDstAlpha = 207,
  DstColor = 208,
  OneMinusDstColor = 209,
  SrcAlphaSaturate = 210,
  ConstantColor = 211,
  OneMinusConstantColor = 212,
  ConstantAlpha = 213,
  OneMinusConstantAlpha = 214,
}

export enum Depth {
  Never = 0,
  Always = 1,
  Less = 2,
  LessEqual = 3,
  Equal = 4,
  GreaterEqual = 5,
  Greater = 6,
  NotEqual = 7,
}

export enum Operation {
  Multiply = 0,
  Mix = 1,
  Add = 2,
}

export enum ToneMapping {
  None = 0,
  Linear = 1,
  Reinhard = 2,
  Cineon = 3,
  ACESFilmic = 4,
  Custom = 5,
  AgX = 6,
  Neutral = 7,
}

export enum BindMode {
  Attached = 'attached',
  Detached = 'detached',
}

export enum Mapping {
  UV = 300,
  CubeReflection = 301,
  CubeRefraction = 302,
  EquirectangularReflection = 303,
  EquirectangularRefraction = 304,
  CubeUVReflection = 306,
}

export enum CubeMapping {
  Reflection = Mapping.CubeReflection,
  Refraction = Mapping.CubeRefraction,
  UVReflection = Mapping.CubeUVReflection,
}

export enum Wrapping {
  Repeat = 1000,
  ClampToEdge = 1001,
  MirroredRepeat = 1002,
}

export enum Filter {
  Nearest = 1003,
  NearestMipmapNearest = 1004,
  NearestMipmapLinear = 1005,
  Linear = 1006,
  LinearMipmapNearest = 1007,
  LinearMipmapLinear = 1008,
}

export enum MagnificationTextureFilter {
  Nearest = Filter.Nearest,
  Linear = Filter.Linear,
}

export enum MinificationTextureFilter {
  Nearest = Filter.Nearest,
  NearestMipmapNearest = Filter.NearestMipmapNearest,
  NearestMipmapLinear = Filter.NearestMipmapLinear,
  Linear = Filter.Linear,
  LinearMipmapNearest = Filter.LinearMipmapNearest,
  LinearMipmapLinear = Filter.LinearMipmapLinear,
}

export enum TextureDataType {
  UnsignedByte = 1009,
  Byte = 1010,
  Short = 1011,
  UnsignedShort = 1012,
  Int = 1013,
  UnsignedInt = 1014,
  Float = 1015,
  HalfFloat = 1016,
  UnsignedShort4444 = 1017,
  UnsignedShort5551 = 1018,
  UnsignedInt248 = 1020,
}

export enum TextureFormat {
  Alpha = 1021,
  RGBA = 1023,
  Luminance = 1024,
  LuminanceAlpha = 1025,
  Depth = 1026,
  DepthStencil = 1027,
  Red = 1028,
  RedInteger = 1029,
  RG = 1030,
  RGInteger = 1031,
  RGBAInteger = 1033,
}

export enum DepthTextureFormat {
  Depth = TextureFormat.Depth,
  DepthStencil = TextureFormat.DepthStencil,
}

export enum CompressedPixelFormat {
  RGB_S3TC_DXT1 = 33776,
  RGBA_S3TC_DXT1 = 33777,
  RGBA_S3TC_DXT3 = 33778,
  RGBA_S3TC_DXT5 = 33779,
  RGB_PVRTC_4BPPV1 = 35840,
  RGB_PVRTC_2BPPV1 = 35841,
  RGBA_PVRTC_4BPPV1 = 35842,
  RGBA_PVRTC_2BPPV1 = 35843,
  RGB_ETC1 = 36196,
  RGB_ETC2 = 37492,
  RGBA_ETC2_EAC = 37496,
  RGBA_ASTC_4x4 = 37808,
  RGBA_ASTC_5x4 = 37809,
  RGBA_ASTC_5x5 = 37810,
  RGBA_ASTC_6x5 = 37811,
  RGBA_ASTC_6x6 = 37812,
  RGBA_ASTC_8x5 = 37813,
  RGBA_ASTC_8x6 = 37814,
  RGBA_ASTC_8x8 = 37815,
  RGBA_ASTC_10x5 = 37816,
  RGBA_ASTC_10x6 = 37817,
  RGBA_ASTC_10x8 = 37818,
  RGBA_ASTC_10x10 = 37819,
  RGBA_ASTC_12x10 = 37820,
  RGBA_ASTC_12x12 = 37821,
  RGBA_BPTC = 36492,
  RGB_BPTC_SIGNED = 36494,
  RGB_BPTC_UNSIGNED = 36495,
  RED_RGTC1 = 36283,
  SIGNED_RED_RGTC1 = 36284,
  RED_GREEN_RGTC2 = 36285,
  SIGNED_RED_GREEN_RGTC2 = 36286,
}

export enum AnimationActionLoopStyle {
  Once = 2200,
  Repeat = 2201,
  PingPong = 2202,
}

export enum InterpolationMode {
  Discrete = 2300,
  Linear = 2301,
  Smooth = 2302,
}

export enum InterpolationEndingMode {
  ZeroCurvature = 2400,
  ZeroSlope = 2401,
  WrapAround = 2402,
}

export enum AnimationBlendMode {
  Normal = 2500,
  Additive = 2501,
}

export enum DrawMode {
  Triangles = 0,
  TriangleStrip = 1,
  TriangleFan = 2,
}

export enum DepthPackingStrategy {
  Basic = 3200,
  RGBA = 3201,
}

export enum NormalMapType {
  TangentSpace = 0,
  ObjectSpace = 1,
}

export enum ColorSpace {
  No = '',
  SRGB = 'srgb',
  LinearSRGB = 'srgb-linear',
  DisplayP3 = 'display-p3',
  LinearDisplayP3 = 'display-p3-linear',
}

export enum TransferFunction {
  Linear = 'linear',
  SRGB = 'srgb',
}

export enum ColorPrimary {
  Rec709 = 'rec709',
  P3 = 'p3',
}

export enum StencilOperation {
  Zero = 0,
  Keep = 7680,
  Replace = 7681,
  Increment = 7682,
  Decrement = 7683,
  IncrementWrap = 34055,
  DecrementWrap = 34056,
  Invert = 5386,
}

export enum StencilFunction {
  Never = 512,
  Less = 513,
  Equal = 514,
  LessEqual = 515,
  Greater = 516,
  NotEqual = 517,
  GreaterEqual = 518,
  Always = 519,
}

export enum DepthComparison {
  Never = 512,
  Less = 513,
  Equal = 514,
  LessEqual = 515,
  Greater = 516,
  NotEqual = 517,
  GreaterEqual = 518,
  Always = 519,
}

export enum BufferUsage {
  StaticDraw = 35044,
  DynamicDraw = 35048,
  StreamDraw = 35040,
  StaticRead = 35045,
  DynamicRead = 35049,
  StreamRead = 35041,
  StaticCopy = 35046,
  DynamicCopy = 35050,
  StreamCopy = 35042,
}

export enum GLSLVersion {
  GLSL1 = '100',
  GLSL3 = '300 es',
}

export enum CoordinateSystem {
  WebGL = 2000,
  WebGPU = 2001,
}

export type PixelFormat =
  | 'ALPHA'
  | 'RGB'
  | 'RGBA'
  | 'LUMINANCE'
  | 'LUMINANCE_ALPHA'
  | 'RED_INTEGER'
  | 'R8'
  | 'R8_SNORM'
  | 'R8I'
  | 'R8UI'
  | 'R16I'
  | 'R16UI'
  | 'R16F'
  | 'R32I'
  | 'R32UI'
  | 'R32F'
  | 'RG8'
  | 'RG8_SNORM'
  | 'RG8I'
  | 'RG8UI'
  | 'RG16I'
  | 'RG16UI'
  | 'RG16F'
  | 'RG32I'
  | 'RG32UI'
  | 'RG32F'
  | 'RGB565'
  | 'RGB8'
  | 'RGB8_SNORM'
  | 'RGB8I'
  | 'RGB8UI'
  | 'RGB16I'
  | 'RGB16UI'
  | 'RGB16F'
  | 'RGB32I'
  | 'RGB32UI'
  | 'RGB32F'
  | 'RGB9_E5'
  | 'SRGB8'
  | 'R11F_G11F_B10F'
  | 'RGBA4'
  | 'RGBA8'
  | 'RGBA8_SNORM'
  | 'RGBA8I'
  | 'RGBA8UI'
  | 'RGBA16I'
  | 'RGBA16UI'
  | 'RGBA16F'
  | 'RGBA32I'
  | 'RGBA32UI'
  | 'RGBA32F'
  | 'RGB5_A1'
  | 'RGB10_A2'
  | 'RGB10_A2UI'
  | 'SRGB8_ALPHA8'
  | 'SRGB8'
  | 'DEPTH_COMPONENT16'
  | 'DEPTH_COMPONENT24'
  | 'DEPTH_COMPONENT32F'
  | 'DEPTH24_STENCIL8'
  | 'DEPTH32F_STENCIL8';
