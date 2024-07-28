import * as Engine from '@modules/renderer/engine/engine.js';

import { Hearth } from '@modules/renderer/engine/hearth/Hearth.js';

import Stats from 'stats-gl';

import { GUI } from 'lil-gui';
import { OrbitControls } from '@modules/renderer/engine/entities/controls/OrbitControls.js';

import { InstancedPoints } from '@modules/renderer/engine/entities/InstancedPoints.js';
import { InstancedPointsGeometry } from '@modules/renderer/engine/entities/geometries/InstancedPointsGeometry.js';

import { color, InstancedPointsNodeMaterial } from '@modules/renderer/engine/nodes/Nodes.js';

import * as GeometryUtils from '@modules/renderer/engine/utils/GeometryUtils.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';

let hearth, scene, camera, camera2, controls, backgroundNode;
let material;
let gui;

let insetWidth;
let insetHeight;

init();

async function init() {
  hearth = await Hearth.as();
  hearth.setPixelRatio(window.devicePixelRatio);
  hearth.setSize(window.innerWidth, window.innerHeight);
  hearth.animation.loop = animate;
  document.body.appendChild(hearth.parameters.canvas);

  scene = new Engine.Scene();

  camera = new Engine.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(-40, 0, 60);

  camera2 = new Engine.PerspectiveCamera(40, 1, 1, 1000);
  camera2.position.from(camera.position);

  controls = new OrbitControls(camera, hearth.parameters.canvas);
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

  const geometry = new InstancedPointsGeometry();
  geometry.setPositions(positions);
  geometry.setColors(colors);

  material = new InstancedPointsNodeMaterial({
    color: 0xffffff,
    pointWidth: 10,

    vertexColors: true,
    alphaToCoverage: true,
  });

  const instancedPoints = new InstancedPoints(geometry, material);
  instancedPoints.scale.set(1, 1, 1);
  scene.add(instancedPoints);

  useWindowResizer(hearth, camera, () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    hearth.setSize(window.innerWidth, window.innerHeight);

    insetWidth = window.innerHeight / 4;
    insetHeight = window.innerHeight / 4;

    camera2.aspect = insetWidth / insetHeight;
    camera2.updateProjectionMatrix();
  });

  initGui();
}

function animate() {
  hearth.viewport.set(0, 0, window.innerWidth, window.innerHeight);

  controls.update();

  hearth.parameters.autoClear = true;

  scene.backgroundNode = null;

  hearth.render(scene, camera);

  hearth.clear(false, true, false);

  hearth.useScissor = true;

  hearth.scissor.set(20, 20, insetWidth, insetHeight);
  hearth.viewport.set(20, 20, insetWidth, insetHeight);

  camera2.position.from(camera.position);

  camera2.quaternion.from(camera.quaternion);

  hearth.parameters.autoClear = false;

  scene.backgroundNode = backgroundNode;

  hearth.render(scene, camera2);

  hearth.useScissor = false;
}

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
