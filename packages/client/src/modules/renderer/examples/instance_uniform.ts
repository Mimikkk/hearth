import * as Engine from '@mimi/hearth';
import { cubeTexture, MeshStandardNodeMaterial, Node, NodeUpdateStage, uniform } from '@mimi/hearth';

import { Hearth } from '@mimi/hearth';

import { OrbitControls } from '@mimi/hearth';

import { TeapotGeometry } from '@mimi/hearth';

import { CubeTextureLoader } from '@mimi/hearth';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

export class InstanceUniformNode extends Node {
  constructor() {
    super('vec3');

    this.stage = NodeUpdateStage.Object;

    this.uniformNode = uniform(new Engine.Color());
  }

  update(frame) {
    const mesh = frame.object;

    const meshColor = mesh.color;

    this.uniformNode.value.from(meshColor);
  }

  setup() {
    return this.uniformNode;
  }
}

let camera, scene, hearth;
let controls;

const objects = [];

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
  camera.position.set(0, 200, 1200);

  scene = new Engine.Scene();

  const helper = new Engine.GridVisualizer(1000, 40, 0x303030, 0x303030);
  helper.position.y = -75;
  scene.add(helper);

  const cTexture = await new CubeTextureLoader().loadAsync([
    'resources/textures/cube/SwedishRoyalCastle/px.jpg',
    'resources/textures/cube/SwedishRoyalCastle/nx.jpg',
    'resources/textures/cube/SwedishRoyalCastle/py.jpg',
    'resources/textures/cube/SwedishRoyalCastle/ny.jpg',
    'resources/textures/cube/SwedishRoyalCastle/pz.jpg',
    'resources/textures/cube/SwedishRoyalCastle/nz.jpg',
  ]);

  const instanceUniform = new InstanceUniformNode();
  const cubeTextureNode = cubeTexture(cTexture);

  const material = new MeshStandardNodeMaterial();
  material.colorNode = instanceUniform.add(cubeTextureNode);
  material.emissiveNode = instanceUniform.mul(cubeTextureNode);

  const geometry = new TeapotGeometry(50, 18);

  for (let i = 0, l = 12; i < l; i++) {
    addMesh(geometry, material);
  }

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  container.appendChild(hearth.parameters.canvas);

  controls = new OrbitControls(camera, hearth.parameters.canvas);
  controls.minDistance = 400;
  controls.maxDistance = 2000;

  useWindowResizer(hearth, camera);
}

function addMesh(geometry, material) {
  const mesh = new Engine.Mesh(geometry, material);

  mesh.color = new Engine.Color(Math.random() * 0xffffff);

  mesh.position.x = (objects.length % 4) * 200 - 300;
  mesh.position.z = Math.floor(objects.length / 4) * 200 - 200;

  mesh.setRotationX(Math.random() * 200 - 100);
  mesh.setRotationY(Math.random() * 200 - 100);
  mesh.setRotationZ(Math.random() * 200 - 100);

  objects.push(mesh);

  scene.add(mesh);
}

function animate() {
  for (let i = 0, l = objects.length; i < l; i++) {
    const object = objects[i];

    object.rotateX(0.01);
    object.rotateY(0.005);
  }

  hearth.render(scene, camera);
}
