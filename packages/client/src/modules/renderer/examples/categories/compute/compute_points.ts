import {
  Attribute,
  Buffer,
  Geometry,
  OrthographicCamera,
  Points,
  Scene,
  Vec2,
} from '@modules/renderer/engine/engine.js';
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

const mouse = Vec2.new(-10.0, -10.0);
const scale = Vec2.new(1, 1);

const camera = new OrthographicCamera(-1.0, 1.0, 1.0, -1.0, 0, 1);
camera.position.z = 1;

const scene = new Scene();
const count = 300000;

const createStorageNode = () => {
  const buffer = Buffer.f32(count * 2, 2, BufferStep.Instance);
  const attribute = Attribute.use(buffer, 2, 0, GPUBufferBindingTypeType.Storage);

  return storage(attribute, TypeName.vec2, count);
};
const createStorageNodes = () => {
  const particle = createStorageNode();
  const velocity = createStorageNode();

  return { particle, velocity };
};

const { particle: particleBufferNode, velocity: velocityBufferNode } = createStorageNodes();

const computeShaderFn = tslFn(() => {
  const particle = particleBufferNode.element(instanceIndex);
  const velocity = velocityBufferNode.element(instanceIndex);

  const pointer = uniform(mouse);
  const limit = uniform(scale);

  const position = particle.add(velocity).temp();

  velocity.x = position.x.abs().greaterThanEqual(limit.x).cond(velocity.x.negate(), velocity.x);
  velocity.y = position.y.abs().greaterThanEqual(limit.y).cond(velocity.y.negate(), velocity.y);

  position.assign(position.min(limit).max(limit.negate()));

  const pointerSize = 0.1;
  const distanceFromPointer = pointer.sub(position).length();

  particle.assign(distanceFromPointer.lessThanEqual(pointerSize).cond(vec3(), position));
});

const computeNode = computeShaderFn().compute(count);
console.log(computeShaderFn());
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

  hearth.compute(precomputeShaderNode().compute(count));
};

const particle = attribute('particle', TypeName.vec2);

const geometry = new Geometry();

geometry.attributes.position = Attribute.use(Buffer.f32(3, 3));
geometry.attributes.particle = particleBufferNode.value;
geometry.drawRange.count = 1;

const material = new PointsNodeMaterial();
material.colorNode = particle.add(color(0xffffff));
material.positionNode = particle;

const mesh = new Points(geometry, material);
mesh.count = count;

scene.add(mesh);

const hearth = await Hearth.as({
  animate() {
    hearth.compute(computeNode);
    hearth.render(scene, camera);
  },
});

useWindowResizer(hearth, camera);
window.addEventListener('mousemove', event => {
  const x = event.clientX;
  const y = event.clientY;

  const width = window.innerWidth;
  const height = window.innerHeight;

  mouse.set((x / width - 0.5) * 2.0, (-y / height + 0.5) * 2.0);
});

const gui = new GUI();

gui.add(scale, 'x', 0, 1, 0.01);
gui.add(scale, 'y', 0, 1, 0.01);
