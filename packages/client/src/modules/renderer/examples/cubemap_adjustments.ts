import * as THREE from '../threejs/Three.js';
import {
  mix,
  normalWorld,
  pmremTexture,
  positionLocal,
  positionWorld,
  positionWorldDirection,
  reference,
  reflectVector,
  toneMapping,
  uniform,
} from '../threejs/nodes/Nodes.js';

import { WebGPURenderer } from '../threejs/renderers/webgpu/WebGPURenderer.js';

import { RGBMLoader } from '../threejs/loaders/RGBMLoader.js';

import { OrbitControls } from '@modules/renderer/threejs/controls/OrbitControls.js';
import { GLTFLoader } from '../threejs/loaders/GLTFLoader.js';

import { GUI } from 'lil-gui';
import { CubeTextureLoader } from '@modules/renderer/threejs/loaders/CubeTextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const initialDistance = 2;

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8 * initialDistance, 0.6 * initialDistance, 2.7 * initialDistance);

  scene = new THREE.Scene();

  // cube textures

  const cube1Texture = await new RGBMLoader({ maxRange: 16 }).loadAsync([
    'textures/cube/pisaRGBM16/px.png',
    'textures/cube/pisaRGBM16/nx.png',
    'textures/cube/pisaRGBM16/py.png',
    'textures/cube/pisaRGBM16/ny.png',
    'textures/cube/pisaRGBM16/pz.png',
    'textures/cube/pisaRGBM16/nz.png',
  ]);

  cube1Texture.generateMipmaps = true;
  cube1Texture.minFilter = THREE.MinificationTextureFilter.LinearMipmapLinear;

  const cube2Texture = await new CubeTextureLoader().loadAsync([
    'textures/cube/Park2/posx.jpg',
    'textures/cube/Park2/negx.jpg',
    'textures/cube/Park2/posy.jpg',
    'textures/cube/Park2/negy.jpg',
    'textures/cube/Park2/posz.jpg',
    'textures/cube/Park2/negz.jpg',
  ]);

  cube2Texture.generateMipmaps = true;
  cube2Texture.minFilter = THREE.MinificationTextureFilter.LinearMipmapLinear;

  // nodes and environment

  const adjustments = {
    mix: 0,
    procedural: 0,
    intensity: 1,
    hue: 0,
    saturation: 1,
  };

  const mixNode = reference('mix', 'float', adjustments);
  const proceduralNode = reference('procedural', 'float', adjustments);
  const intensityNode = reference('intensity', 'float', adjustments);
  const hueNode = reference('hue', 'float', adjustments);
  const saturationNode = reference('saturation', 'float', adjustments);

  const rotateY1Matrix = new THREE.Matrix4();
  const rotateY2Matrix = new THREE.Matrix4();

  const getEnvironmentNode = (reflectNode, positionNode) => {
    const custom1UV = reflectNode.xyz.mul(uniform(rotateY1Matrix));
    const custom2UV = reflectNode.xyz.mul(uniform(rotateY2Matrix));
    const mixCubeMaps = mix(
      pmremTexture(cube1Texture, custom1UV),
      pmremTexture(cube2Texture, custom2UV),
      positionNode.y.add(mixNode).clamp(),
    );

    const proceduralEnv = mix(mixCubeMaps, normalWorld, proceduralNode);

    const intensityFilter = proceduralEnv.mul(intensityNode);
    const hueFilter = intensityFilter.hue(hueNode);
    return hueFilter.saturation(saturationNode);
  };

  const blurNode = uniform(0);

  scene.environmentNode = getEnvironmentNode(reflectVector, positionWorld);

  scene.backgroundNode = getEnvironmentNode(positionWorldDirection, positionLocal).context({
    getTextureLevel: () => blurNode,
  });

  // scene objects

  const loader = new GLTFLoader({ path: 'models/gltf/DamagedHelmet/glTF/' });
  loader.loadAsync('DamagedHelmet.gltf', {
    onLoad: function (gltf) {
      scene.add(gltf.scene);
    },
  });

  const sphereGeometry = new THREE.SphereGeometry(0.5, 64, 32);

  const sphereRightView = new THREE.Mesh(
    sphereGeometry,
    new THREE.MeshStandardMaterial({
      roughness: 0,
      metalness: 1,
    }),
  );
  sphereRightView.position.x += 2;

  const sphereLeftView = new THREE.Mesh(
    sphereGeometry,
    new THREE.MeshStandardMaterial({
      roughness: 1,
      metalness: 1,
    }),
  );
  sphereLeftView.position.x -= 2;

  scene.add(sphereLeftView);
  scene.add(sphereRightView);

  // renderer and controls

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMappingNode = toneMapping(THREE.ToneMapping.Linear, 1);
  renderer.setAnimationLoop(render);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 2;
  controls.maxDistance = 10;

  useWindowResizer(renderer, camera);

  // gui

  const gui = new GUI();

  gui.add({ blurBackground: blurNode.value }, 'blurBackground', 0, 1, 0.01).onChange(value => {
    blurNode.value = value;
  });
  gui.add({ offsetCube1: 0 }, 'offsetCube1', 0, Math.PI * 2, 0.01).onChange(value => {
    rotateY1Matrix.makeRotationY(value);
  });
  gui.add({ offsetCube2: 0 }, 'offsetCube2', 0, Math.PI * 2, 0.01).onChange(value => {
    rotateY2Matrix.makeRotationY(value);
  });
  gui.add(adjustments, 'mix', -1, 2, 0.01);
  gui.add(adjustments, 'procedural', 0, 1, 0.01);
  gui.add(adjustments, 'intensity', 0, 5, 0.01);
  gui.add(adjustments, 'hue', 0, Math.PI * 2, 0.01);
  gui.add(adjustments, 'saturation', 0, 2, 0.01);
}

//

function render() {
  renderer.render(scene, camera);
}
