import { ColorPrimary, ColorSpace, TransferFunction } from '../constants.js';
import { Mat3 } from './Mat3.js';
import type { Color } from './Color.js';

export namespace ColorManagement {
  export const enabled: boolean = true;
  export const space: ColorSpace = ColorSpace.LinearSRGB;

  export const convert = (color: Color, from: ColorSpace, to: ColorSpace): Color => {
    if (!ColorManagement.enabled || from === to || !from || !to) return color;
    const { intoReference } = ColorSpaceMap[from];
    const { fromReference } = ColorSpaceMap[to];

    return fromReference(intoReference(color));
  };

  export const fromSpace = (color: Color, from: ColorSpace): Color => convert(color, ColorManagement.space, from);

  export const intoSpace = (color: Color, into: ColorSpace): Color => convert(color, into, ColorManagement.space);
}

const LinearSRGBToLinearDisplayP3 = Mat3.fromColumnOrder(
  0.8224621,
  0.177538,
  0.0,
  0.0331941,
  0.9668058,
  0.0,
  0.0170827,
  0.0723974,
  0.9105199,
);

const LinearDisplayP3ToLinearSRGB = Mat3.fromColumnOrder(
  1.2249401,
  -0.2249404,
  0.0,
  -0.0420569,
  1.0420571,
  0.0,
  -0.0196376,
  -0.0786361,
  1.0982735,
);

const ColorSpaceMap: Record<
  ColorSpace,
  {
    transfer: TransferFunction;
    primaries: ColorPrimary;
    intoReference(color: Color): Color;
    fromReference(color: Color): Color;
  }
> = {
  [ColorSpace.LinearSRGB]: {
    transfer: TransferFunction.Linear,
    primaries: ColorPrimary.Rec709,
    intoReference: color => color,
    fromReference: color => color,
  },
  [ColorSpace.SRGB]: {
    transfer: TransferFunction.SRGB,
    primaries: ColorPrimary.Rec709,
    intoReference: color => color.asSRGBToLinear(),
    fromReference: color => color.asLinearToSRGB(),
  },
  [ColorSpace.LinearDisplayP3]: {
    transfer: TransferFunction.Linear,
    primaries: ColorPrimary.P3,
    intoReference: color => color.applyMat3(LinearDisplayP3ToLinearSRGB),
    fromReference: color => color.applyMat3(LinearSRGBToLinearDisplayP3),
  },
  [ColorSpace.DisplayP3]: {
    transfer: TransferFunction.SRGB,
    primaries: ColorPrimary.P3,
    intoReference: color => color.asSRGBToLinear().applyMat3(LinearDisplayP3ToLinearSRGB),
    fromReference: color => color.applyMat3(LinearSRGBToLinearDisplayP3).asLinearToSRGB(),
  },
};

export const SRGBToLinear = (c: number): number =>
  c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);

export const LinearToSRGB = (c: number): number => (c < 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 0.41666) - 0.055);
