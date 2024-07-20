import { Curve } from '../extras/core/Curve.js';
import { DataTexture } from '../textures/DataTexture.js';
import { BufferUsage, MagnificationTextureFilter, TextureDataType, TextureFormat, Wrapping } from '../constants.js';
import { Vector3 } from '../math/Vector3.js';
import { Material } from '../materials/Material.js';
import { Mesh } from '../objects/Mesh.js';
import { InstancedMesh } from '../objects/InstancedMesh.js';
import { Matrix4 } from '../math/Matrix4.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import type { IUniform } from '../shaders/BokehShader2.js';
export interface SplineUniform {
  spineTexture: IUniform;
  pathOffset: IUniform;
  pathSegment: IUniform;
  spineOffset: IUniform;
  flow: IUniform;
}

const CHANNELS = 4;
const TEXTURE_WIDTH = 1024;
const TEXTURE_HEIGHT = 4;

export function initSplineTexture(numberOfCurves: number = 1): DataTexture {
  const dataArray = new Float32Array(TEXTURE_WIDTH * TEXTURE_HEIGHT * numberOfCurves * CHANNELS);
  const dataTexture = new DataTexture(
    dataArray,
    TEXTURE_WIDTH,
    TEXTURE_HEIGHT * numberOfCurves,
    TextureFormat.RGBA,
    TextureDataType.Float,
    undefined!,
    undefined!,
    undefined!,
    undefined!,
    undefined!,
    undefined!,
    undefined!,
  );

  dataTexture.wrapS = Wrapping.Repeat;
  //@ts-expect-error
  dataTexture.wrapY = Wrapping.Repeat;
  dataTexture.magFilter = MagnificationTextureFilter.Nearest;
  dataTexture.needsUpdate = true;

  return dataTexture;
}

export function updateSplineTexture(texture: DataTexture, splineCurve: Curve<Vector3>, offset: number = 0) {
  const numberOfPoints = Math.floor(TEXTURE_WIDTH * (TEXTURE_HEIGHT / 4));
  splineCurve.precision = numberOfPoints / 2;
  splineCurve.updateArcLengths();
  const points = splineCurve.getSpacedPoints(numberOfPoints);
  const frenetFrames = splineCurve.computeFrenetFrames(numberOfPoints, true);

  for (let i = 0; i < numberOfPoints; i++) {
    const rowOffset = Math.floor(i / TEXTURE_WIDTH);
    const rowIndex = i % TEXTURE_WIDTH;

    let pt = points[i];
    setTextureValue(texture, rowIndex, pt.x, pt.y, pt.z, 0 + rowOffset + TEXTURE_HEIGHT * offset);
    pt = frenetFrames.tangents[i];
    setTextureValue(texture, rowIndex, pt.x, pt.y, pt.z, 1 + rowOffset + TEXTURE_HEIGHT * offset);
    pt = frenetFrames.normals[i];
    setTextureValue(texture, rowIndex, pt.x, pt.y, pt.z, 2 + rowOffset + TEXTURE_HEIGHT * offset);
    pt = frenetFrames.binormals[i];
    setTextureValue(texture, rowIndex, pt.x, pt.y, pt.z, 3 + rowOffset + TEXTURE_HEIGHT * offset);
  }

  texture.needsUpdate = true;
}

function setTextureValue(texture: DataTexture, index: number, x: number, y: number, z: number, o: number) {
  const image = texture.image;
  const { data } = image;
  const i = CHANNELS * TEXTURE_WIDTH * o; // Row Offset
  data[index * CHANNELS + i + 0] = x;
  data[index * CHANNELS + i + 1] = y;
  data[index * CHANNELS + i + 2] = z;
  data[index * CHANNELS + i + 3] = 1;
}

export function getUniforms(splineTexture: DataTexture) {
  const uniforms = {
    spineTexture: { value: splineTexture },
    pathOffset: { type: 'f', value: 0 }, // time of path curve
    pathSegment: { type: 'f', value: 1 }, // fractional length of path
    spineOffset: { type: 'f', value: 161 },
    spineLength: { type: 'f', value: 400 },
    flow: { type: 'i', value: 1 },
  };
  return uniforms;
}

