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

async function init() {
  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.animation.loop = animate;
  document.body.appendChild(renderer.parameters.canvas);

  scene = new Engine.Scene();

  camera = new Engine.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(-40, 0, 60);

  camera2 = new Engine.PerspectiveCamera(40, 1, 1, 1000);
  camera2.position.from(camera.position);

  controls = new OrbitControls(camera, renderer.parameters.canvas);
  controls.enableDamping = true;
  controls.minDistance = 10;
  controls.maxDistance = 500;

  backgroundNode = color(0x222222);

  const positions = [];
  const colors = [];

  const points = GeometryUtils.generateHilbert(new Engine.Vec3(0, 0, 0), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7);

  const spline = new Engine.CatmullRomCurve3(points);
  const divisions = Math.round(4 * points.length);
  const point = new Engine.Vec3();
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
  renderer.viewport.set(0, 0, window.innerWidth, window.innerHeight);

  controls.update();

  renderer.parameters.autoClear = true;

  scene.backgroundNode = null;

  renderer.render(scene, camera);

  // inset scene

  renderer.clear(false, true, false);

  renderer.useScissor = true;

  renderer.scissor.set(20, 20, insetWidth, insetHeight);
  renderer.viewport.set(20, 20, insetWidth, insetHeight);

  camera2.position.from(camera.position);

  camera2.quaternion.from(camera.quaternion);

  renderer.parameters.autoClear = false;

  scene.backgroundNode = backgroundNode;

  renderer.render(scene, camera2);

  renderer.useScissor = false;
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
