import { Attribute, Geometry, OrthographicCamera, Points, Scene, Vec2 } from '@modules/renderer/engine/engine.js';
import {
  attribute,
  color,
  f32,
  instanceIndex,
  PointsNodeMaterial,
  storage,
  tslFn,
  uniform,
  vec2,
  vec3,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { GUI } from 'lil-gui';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { BufferStep, GPUBufferBindingTypeType } from '@modules/renderer/engine/hearth/constants.js';
import { TypeName } from '@modules/renderer/engine/nodes/builder/NodeBuilder.types.js';

let camera, scene, hearth;
let computeNode;

const pointerVector = new Vec2(-10.0, -10.0);
const scaleVector = new Vec2(1, 1);

camera = new OrthographicCamera(-1.0, 1.0, 1.0, -1.0, 0, 1);
camera.position.z = 1;

scene = new Scene();

const particleNum = 300000;
const particleSize = 2;

const particleBuffer = new Attribute(
  new Float32Array(particleNum * particleSize),
  particleSize,
  0,
  BufferStep.Instance,
  GPUBufferBindingTypeType.Storage,
);
const velocityBuffer = new Attribute(
  new Float32Array(particleNum * particleSize),
  particleSize,
  0,
  BufferStep.Instance,
  GPUBufferBindingTypeType.Storage,
);

const particleBufferNode = storage(particleBuffer, TypeName.vec2, particleNum);
const velocityBufferNode = storage(velocityBuffer, TypeName.vec2, particleNum);

const computeShaderFn = tslFn(() => {
  const particle = particleBufferNode.element(instanceIndex);
  const velocity = velocityBufferNode.element(instanceIndex);

  const pointer = uniform(pointerVector);
  const limit = uniform(scaleVector);

  const position = particle.add(velocity).temp();

  velocity.x = position.x.abs().greaterThanEqual(limit.x).cond(velocity.x.negate(), velocity.x);
  velocity.y = position.y.abs().greaterThanEqual(limit.y).cond(velocity.y.negate(), velocity.y);

  position.assign(position.min(limit).max(limit.negate()));

  const pointerSize = 0.1;
  const distanceFromPointer = pointer.sub(position).length();

  particle.assign(distanceFromPointer.lessThanEqual(pointerSize).cond(vec3(), position));
});

computeNode = computeShaderFn().compute(particleNum);
computeNode.onInit = ({ hearth }) => {
  const precomputeShaderNode = tslFn(() => {
    const particleIndex = f32(instanceIndex);

    const randomAngle = particleIndex.mul(0.005).mul(Math.PI * 2);
    const randomSpeed = particleIndex.mul(0.00000001).add(0.0000001);

    const velX = randomAngle.sin().mul(randomSpeed);
    const velY = randomAngle.cos().mul(randomSpeed);

    const velocity = velocityBufferNode.element(instanceIndex);

    velocity.xy = vec2(velX, velY);
  });

  hearth.compute(precomputeShaderNode().compute(particleNum));
};

const particleNode = attribute('particle', TypeName.vec2);

const pointsGeometry = new Geometry();
pointsGeometry.setAttribute('position', new Attribute(new Float32Array(3), 3));
pointsGeometry.setAttribute('particle', particleBuffer);
pointsGeometry.drawRange.count = 1;

const pointsMaterial = new PointsNodeMaterial();
pointsMaterial.colorNode = particleNode.add(color(0xffffff));
pointsMaterial.positionNode = particleNode;

const mesh = new Points(pointsGeometry, pointsMaterial);
mesh.isInstancedMesh = true;
mesh.count = particleNum;
scene.add(mesh);

hearth = await Hearth.as();
hearth.setPixelRatio(window.devicePixelRatio);
hearth.setSize(window.innerWidth, window.innerHeight);
hearth.animation.loop = function animate() {
  hearth.compute(computeNode);
  hearth.render(scene, camera);
};
document.body.appendChild(hearth.parameters.canvas);

useWindowResizer(hearth, camera);
window.addEventListener('mousemove', function onMouseMove(event) {
  const x = event.clientX;
  const y = event.clientY;

  const width = window.innerWidth;
  const height = window.innerHeight;

  pointerVector.set((x / width - 0.5) * 2.0, (-y / height + 0.5) * 2.0);
});

const gui = new GUI();

gui.add(scaleVector, 'x', 0, 1, 0.01);
gui.add(scaleVector, 'y', 0, 1, 0.01);
