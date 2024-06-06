import * as THREE from '../threejs/Three.js';
import {
  checker,
  color,
  lights,
  MeshPhongNodeMaterial,
  mix,
  normalMap,
  rangeFog,
  texture,
  uv,
} from '../threejs/nodes/Nodes.js';

import Stats from 'stats-js';

import { OrbitControls } from '@modules/renderer/threejs/controls/OrbitControls.js';
import { TeapotGeometry } from '../threejs/geometries/TeapotGeometry.js';

import { WebGPURenderer } from '../threejs/renderers/webgpu/WebGPURenderer.js';
import { TextureLoader } from '@modules/renderer/threejs/loaders/TextureLoader.js';

let camera, scene, renderer, light1, light2, light3, light4, stats, controls;

init();

async function init() {
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
  camera.position.z = 7;

  scene = new THREE.Scene();
  scene.fogNode = rangeFog(color(0xff00ff), 12, 30);

  const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 8);

  // textures

  const textureLoader = new TextureLoader();

  const normalMapTexture = await textureLoader.loadAsync('./textures/water/Water_1_M_Normal.jpg');
  normalMapTexture.wrapS = THREE.Wrapping.Repeat;
  normalMapTexture.wrapT = THREE.Wrapping.Repeat;

  const alphaTexture = await textureLoader.loadAsync('./textures/roughness_map.jpg');
  alphaTexture.wrapS = THREE.Wrapping.Repeat;
  alphaTexture.wrapT = THREE.Wrapping.Repeat;

  // lights

  const addLight = (hexColor, power = 1700, distance = 100) => {
    const material = new MeshPhongNodeMaterial();
    material.colorNode = color(hexColor);
    material.lights = false;

    const mesh = new THREE.Mesh(sphereGeometry, material);

    const light = new THREE.PointLight(hexColor, 1, distance);
    light.power = power;
    light.add(mesh);

    scene.add(light);

    return light;
  };

  light1 = addLight(0x0040ff);
  light2 = addLight(0xffffff);
  light3 = addLight(0x80ff80);
  light4 = addLight(0xffaa00);

  // light nodes ( selective lights )

  const blueLightsNode = lights([light1]);
  const whiteLightsNode = lights([light2]);

  // models

  const geometryTeapot = new TeapotGeometry(0.8, 18);

  const leftObject = new THREE.Mesh(geometryTeapot, new MeshPhongNodeMaterial({ color: 0x555555 }));
  leftObject.material.lightsNode = blueLightsNode;
  leftObject.material.specularNode = texture(alphaTexture);
  leftObject.position.x = -3;
  scene.add(leftObject);

  const centerObject = new THREE.Mesh(geometryTeapot, new MeshPhongNodeMaterial({ color: 0x555555 }));
  centerObject.material.normalNode = normalMap(texture(normalMapTexture));
  centerObject.material.shininess = 80;
  scene.add(centerObject);

  const rightObject = new THREE.Mesh(geometryTeapot, new MeshPhongNodeMaterial({ color: 0x555555 }));
  rightObject.material.lightsNode = whiteLightsNode;
  //rightObject.material.specular.setHex( 0xFF00FF );
  rightObject.material.specularNode = mix(color(0x0000ff), color(0xff0000), checker(uv().mul(5)));
  rightObject.material.shininess = 90;
  rightObject.position.x = 3;
  scene.add(rightObject);

  leftObject.rotation.y = centerObject.rotation.y = rightObject.rotation.y = Math.PI * -0.5;
  leftObject.position.y = centerObject.position.y = rightObject.position.y = -1;

  // renderer

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  // controls

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 3;
  controls.maxDistance = 25;

  // stats

  stats = new Stats();
  document.body.appendChild(stats.dom);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  const time = performance.now() / 1000;
  const lightTime = time * 0.5;

  light1.position.x = Math.sin(lightTime * 0.7) * 3;
  light1.position.y = Math.cos(lightTime * 0.5) * 4;
  light1.position.z = Math.cos(lightTime * 0.3) * 3;

  light2.position.x = Math.cos(lightTime * 0.3) * 3;
  light2.position.y = Math.sin(lightTime * 0.5) * 4;
  light2.position.z = Math.sin(lightTime * 0.7) * 3;

  light3.position.x = Math.sin(lightTime * 0.7) * 3;
  light3.position.y = Math.cos(lightTime * 0.3) * 4;
  light3.position.z = Math.sin(lightTime * 0.5) * 3;

  light4.position.x = Math.sin(lightTime * 0.3) * 3;
  light4.position.y = Math.cos(lightTime * 0.7) * 4;
  light4.position.z = Math.sin(lightTime * 0.5) * 3;

  renderer.render(scene, camera);

  stats.update();
}
