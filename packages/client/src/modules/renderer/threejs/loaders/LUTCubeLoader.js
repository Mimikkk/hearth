// https://wwwimages2.adobe.com/content/dam/acom/en/products/speedgrade/cc/pdfs/cube-lut-specification-1.0.pdf

import {
  Data3DTexture,
  DataTexture,
  FileLoader,
  Filter,
  Loader,
  TextureDataType,
  Vector3,
  Wrapping,
} from '../../threejs/Three.js';

export class LUTCubeLoader extends Loader {
  constructor(manager) {
    super(manager);

    this.type = TextureDataType.UnsignedByte;
  }

  setType(type) {
    if (type !== TextureDataType.UnsignedByte && type !== TextureDataType.Float) {
      throw new Error('LUTCubeLoader: Unsupported type');
    }

    this.type = type;

    return this;
  }

  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType('text');
    loader.load(
      url,
      text => {
        try {
          onLoad(this.parse(text));
        } catch (e) {
          if (onError) {
            onError(e);
          } else {
            console.error(e);
          }

          this.manager.itemError(url);
        }
      },
      onProgress,
      onError,
    );
  }

  parse(input) {
    const regExpTitle = /TITLE +"([^"]*)"/;
    const regExpSize = /LUT_3D_SIZE +(\d+)/;
    const regExpDomainMin = /DOMAIN_MIN +([\d.]+) +([\d.]+) +([\d.]+)/;
    const regExpDomainMax = /DOMAIN_MAX +([\d.]+) +([\d.]+) +([\d.]+)/;
    const regExpDataPoints = /^([\d.e+-]+) +([\d.e+-]+) +([\d.e+-]+) *$/gm;

    let result = regExpTitle.exec(input);
    const title = result !== null ? result[1] : null;

    result = regExpSize.exec(input);

    if (result === null) {
      throw new Error('LUTCubeLoader: Missing LUT_3D_SIZE information');
    }

    const size = Number(result[1]);
    const length = size ** 3 * 4;
    const data = this.type === TextureDataType.UnsignedByte ? new Uint8Array(length) : new Float32Array(length);

    const domainMin = new Vector3(0, 0, 0);
    const domainMax = new Vector3(1, 1, 1);

    result = regExpDomainMin.exec(input);

    if (result !== null) {
      domainMin.set(Number(result[1]), Number(result[2]), Number(result[3]));
    }

    result = regExpDomainMax.exec(input);

    if (result !== null) {
      domainMax.set(Number(result[1]), Number(result[2]), Number(result[3]));
    }

    if (domainMin.x > domainMax.x || domainMin.y > domainMax.y || domainMin.z > domainMax.z) {
      throw new Error('LUTCubeLoader: Invalid input domain');
    }

    const scale = this.type === TextureDataType.UnsignedByte ? 255 : 1;
    let i = 0;

    while ((result = regExpDataPoints.exec(input)) !== null) {
      data[i++] = Number(result[1]) * scale;
      data[i++] = Number(result[2]) * scale;
      data[i++] = Number(result[3]) * scale;
      data[i++] = scale;
    }

    const texture = new DataTexture();
    texture.image.data = data;
    texture.image.width = size;
    texture.image.height = size * size;
    texture.type = this.type;
    texture.magFilter = Filter.Linear;
    texture.minFilter = Filter.Linear;
    texture.wrapS = Wrapping.ClampToEdge;
    texture.wrapT = Wrapping.ClampToEdge;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    const texture3D = new Data3DTexture();
    texture3D.image.data = data;
    texture3D.image.width = size;
    texture3D.image.height = size;
    texture3D.image.depth = size;
    texture3D.type = this.type;
    texture3D.magFilter = Filter.Linear;
    texture3D.minFilter = Filter.Linear;
    texture3D.wrapS = Wrapping.ClampToEdge;
    texture3D.wrapT = Wrapping.ClampToEdge;
    texture3D.wrapR = Wrapping.ClampToEdge;
    texture3D.generateMipmaps = false;
    texture3D.needsUpdate = true;

    return {
      title,
      size,
      domainMin,
      domainMax,
      texture,
      texture3D,
    };
  }
}
