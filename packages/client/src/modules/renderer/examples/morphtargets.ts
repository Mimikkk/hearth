import * as Engine from '@modules/renderer/engine/engine.js';

import { GUI } from 'lil-gui';
import { OrbitControls } from '@modules/renderer/engine/objects/controls/OrbitControls.js';

import { Forge } from '@modules/renderer/engine/renderers/Forge.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { Attribute } from '@modules/renderer/engine/engine.js';

let container, camera, scene, renderer, mesh;

init();

async function init() {
  container = document.getElementById('container');

  scene = new Engine.Scene();
  scene.background = new Engine.Color(0x8fbcd4);

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20);
  camera.position.z = 10;
  scene.add(camera);

  scene.add(new Engine.AmbientLight(0x8fbcd4, 1.5));

  const pointLight = new Engine.PointLight(0xffffff, 200);
  camera.add(pointLight);

  const geometry = createGeometry();

  const material = new Engine.MeshPhongMaterial({
    color: 0xff0000,
    flatShading: true,
  });

  mesh = new Engine.Mesh(geometry, material);
  scene.add(mesh);

  initGUI();

  renderer = await Forge.as();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = function () {
    renderer.render(scene, camera);
  };
  container.appendChild(renderer.parameters.canvas);

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.enableZoom = false;

  useWindowResizer(renderer, camera);
}

function createGeometry() {
  const geometry = new Engine.BoxGeometry(2, 2, 2, 32, 32, 32);

  // create an empty array to hold targets for the attribute we want to morph
  // morphing positions and normals is supported
  geometry.morphAttributes.position = [];

  // the original positions of the cube's vertices
  const positionAttribute = geometry.attributes.position;

  // for the first morph target we'll move the cube's vertices onto the surface of a sphere
  const spherePositions = [];

  // for the second morph target, we'll twist the cubes vertices
  const twistPositions = [];
  const direction = new Engine.Vec3(1, 0, 0);
  const vertex = new Engine.Vec3();

  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);

    spherePositions.push(
      x * Math.sqrt(1 - (y * y) / 2 - (z * z) / 2 + (y * y * z * z) / 3),
      y * Math.sqrt(1 - (z * z) / 2 - (x * x) / 2 + (z * z * x * x) / 3),
      z * Math.sqrt(1 - (x * x) / 2 - (y * y) / 2 + (x * x * y * y) / 3),
    );

    // stretch along the x-axis so we can see the twist better
    vertex.set(x * 2, y, z);

    vertex.applyAxisAngle(direction, (Math.PI * x) / 2).intoArray(twistPositions, twistPositions.length);
  }

  // add the spherical positions as the first morph target
  geometry.morphAttributes.position[0] = new Attribute(new Float32Array(spherePositions), 3);

  // add the twisted positions as the second morph target
  geometry.morphAttributes.position[1] = new Attribute(new Float32Array(twistPositions), 3);

  return geometry;
}

function initGUI() {
  // Set up dat.GUI to control targets
  const params = {
    Spherify: 0,
    Twist: 0,
  };
  const gui = new GUI({ title: 'Morph Targets' });

  gui
    .add(params, 'Spherify', 0, 1)
    .step(0.01)
    .onChange(function (value) {
      mesh.morphTargetInfluences[0] = value;
    });
  gui
    .add(params, 'Twist', 0, 1)
    .step(0.01)
    .onChange(function (value) {
      mesh.morphTargetInfluences[1] = value;
    });
}
