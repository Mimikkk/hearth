import { ColorPrimary, ColorSpace, TransferFunction } from '../constants.js';
import { Mat3 } from './Mat3.js';
import type { Color } from './Color.js';

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

export type AvailableColorSpace = ColorSpace.LinearSRGB | ColorSpace.LinearDisplayP3;
export type DefinedColorSpace =
  | ColorSpace.LinearSRGB
  | ColorSpace.SRGB
  | ColorSpace.LinearDisplayP3
  | ColorSpace.DisplayP3;

const ColorSpaceMap: Record<
  DefinedColorSpace,
  {
    transfer: TransferFunction;
    primaries: ColorPrimary;
    toReference(color: Color): Color;
    fromReference(color: Color): Color;
  }
> = {
  [ColorSpace.LinearSRGB]: {
    transfer: TransferFunction.Linear,
    primaries: ColorPrimary.Rec709,
    toReference: color => color,
    fromReference: color => color,
  },
  [ColorSpace.SRGB]: {
    transfer: TransferFunction.SRGB,
    primaries: ColorPrimary.Rec709,
    toReference: color => color.convertSRGBToLinear(),
    fromReference: color => color.convertLinearToSRGB(),
  },
  [ColorSpace.LinearDisplayP3]: {
    transfer: TransferFunction.Linear,
    primaries: ColorPrimary.P3,
    toReference: color => color.applyMatrix3(LinearDisplayP3ToLinearSRGB),
    fromReference: color => color.applyMatrix3(LinearSRGBToLinearDisplayP3),
  },
  [ColorSpace.DisplayP3]: {
    transfer: TransferFunction.SRGB,
    primaries: ColorPrimary.P3,
    toReference: color => color.convertSRGBToLinear().applyMatrix3(LinearDisplayP3ToLinearSRGB),
    fromReference: color => color.applyMatrix3(LinearSRGBToLinearDisplayP3).convertLinearToSRGB(),
  },
};

export const SRGBToLinear = (c: number): number =>
  c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);

export const LinearToSRGB = (c: number): number => (c < 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 0.41666) - 0.055);

export namespace ColorManagement {
  export const enabled: boolean = true;
  export const workingColorSpace: AvailableColorSpace = ColorSpace.LinearSRGB;

  export const convert = (
    color: Color,
    sourceColorSpace: DefinedColorSpace,
    targetColorSpace: DefinedColorSpace,
  ): Color => {
    if (!ColorManagement.enabled || sourceColorSpace === targetColorSpace || !sourceColorSpace || !targetColorSpace)
      return color;

    const sourceToReference = ColorSpaceMap[sourceColorSpace].toReference;
    const targetFromReference = ColorSpaceMap[targetColorSpace].fromReference;

    return targetFromReference(sourceToReference(color));
  };

  export const fromWorkingColorSpace = (color: Color, targetColorSpace: DefinedColorSpace): Color =>
    convert(color, ColorManagement.workingColorSpace, targetColorSpace);

  export const toWorkingColorSpace = (color: Color, sourceColorSpace: DefinedColorSpace): Color =>
    convert(color, sourceColorSpace, ColorManagement.workingColorSpace);

  export const getPrimaries = (colorSpace: DefinedColorSpace): ColorPrimary => ColorSpaceMap[colorSpace].primaries;

  export const getTransfer = (colorSpace: DefinedColorSpace): TransferFunction => ColorSpaceMap[colorSpace].transfer;
}
