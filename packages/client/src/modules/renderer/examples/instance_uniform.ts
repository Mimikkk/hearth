import * as Engine from '@modules/renderer/engine/engine.js';
import {
  MeshStandardNodeMaterial,
  NodeUpdateType,
  Node,
  nodeObject,
  uniform,
  cubeTexture,
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';

import { TeapotGeometry } from '@modules/renderer/engine/geometries/TeapotGeometry.js';

import Stats from 'stats-js';
import { CubeTextureLoader } from '@modules/renderer/engine/loaders/textures/CubeTextureLoader/CubeTextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

class InstanceUniformNode extends Node {
  constructor() {
    super('vec3');

    this.updateType = NodeUpdateType.OBJECT;

    this.uniformNode = uniform(new Engine.Color());
  }

  update(frame) {
    const mesh = frame.object;

    const meshColor = mesh.color;

    this.uniformNode.value.copy(meshColor);
  }

  setup(/*builder*/) {
    return this.uniformNode;
  }
}

let stats;

let camera, scene, renderer;
let controls;

const objects = [];

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
  camera.position.set(0, 200, 1200);

  scene = new Engine.Scene();

  // Grid

  const helper = new Engine.GridHelper(1000, 40, 0x303030, 0x303030);
  helper.position.y = -75;
  scene.add(helper);

  // CubeMap

  const cTexture = await new CubeTextureLoader().loadAsync([
    'resources/textures/cube/SwedishRoyalCastle/px.jpg',
    'resources/textures/cube/SwedishRoyalCastle/nx.jpg',
    'resources/textures/cube/SwedishRoyalCastle/py.jpg',
    'resources/textures/cube/SwedishRoyalCastle/ny.jpg',
    'resources/textures/cube/SwedishRoyalCastle/pz.jpg',
    'resources/textures/cube/SwedishRoyalCastle/nz.jpg',
  ]);

  // Materials

  const instanceUniform = nodeObject(new InstanceUniformNode());
  const cubeTextureNode = cubeTexture(cTexture);

  const material = new MeshStandardNodeMaterial();
  material.colorNode = instanceUniform.add(cubeTextureNode);
  material.emissiveNode = instanceUniform.mul(cubeTextureNode);

  // Geometry

  const geometry = new TeapotGeometry(50, 18);

  for (let i = 0, l = 12; i < l; i++) {
    addMesh(geometry, material);
  }

  //

  renderer = new Renderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  container.appendChild(renderer.domElement);

  //

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 400;
  controls.maxDistance = 2000;

  //

  stats = new Stats();
  container.appendChild(stats.dom);

  //

  useWindowResizer(renderer, camera);
}

function addMesh(geometry, material) {
  const mesh = new Engine.Mesh(geometry, material);

  mesh.color = new Engine.Color(Math.random() * 0xffffff);

  mesh.position.x = (objects.length % 4) * 200 - 300;
  mesh.position.z = Math.floor(objects.length / 4) * 200 - 200;

  mesh.rotation.x = Math.random() * 200 - 100;
  mesh.rotation.y = Math.random() * 200 - 100;
  mesh.rotation.z = Math.random() * 200 - 100;

  objects.push(mesh);

  scene.add(mesh);
}

function animate() {
  for (let i = 0, l = objects.length; i < l; i++) {
    const object = objects[i];

    object.rotation.x += 0.01;
    object.rotation.y += 0.005;
  }

  renderer.render(scene, camera);

  stats.update();
}
