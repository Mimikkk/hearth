import {
  BoxGeometry,
  BufferAttribute,
  CompressedArrayTexture,
  CubeTexture,
  Data3DTexture,
  DataArrayTexture,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Side,
  Texture,
  Vector3,
} from '../Three.js';
import { mergeGeometries } from '@modules/renderer/threejs/utils/BufferGeometryUtils.js';

export class TextureHelper extends Mesh {
  declare type: string | 'TextureHelper';
  texture: Texture;

  constructor(texture: Texture, width: number = 1, height: number = 1, depth: number = 1) {
    const material = new ShaderMaterial({
      side: Side.Double,
      transparent: true,

      uniforms: {
        map: { value: texture },
        alpha: { value: getAlpha(texture) },
      },

      vertexShader: [
        'attribute vec3 uvw;',

        'varying vec3 vUvw;',

        'void main() {',

        '	vUvw = uvw;',

        '	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

        '}',
      ].join('\n'),

      fragmentShader: [
        'precision highp float;',

        'precision highp sampler2DArray;',

        'precision highp sampler3D;',

        'uniform {samplerType} map;',

        'uniform float alpha;',

        'varying vec3 vUvw;',

        'vec4 textureHelper( in sampler2D map ) { return texture( map, vUvw.xy ); }',

        'vec4 textureHelper( in sampler2DArray map ) { return texture( map, vUvw ); }',

        'vec4 textureHelper( in sampler3D map ) { return texture( map, vUvw ); }',

        'vec4 textureHelper( in samplerCube map ) { return texture( map, vUvw ); }',

        'void main() {',

        '	gl_FragColor = linearToOutputTexel( vec4( textureHelper( map ).xyz, alpha ) );',

        '}',
      ]
        .join('\n')
        .replace('{samplerType}', getSamplerType(texture)),
    });
    material.type = 'TextureMaterialHelper';
    const geometry =
      texture instanceof CubeTexture
        ? createCubeGeometry(width, height, depth)
        : createSliceGeometry(texture, width, height, depth);

    super(geometry, material);

    this.texture = texture;
    this.type = 'TextureHelper';
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

TextureHelper.prototype.type = 'TextureHelper';

function getSamplerType(texture: Texture) {
  if (texture instanceof CubeTexture) {
    return 'samplerCube';
  } else if (texture instanceof DataArrayTexture || texture instanceof CompressedArrayTexture) {
    return 'sampler2DArray';
  } else if (texture instanceof Data3DTexture) {
    return 'sampler3D';
  } else {
    return 'sampler2D';
  }
}

function getImageCount(texture: Texture) {
  if (texture instanceof CubeTexture) {
    return 6;
  } else if (texture instanceof DataArrayTexture || texture instanceof CompressedArrayTexture) {
    return texture.image.depth;
  } else if (texture instanceof Data3DTexture) {
    return texture.image.depth;
  } else {
    return 1;
  }
}

function getAlpha(texture: Texture) {
  if (texture instanceof CubeTexture) {
    return 1;
  } else if (texture instanceof DataArrayTexture || texture instanceof CompressedArrayTexture) {
    return Math.max(1 / texture.image.depth, 0.25);
  } else if (texture instanceof Data3DTexture) {
    return Math.max(1 / texture.image.depth, 0.25);
  } else {
    return 1;
  }
}

function createCubeGeometry(width: number, height: number, depth: number) {
  const geometry = new BoxGeometry(width, height, depth);

  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const uvw = new BufferAttribute(new Float32Array(uv.count * 3), 3);

  const _direction = new Vector3();

  for (let j = 0, jl = uv.count; j < jl; ++j) {
    _direction.fromBufferAttribute(position, j).normalize();

    const u = _direction.x;
    const v = _direction.y;
    const w = _direction.z;

    uvw.setXYZ(j, u, v, w);
  }

  geometry.deleteAttribute('uv');
  geometry.setAttribute('uvw', uvw);

  return geometry;
}

function createSliceGeometry(texture: Texture, width: number, height: number, depth: number) {
  const sliceCount = getImageCount(texture);

  const geometries = [];

  for (let i = 0; i < sliceCount; ++i) {
    const geometry = new PlaneGeometry(width, height);

    if (sliceCount > 1) {
      geometry.translate(0, 0, depth * (i / (sliceCount - 1) - 0.5));
    }

    const uv = geometry.attributes.uv;
    const uvw = new BufferAttribute(new Float32Array(uv.count * 3), 3);

    for (let j = 0, jl = uv.count; j < jl; ++j) {
      const u = uv.getX(j);
      const v = texture.flipY ? uv.getY(j) : 1 - uv.getY(j);
      const w =
        sliceCount === 1
          ? 1
          : texture instanceof DataArrayTexture || texture instanceof CompressedArrayTexture
            ? i
            : i / (sliceCount - 1);

      uvw.setXYZ(j, u, v, w);
    }

    geometry.deleteAttribute('uv');
    geometry.setAttribute('uvw', uvw);

    geometries.push(geometry);
  }

  return mergeGeometries(geometries);
}
