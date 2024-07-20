import {
  MagnificationTextureFilter,
  MinificationTextureFilter,
  TextureDataType,
  TextureFormat,
} from '@modules/renderer/engine/constants.js';
import { DataUtils } from '@modules/renderer/engine/extras/DataUtils.js';
import { DataTexture } from '@modules/renderer/engine/textures/DataTexture.js';
import { lerp } from '../../../math/MathUtils.js';
import { classLoader } from '@modules/renderer/engine/loaders/types.js';
import { FileLoader, ResponseType } from '@modules/renderer/engine/loaders/files/FileLoader/FileLoader.js';

export type SupportedType = TextureDataType.Float | TextureDataType.HalfFloat | TextureDataType.UnsignedByte;
export interface SupportedMap {
  [TextureDataType.UnsignedByte]: Uint8Array;
  [TextureDataType.HalfFloat]: Uint16Array;
  [TextureDataType.Float]: Float32Array;
}

const createDataTexture = (data: Uint8Array | Uint16Array | Float32Array, type: SupportedType): DataTexture => {
  //@ts-expect-error - improve texture handling
  const texture = new DataTexture(data, 180, 1, TextureFormat.Red, type);
  texture.minFilter = MinificationTextureFilter.Linear;
  texture.magFilter = MagnificationTextureFilter.Linear;
  texture.needsUpdate = true;

  return texture;
};
const readIes = <ST extends SupportedType>(iesLamp: IESLamp, type: SupportedType): SupportedMap[ST] => {
  const width = 360;
  const height = 180;
  const size = width * height;

  const data = new Array(size);

  function interpolateCandelaValues(phi: number, theta: number) {
    let phiIndex = 0;
    let thetaIndex = 0;
    let startTheta = 0;
    let endTheta = 0;
    let startPhi = 0;
    let endPhi = 0;

    for (let i = 0; i < iesLamp.numHorAngles - 1; ++i) {
      // numHorAngles = horAngles.length-1 because of extra padding, so this wont cause an out of bounds error

      if (theta < iesLamp.horAngles[i + 1] || i == iesLamp.numHorAngles - 2) {
        thetaIndex = i;
        startTheta = iesLamp.horAngles[i];
        endTheta = iesLamp.horAngles[i + 1];

        break;
      }
    }

    for (let i = 0; i < iesLamp.numVerAngles - 1; ++i) {
      if (phi < iesLamp.verAngles[i + 1] || i == iesLamp.numVerAngles - 2) {
        phiIndex = i;
        startPhi = iesLamp.verAngles[i];
        endPhi = iesLamp.verAngles[i + 1];

        break;
      }
    }

    const deltaTheta = endTheta - startTheta;
    const deltaPhi = endPhi - startPhi;

    if (deltaPhi === 0)
      // Outside range
      return 0;

    const t1 = deltaTheta === 0 ? 0 : (theta - startTheta) / deltaTheta;
    const t2 = (phi - startPhi) / deltaPhi;

    const nextThetaIndex = deltaTheta === 0 ? thetaIndex : thetaIndex + 1;

    const v1 = lerp(iesLamp.candelaValues[thetaIndex][phiIndex], iesLamp.candelaValues[nextThetaIndex][phiIndex], t1);
    const v2 = lerp(
      iesLamp.candelaValues[thetaIndex][phiIndex + 1],
      iesLamp.candelaValues[nextThetaIndex][phiIndex + 1],
      t1,
    );
    const v = lerp(v1, v2, t2);

    return v;
  }

  const startTheta = iesLamp.horAngles[0];
  const endTheta = iesLamp.horAngles[iesLamp.numHorAngles - 1];

  for (let i = 0; i < size; ++i) {
    let theta = i % width;
    const phi = Math.floor(i / width);

    if (endTheta - startTheta !== 0 && (theta < startTheta || theta >= endTheta)) {
      // Handle symmetry for hor angles

      theta %= endTheta * 2;

      if (theta > endTheta) theta = endTheta * 2 - theta;
    }

    data[phi + theta * height] = interpolateCandelaValues(phi, theta);
  }

  switch (type) {
    case TextureDataType.UnsignedByte:
      return Uint8Array.from(data.map(v => Math.min(v * 0xff, 0xff))) as SupportedMap[ST];
    case TextureDataType.HalfFloat:
      return Uint16Array.from(data.map(v => DataUtils.toHalfFloat(v))) as SupportedMap[ST];
    default:
      return Float32Array.from(data) as SupportedMap[ST];
  }
};

