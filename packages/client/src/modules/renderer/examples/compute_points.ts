import * as Engine from '@modules/renderer/engine/engine.js';
import {
  tslFn,
  uniform,
  storage,
  attribute,
  f32,
  vec2,
  vec3,
  color,
  instanceIndex,
  PointsNodeMaterial,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { GUI } from 'lil-gui';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';
import StorageInstancedBufferAttribute from '@modules/renderer/engine/renderers/common/StorageInstancedBufferAttribute.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;
let computeNode;

const pointerVector = new Engine.Vec2(-10.0, -10.0); // Out of bounds first
const scaleVector = new Engine.Vec2(1, 1);

init();

async function init() {
  camera = new Engine.OrthographicCamera(-1.0, 1.0, 1.0, -1.0, 0, 1);
  camera.position.z = 1;

  scene = new Engine.Scene();

  // initialize particles

  const particleNum = 300000;
  const particleSize = 2; // vec2

  // create buffers

  const particleBuffer = new StorageInstancedBufferAttribute(particleNum, particleSize);
  const velocityBuffer = new StorageInstancedBufferAttribute(particleNum, particleSize);

  const particleBufferNode = storage(particleBuffer, 'vec2', particleNum);
  const velocityBufferNode = storage(velocityBuffer, 'vec2', particleNum);

  // create function

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

  // compute

  computeNode = computeShaderFn().compute(particleNum);
  computeNode.onInit = ({ renderer }) => {
    const precomputeShaderNode = tslFn(() => {
      const particleIndex = f32(instanceIndex);

      const randomAngle = particleIndex.mul(0.005).mul(Math.PI * 2);
      const randomSpeed = particleIndex.mul(0.00000001).add(0.0000001);

      const velX = randomAngle.sin().mul(randomSpeed);
      const velY = randomAngle.cos().mul(randomSpeed);

      const velocity = velocityBufferNode.element(instanceIndex);

      velocity.xy = vec2(velX, velY);
    });

    renderer.compute(precomputeShaderNode().compute(particleNum));
  };

  // use a compute shader to animate the point cloud's vertex data.

  const particleNode = attribute('particle', 'vec2');

  const pointsGeometry = new Engine.BufferGeometry();
  pointsGeometry.setAttribute('position', new Engine.BufferAttribute(new Float32Array(3), 3)); // single vertex ( not triangle )
  pointsGeometry.setAttribute('particle', particleBuffer); // dummy the position points as instances
  pointsGeometry.drawRange.count = 1; // force render points as instances ( not triangle )

  const pointsMaterial = new PointsNodeMaterial();
  pointsMaterial.colorNode = particleNode.add(color(0xffffff));
  pointsMaterial.positionNode = particleNode;

  const mesh = new Engine.Points(pointsGeometry, pointsMaterial);
  mesh.isInstancedMesh = true;
  mesh.count = particleNum;
  scene.add(mesh);

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer._animation.loop = animate;
  document.body.appendChild(renderer.parameters.canvas);

  useWindowResizer(renderer, camera);
  window.addEventListener('mousemove', onMouseMove);

  // gui

  const gui = new GUI();

  gui.add(scaleVector, 'x', 0, 1, 0.01);
  gui.add(scaleVector, 'y', 0, 1, 0.01);
}

function onMouseMove(event) {
  const x = event.clientX;
  const y = event.clientY;

  const width = window.innerWidth;
  const height = window.innerHeight;

  pointerVector.set((x / width - 0.5) * 2.0, (-y / height + 0.5) * 2.0);
}

function animate() {
  renderer.compute(computeNode);
  renderer.render(scene, camera);
}
