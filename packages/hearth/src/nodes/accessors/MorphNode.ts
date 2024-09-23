import { Node } from '../core/Node.js';
import { NodeUpdateStage } from '../core/constants.js';
import { asCommand, i32, ivec2 } from '../shadernode/ShaderNode.primitves.js';
import { uniform } from '../core/UniformNode.js';
import { ref } from './ReferenceNode.js';
import { positionLocal } from './PositionNode.js';
import { normalLocal } from './NormalNode.js';
import { textureLoad } from './TextureNode.js';
import { vertexIndex } from '../core/IndexNode.js';
import { loop } from '../utils/LoopNode.js';
import { Vec4 } from '../../math/Vec4.js';
import { DataArrayTexture } from '../../entities/textures/DataArrayTexture.js';
import { TextureDataType } from '../../constants.js';
import { Vec2 } from '../../math/Vec2.js';
import { hsl } from '../../nodes/shadernode/hsl.js';

const morphTextures = new WeakMap();
const morphVec4 = Vec4.new();

const getMorph = hsl(({ bufferMap, influence, stride, width, depth, offset }) => {
  const texelIndex = i32(vertexIndex).mul(stride).add(offset);

  const y = texelIndex.div(width);
  const x = texelIndex.sub(y.mul(width));

  const bufferAttrib = textureLoad(bufferMap, ivec2(x, y)).depth(depth);

  return bufferAttrib.mul(influence);
});

function getEntry(geometry) {
  const hasMorphPosition = geometry.morphAttributes.position !== undefined;
  const hasMorphNormals = geometry.morphAttributes.normal !== undefined;
  const hasMorphColors = geometry.morphAttributes.color !== undefined;

  const morphAttribute =
    geometry.morphAttributes.position || geometry.morphAttributes.normal || geometry.morphAttributes.color;
  const morphTargetsCount = morphAttribute !== undefined ? morphAttribute.length : 0;

  let entry = morphTextures.get(geometry);

  if (entry === undefined || entry.count !== morphTargetsCount) {
    const morphTargets = geometry.morphAttributes.position || [];
    const morphNormals = geometry.morphAttributes.normal || [];
    const morphColors = geometry.morphAttributes.color || [];

    let vertexDataCount = 0;

    if (hasMorphPosition === true) vertexDataCount = 1;
    if (hasMorphNormals === true) vertexDataCount = 2;
    if (hasMorphColors === true) vertexDataCount = 3;

    let width = geometry.attributes.position.count * vertexDataCount;
    let height = 1;

    const maxTextureSize = 4096;

    if (width > maxTextureSize) {
      height = Math.ceil(width / maxTextureSize);
      width = maxTextureSize;
    }

    const buffer = new Float32Array(width * height * 4 * morphTargetsCount);

    const bufferTexture = new DataArrayTexture({
      data: buffer,
      width,
      height,
      depth: morphTargetsCount,
      type: TextureDataType.Float,
      useUpdate: true,
    });

    const vertexDataStride = vertexDataCount * 4;

    for (let i = 0; i < morphTargetsCount; i++) {
      const morphTarget = morphTargets[i];
      const morphNormal = morphNormals[i];
      const morphColor = morphColors[i];

      const offset = width * height * 4 * i;

      for (let j = 0; j < morphTarget.count; j++) {
        const stride = j * vertexDataStride;

        if (hasMorphPosition === true) {
          morphVec4.fromAttribute(morphTarget, j);

          buffer[offset + stride + 0] = morphVec4.x;
          buffer[offset + stride + 1] = morphVec4.y;
          buffer[offset + stride + 2] = morphVec4.z;
          buffer[offset + stride + 3] = 0;
        }

        if (hasMorphNormals === true) {
          morphVec4.fromAttribute(morphNormal, j);

          buffer[offset + stride + 4] = morphVec4.x;
          buffer[offset + stride + 5] = morphVec4.y;
          buffer[offset + stride + 6] = morphVec4.z;
          buffer[offset + stride + 7] = 0;
        }

        if (hasMorphColors === true) {
          morphVec4.fromAttribute(morphColor, j);

          buffer[offset + stride + 8] = morphVec4.x;
          buffer[offset + stride + 9] = morphVec4.y;
          buffer[offset + stride + 10] = morphVec4.z;
          buffer[offset + stride + 11] = morphColor.stride === 4 ? morphVec4.w : 1;
        }
      }
    }

    entry = {
      count: morphTargetsCount,
      texture: bufferTexture,
      stride: vertexDataCount,
      size: Vec2.new(width, height),
    };

    morphTextures.set(geometry, entry);
  }

  return entry;
}

export class MorphNode extends Node {
  constructor(mesh) {
    super('void');

    this.mesh = mesh;
    this.morphBaseInfluence = uniform(1);

    this.stage = NodeUpdateStage.Object;
  }

  setup(builder) {
    const { geometry } = builder;

    const hasMorphPosition = geometry.morphAttributes.position !== undefined;
    const hasMorphNormals = geometry.morphAttributes.normal !== undefined;

    const morphAttribute =
      geometry.morphAttributes.position || geometry.morphAttributes.normal || geometry.morphAttributes.color;
    const morphTargetsCount = morphAttribute !== undefined ? morphAttribute.length : 0;

    const { texture: bufferMap, stride, size } = getEntry(geometry);

    if (hasMorphPosition === true) positionLocal.mulAssign(this.morphBaseInfluence);
    if (hasMorphNormals === true) normalLocal.mulAssign(this.morphBaseInfluence);

    const width = i32(size.width);

    loop(morphTargetsCount, ({ i }) => {
      const influence = ref('morphTargetInfluences', 'f32').element(i);

      if (hasMorphPosition === true) {
        positionLocal.addAssign(
          getMorph({
            bufferMap,
            influence,
            stride,
            width,
            depth: i,
            offset: i32(0),
          }),
        );
      }

      if (hasMorphNormals === true) {
        normalLocal.addAssign(
          getMorph({
            bufferMap,
            influence,
            stride,
            width,
            depth: i,
            offset: i32(1),
          }),
        );
      }
    });
  }

  update() {
    const morphBaseInfluence = this.morphBaseInfluence;

    if (this.mesh.geometry.morphTargetsRelative) {
      morphBaseInfluence.value = 1;
    } else {
      morphBaseInfluence.value = 1 - this.mesh.morphTargetInfluences.reduce((a, b) => a + b, 0);
    }
  }
}

export const morphRef = asCommand(MorphNode);
