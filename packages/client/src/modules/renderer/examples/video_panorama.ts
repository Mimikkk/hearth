import * as Engine from '@modules/renderer/engine/engine.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';
import { ColorSpace } from '@modules/renderer/engine/engine.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let camera, scene, hearth;

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

async function init() {
  const container = document.getElementById('container');

  camera = new Engine.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.25, 10);

  scene = new Engine.Scene();

  const geometry = new Engine.SphereGeometry(5, 60, 40);

  geometry.scale(-1, 1, 1);

  const video = document.getElementById('video');
  video.play();

  const texture = new Engine.VideoTexture(video);
  texture.colorSpace = Engine.ColorSpace.SRGB;
  const material = new Engine.MeshBasicMaterial({ map: texture });

  const mesh = new Engine.Mesh(geometry, material);
  scene.add(mesh);

  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  container.appendChild(hearth.parameters.canvas);

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);

  useWindowResizer(hearth, camera);
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
  phi = Engine.MathUtils.degreeToRadian(90 - lat);
  theta = Engine.MathUtils.degreeToRadian(lon);

  camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
  camera.position.y = distance * Math.cos(phi);
  camera.position.z = distance * Math.sin(phi) * Math.sin(theta);

  camera.lookAt(0, 0, 0);

  hearth.render(scene, camera);
}
