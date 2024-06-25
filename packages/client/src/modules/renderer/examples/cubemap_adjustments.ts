import * as Engine from '@modules/renderer/engine/engine.js';
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
} from '@modules/renderer/engine/nodes/Nodes.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import { RGBMLoader } from '@modules/renderer/engine/loaders/textures/RGBMLoader/RGBMLoader.js';

import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';
import { GLTFLoader } from '@modules/renderer/engine/loaders/objects/GLTFLoader/GLTFLoader.js';

import { GUI } from 'lil-gui';
import { CubeTextureLoader } from '@modules/renderer/engine/loaders/textures/CubeTextureLoader/CubeTextureLoader.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

init();

async function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const initialDistance = 2;

  camera = new Engine.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-1.8 * initialDistance, 0.6 * initialDistance, 2.7 * initialDistance);

  scene = new Engine.Scene();

  // cube textures

  const cube1Texture = await new RGBMLoader({ maxRange: 16 }).loadAsync([
    'resources/textures/cube/pisaRGBM16/px.png',
    'resources/textures/cube/pisaRGBM16/nx.png',
    'resources/textures/cube/pisaRGBM16/py.png',
    'resources/textures/cube/pisaRGBM16/ny.png',
    'resources/textures/cube/pisaRGBM16/pz.png',
    'resources/textures/cube/pisaRGBM16/nz.png',
  ]);

  cube1Texture.generateMipmaps = true;
  cube1Texture.minFilter = Engine.MinificationTextureFilter.LinearMipmapLinear;

  const cube2Texture = await new CubeTextureLoader().loadAsync([
    'resources/textures/cube/Park2/posx.jpg',
    'resources/textures/cube/Park2/negx.jpg',
    'resources/textures/cube/Park2/posy.jpg',
    'resources/textures/cube/Park2/negy.jpg',
    'resources/textures/cube/Park2/posz.jpg',
    'resources/textures/cube/Park2/negz.jpg',
  ]);

  cube2Texture.generateMipmaps = true;
  cube2Texture.minFilter = Engine.MinificationTextureFilter.LinearMipmapLinear;

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

  const rotateY1Matrix = new Engine.Matrix4();
  const rotateY2Matrix = new Engine.Matrix4();

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

  const loader = new GLTFLoader();
  loader.loadAsync('resources/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf').then(function (gltf) {
    scene.add(gltf.scene);
  });

  const sphereGeometry = new Engine.SphereGeometry(0.5, 64, 32);

  const sphereRightView = new Engine.Mesh(
    sphereGeometry,
    new Engine.MeshStandardMaterial({
      roughness: 0,
      metalness: 1,
    }),
  );
  sphereRightView.position.x += 2;

  const sphereLeftView = new Engine.Mesh(
    sphereGeometry,
    new Engine.MeshStandardMaterial({
      roughness: 1,
      metalness: 1,
    }),
  );
  sphereLeftView.position.x -= 2;

  scene.add(sphereLeftView);
  scene.add(sphereRightView);

  // renderer and controls

  renderer = new Renderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.parameters.toneMappingNode = toneMapping(Engine.ToneMapping.Linear, 1);
  renderer.setAnimationLoop(render);
  container.appendChild(renderer.parameters.canvas);

  const controls = new OrbitControls(camera, renderer.parameters.canvas);
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
