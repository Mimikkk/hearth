import * as THREE from '@modules/renderer/engine/engine.js';

import { WebGPURenderer } from '@modules/renderer/engine/renderers/webgpu/WebGPURenderer.js';
import { ColorSpace } from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, renderer;

let isUserInteracting = false,
  lon = 0,
  lat = 0,
  phi = 0,
  theta = 0,
  onPointerDownPointerX = 0,
  onPointerDownPointerY = 0,
  onPointerDownLon = 0,
  onPointerDownLat = 0;

const distance = 0.5;

init();

function init() {
  const container = document.getElementById('container');

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.25, 10);

  scene = new THREE.Scene();

  const geometry = new THREE.SphereGeometry(5, 60, 40);
  // invert the geometry on the x-axis so that all of the faces point inward
  geometry.scale(-1, 1, 1);

  const video = document.getElementById('video');
  video.play();

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.ColorSpace.SRGB;
  const material = new THREE.MeshBasicMaterial({ map: texture });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  container.appendChild(renderer.domElement);

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);

  //

  useWindowResizer(renderer, camera);
}

function onPointerDown(event) {
  isUserInteracting = true;

  onPointerDownPointerX = event.clientX;
  onPointerDownPointerY = event.clientY;

  onPointerDownLon = lon;
  onPointerDownLat = lat;
}

function onPointerMove(event) {
  if (isUserInteracting === true) {
    lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
    lat = (onPointerDownPointerY - event.clientY) * 0.1 + onPointerDownLat;
  }
}

function onPointerUp() {
  isUserInteracting = false;
}

function animate() {
  update();
}

function update() {
  lat = Math.max(-85, Math.min(85, lat));
  phi = THREE.MathUtils.degreeToRadian(90 - lat);
  theta = THREE.MathUtils.degreeToRadian(lon);

  camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
  camera.position.y = distance * Math.cos(phi);
  camera.position.z = distance * Math.sin(phi) * Math.sin(theta);

  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}