export const parseIES = (text: string, type: SupportedType): DataTexture =>
  createDataTexture(readIes(new IESLamp(text), type), type);

class IESLamp {
  verAngles: number[];
  horAngles: number[];
  candelaValues: number[][];
  tiltData: {
    lampToLumGeometry: number;
    numAngles: number;
    angles: number[];
    mulFactors: number[];
  };
  count: number;
  lumens: number;
  multiplier: number;
  numVerAngles: number;
  numHorAngles: number;
  gonioType: number;
  units: number;
  width: number;
  length: number;
  height: number;
  ballFactor: number;
  blpFactor: number;
  inputWatts: number;

  constructor(text: string) {
    const _self = this;

    const textArray = text.split('\n');

    let lineNumber = 0;
    let line;

    _self.verAngles = [];
    _self.horAngles = [];

    _self.candelaValues = [];

    _self.tiltData = {} as any;
    _self.tiltData.angles = [];
    _self.tiltData.mulFactors = [];

    function textToArray(text: string) {
      // remove leading or trailing spaces
      text = text.replace(/^\s+|\s+$/g, '');
      // replace commas with spaces
      text = text.replace(/,/g, ' ');
      // replace white space/tabs etc by single whitespace
      text = text.replace(/\s\s+/g, ' ');

      return text.split(' ');
    }

    function readArray(count: number, array: number[]) {
      while (true) {
        const line = textArray[lineNumber++];
        const lineData = textToArray(line);

        for (let i = 0; i < lineData.length; ++i) {
          array.push(Number(lineData[i]));
        }

        if (array.length === count) break;
      }
    }

    function readTilt() {
      let line = textArray[lineNumber++];
      let lineData = textToArray(line);

      _self.tiltData.lampToLumGeometry = Number(lineData[0]);

      line = textArray[lineNumber++];
      lineData = textToArray(line);

      _self.tiltData.numAngles = Number(lineData[0]);

      readArray(_self.tiltData.numAngles, _self.tiltData.angles);
      readArray(_self.tiltData.numAngles, _self.tiltData.mulFactors);
    }

    function readLampValues() {
      const values: number[] = [];
      readArray(10, values);

      _self.count = +values[0];
      _self.lumens = +values[1];
      _self.multiplier = +values[2];
      _self.numVerAngles = +values[3];
      _self.numHorAngles = +values[4];
      _self.gonioType = +values[5];
      _self.units = +values[6];
      _self.width = +values[7];
      _self.length = +values[8];
      _self.height = +values[9];
    }

    function readLampFactors() {
      const values: number[] = [];
      readArray(3, values);

      _self.ballFactor = +values[0];
      _self.blpFactor = +values[1];
      _self.inputWatts = +values[2];
    }

    while (true) {
      line = textArray[lineNumber++];

      if (line.includes('TILT')) {
        break;
      }
    }

    if (!line.includes('NONE') && line.includes('INCLUDE')) {
      readTilt();
    }

    readLampValues();

    readLampFactors();

    for (let i = 0; i < _self.numHorAngles; ++i) {
      _self.candelaValues.push([]);
    }

    readArray(_self.numVerAngles, _self.verAngles);
    readArray(_self.numHorAngles, _self.horAngles);

    for (let i = 0; i < _self.numHorAngles; ++i) {
      readArray(_self.numVerAngles, _self.candelaValues[i]);
    }

    for (let i = 0; i < _self.numHorAngles; ++i) {
      for (let j = 0; j < _self.numVerAngles; ++j) {
        _self.candelaValues[i][j] *= _self.candelaValues[i][j] * _self.multiplier * _self.ballFactor * _self.blpFactor;
      }
    }

    let maxVal = -1;
    for (let i = 0; i < _self.numHorAngles; ++i) {
      for (let j = 0; j < _self.numVerAngles; ++j) {
        const value = _self.candelaValues[i][j];
        maxVal = maxVal < value ? value : maxVal;
      }
    }

    const bNormalize = true;
    if (bNormalize && maxVal > 0) {
      for (let i = 0; i < _self.numHorAngles; ++i) {
        for (let j = 0; j < _self.numVerAngles; ++j) {
          _self.candelaValues[i][j] /= maxVal;
        }
      }
    }
  }
}
