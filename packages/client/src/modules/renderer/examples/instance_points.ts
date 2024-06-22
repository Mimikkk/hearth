import * as Engine from '@modules/renderer/engine/engine.js';

import { Renderer } from '@modules/renderer/engine/renderers/webgpu/Renderer.js';

import Stats from 'stats-js';

import { GUI } from 'lil-gui';
import { OrbitControls } from '@modules/renderer/engine/controls/OrbitControls.js';

import { InstancedPoints } from '@modules/renderer/engine/objects/InstancedPoints.js';
import { InstancedPointsGeometry } from '@modules/renderer/engine/geometries/InstancedPointsGeometry.js';

import { color, InstancedPointsNodeMaterial } from '@modules/renderer/engine/nodes/Nodes.js';

import * as GeometryUtils from '@modules/renderer/engine/utils/GeometryUtils.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let renderer, scene, camera, camera2, controls, backgroundNode;
let material;
let stats;
let gui;

// viewport
let insetWidth;
let insetHeight;

init();

function init() {
  renderer = new Renderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  scene = new Engine.Scene();

  camera = new Engine.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(-40, 0, 60);

  camera2 = new Engine.PerspectiveCamera(40, 1, 1, 1000);
  camera2.position.copy(camera.position);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 10;
  controls.maxDistance = 500;

  backgroundNode = color(0x222222);

  const positions = [];
  const colors = [];

  const points = GeometryUtils.hilbert3D(new Engine.Vector3(0, 0, 0), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7);

  const spline = new Engine.CatmullRomCurve3(points);
  const divisions = Math.round(4 * points.length);
  const point = new Engine.Vector3();
  const pointColor = new Engine.Color();

  for (let i = 0, l = divisions; i < l; i++) {
    const t = i / l;

    spline.getPoint(t, point);
    positions.push(point.x, point.y, point.z);

    pointColor.setHSL(t, 1.0, 0.5, Engine.ColorSpace.SRGB);
    colors.push(pointColor.r, pointColor.g, pointColor.b);
  }

  // Instanced Points

  const geometry = new InstancedPointsGeometry();
  geometry.setPositions(positions);
  geometry.setColors(colors);

  geometry.instanceCount = positions.length / 3; // this should not be necessary

  material = new InstancedPointsNodeMaterial({
    color: 0xffffff,
    pointWidth: 10, // in pixel units

    vertexColors: true,
    alphaToCoverage: true,
  });

  const instancedPoints = new InstancedPoints(geometry, material);
  instancedPoints.scale.set(1, 1, 1);
  scene.add(instancedPoints);

  //

  useWindowResizer(renderer, camera, () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    insetWidth = window.innerHeight / 4;
    insetHeight = window.innerHeight / 4;

    camera2.aspect = insetWidth / insetHeight;
    camera2.updateProjectionMatrix();
  });

  stats = new Stats();
  document.body.appendChild(stats.dom);

  initGui();
}

function animate() {
  stats.update();

  // main scene

  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);

  controls.update();

  renderer.autoClear = true;

  scene.backgroundNode = null;

  renderer.render(scene, camera);

  // inset scene

  renderer.clearDepth(); // important!

  renderer.setScissorTest(true);

  renderer.setScissor(20, 20, insetWidth, insetHeight);

  renderer.setViewport(20, 20, insetWidth, insetHeight);

  camera2.position.copy(camera.position);

  camera2.quaternion.copy(camera.quaternion);

  renderer.autoClear = false;

  scene.backgroundNode = backgroundNode;

  renderer.render(scene, camera2);

  renderer.setScissorTest(false);
}

//

function initGui() {
  gui = new GUI();

  const param = {
    width: 10,
    alphaToCoverage: true,
  };

  gui.add(param, 'width', 1, 20, 1).onChange(function (val) {
    material.pointWidth = val;
  });

  gui.add(param, 'alphaToCoverage').onChange(function (val) {
    material.alphaToCoverage = val;
  });
}