export function modifyShader(material: Material, uniforms: any, numberOfCurves: number = 1) {
  //@ts-expect-error
  if (material.__ok) return;
  //@ts-expect-error
  material.__ok = true;

  //@ts-expect-error
  material.onBeforeCompile = shader => {
    if (shader.__modified) return;
    shader.__modified = true;

    Object.assign(shader.uniforms, uniforms);

    const vertexShader = `
		uniform sampler2D spineTexture;
		uniform float pathOffset;
		uniform float pathSegment;
		uniform float spineOffset;
		uniform float spineLength;
		uniform int flow;

		float textureLayers = ${TEXTURE_HEIGHT * numberOfCurves}.;
		float textureStacks = ${TEXTURE_HEIGHT / 4}.;

		${shader.vertexShader}
		`
      // chunk import moved in front of modified shader below
      .replace('#include <beginnormal_vertex>', '')

      // vec3 transformedNormal declaration overriden below
      .replace('#include <defaultnormal_vertex>', '')

      // vec3 transformed declaration overriden below
      .replace('#include <begin_vertex>', '')

      // shader override
      .replace(
        /void\s*main\s*\(\)\s*\{/,
        `
void main() {
#include <beginnormal_vertex>

vec4 worldPos = modelMatrix * vec4(position, 1.);

bool bend = flow > 0;
float xWeight = bend ? 0. : 1.;

#ifdef USE_INSTANCING
float pathOffsetFromInstanceMatrix = instanceMatrix[3][2];
float spineLengthFromInstanceMatrix = instanceMatrix[3][0];
float spinePortion = bend ? (worldPos.x + spineOffset) / spineLengthFromInstanceMatrix : 0.;
float mt = (spinePortion * pathSegment + pathOffset + pathOffsetFromInstanceMatrix)*textureStacks;
#else
float spinePortion = bend ? (worldPos.x + spineOffset) / spineLength : 0.;
float mt = (spinePortion * pathSegment + pathOffset)*textureStacks;
#endif

mt = mod(mt, textureStacks);
float rowOffset = floor(mt);

#ifdef USE_INSTANCING
rowOffset += instanceMatrix[3][1] * ${TEXTURE_HEIGHT}.;
#endif

vec3 spinePos = texture2D(spineTexture, vec2(mt, (0. + rowOffset + 0.5) / textureLayers)).xyz;
vec3 a =        texture2D(spineTexture, vec2(mt, (1. + rowOffset + 0.5) / textureLayers)).xyz;
vec3 b =        texture2D(spineTexture, vec2(mt, (2. + rowOffset + 0.5) / textureLayers)).xyz;
vec3 c =        texture2D(spineTexture, vec2(mt, (3. + rowOffset + 0.5) / textureLayers)).xyz;
mat3 basis = mat3(a, b, c);

vec3 transformed = basis
	* vec3(worldPos.x * xWeight, worldPos.y * 1., worldPos.z * 1.)
	+ spinePos;

vec3 transformedNormal = normalMatrix * (basis * objectNormal);
			`,
      )
      .replace(
        '#include <project_vertex>',
        `vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
				gl_Position = projectionMatrix * mvPosition;`,
      );

    shader.vertexShader = vertexShader;
  };
}

export class Flow {
  curveArray: Curve<Vector3>[];
  curveLengthArray: number[];
  object3D: Mesh;
  splineTexure: DataTexture;
  uniforms: SplineUniform;

  constructor(mesh: Mesh, numberOfCurves: number = 1) {
    const obj3D = mesh.clone();
    const splineTexure = initSplineTexture(numberOfCurves);
    const uniforms = getUniforms(splineTexure);
    obj3D.traverse(function (child) {
      if (child instanceof Mesh || child instanceof InstancedMesh) {
        if (Array.isArray(child.material)) {
          const materials = [];

          for (const material of child.material) {
            const newMaterial = material.clone();
            modifyShader(newMaterial, uniforms, numberOfCurves);
            materials.push(newMaterial);
          }

          //@ts-expect-error
          child.material = materials;
        } else {
          child.material = child.material.clone();
          modifyShader(child.material, uniforms, numberOfCurves);
        }
      }
    });

    this.curveArray = new Array(numberOfCurves);
    this.curveLengthArray = new Array(numberOfCurves);

    this.object3D = obj3D as any;
    this.splineTexure = splineTexure;
    this.uniforms = uniforms;
  }

  updateCurve(index: number, curve: Curve<Vector3>) {
    if (index >= this.curveArray.length) throw Error('Index out of range for Flow');
    const curveLength = curve.getLength();
    //@ts-expect-error
    this.uniforms.spineLength.value = curveLength;
    this.curveLengthArray[index] = curveLength;
    this.curveArray[index] = curve;
    updateSplineTexture(this.splineTexure, curve, index);
  }

  moveAlongCurve(amount: number) {
    this.uniforms.pathOffset.value += amount;
  }
}

const matrix = new Matrix4();

export class InstancedFlow extends Flow {
  //@ts-expect-error
  object3D: InstancedMesh;
  offsets: number[];
  whichCurve: number[];

  constructor(count: number, curveCount: number, geometry: BufferGeometry, material: Material) {
    const mesh = new InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(BufferUsage.DynamicDraw);
    mesh.frustumCulled = false;
    super(mesh, curveCount);

    this.offsets = new Array(count).fill(0);
    this.whichCurve = new Array(count).fill(0);
  }
  writeChanges(index: number) {
    matrix.makeTranslation(this.curveLengthArray[this.whichCurve[index]], this.whichCurve[index], this.offsets[index]);
    this.object3D.setMatrixAt(index, matrix);
    this.object3D.instanceMatrix.needsUpdate = true;
  }
  moveIndividualAlongCurve(index: number, offset: number): void {
    this.offsets[index] += offset;
    this.writeChanges(index);
  }
  setCurve(index: number, curveNo: number): void {
    if (isNaN(curveNo)) throw Error('curve index being set is Not a Number (NaN)');
    this.whichCurve[index] = curveNo;
    this.writeChanges(index);
  }
}
