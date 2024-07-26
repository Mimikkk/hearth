import * as Engine from '@modules/renderer/engine/engine.js';

import { Renderer } from '@modules/renderer/engine/renderers/Renderer.js';

import { GUI } from 'lil-gui';
import { OrbitControls } from '@modules/renderer/engine/objects/controls/OrbitControls.js';
import {
  color,
  Line2NodeMaterial,
  LineBasicNodeMaterial,
  LineDashedNodeMaterial,
} from '@modules/renderer/engine/nodes/Nodes.js';
import { Line2 } from '@modules/renderer/engine/objects/lines/Line2.js';
import { LineGeometry } from '@modules/renderer/engine/objects/lines/LineGeometry.js';
import * as GeometryUtils from '@modules/renderer/engine/utils/GeometryUtils.js';
import { useWindowResizer } from '@modules/renderer/examples/utilities/useWindowResizer.js';
import { BufferAttribute, Color } from '@modules/renderer/engine/engine.js';

let line, renderer, scene, camera, camera2, controls, backgroundNode;
let line1;
let matLine, matLineBasic, matLineDashed;
let gui;

// viewport
let insetWidth;
let insetHeight;

init();

async function init() {
  const points = GeometryUtils.generateHilbert(new Engine.Vec3(0, 0, 0), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7);

  renderer = await Renderer.create();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer._clearColor = Color.new(0x000000);
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

  const spline = new Engine.CatmullRomCurve3(points);
  const divisions = Math.round(12 * points.length);
  const point = new Engine.Vec3();
  const lineColor = new Engine.Color();

  for (let i = 0, l = divisions; i < l; i++) {
    const t = i / l;

    spline.getPoint(t, point);
    positions.push(point.x, point.y, point.z);

    lineColor.setHSL(t, 1.0, 0.5, Engine.from.SRGB);
    colors.push(lineColor.r, lineColor.g, lineColor.b);
  }

  // Line2 ( LineGeometry, LineMaterial )

  const geometry = new LineGeometry();
  geometry.setPositions(positions);
  geometry.setColors(colors);
  geometry.instanceCount = positions.length / 3 - 1;

  matLine = new Line2NodeMaterial({
    color: 0xffffff,
    linewidth: 5, // in world units with size attenuation, pixels otherwise
    vertexColors: true,
    dashed: false,
    alphaToCoverage: true,
  });

  line = new Line2(geometry, matLine);
  line.computeLineDistances();
  line.scale.set(1, 1, 1);
  scene.add(line);

  const geo = new Engine.Geometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));

  matLineBasic = new LineBasicNodeMaterial({ vertexColors: true });
  matLineDashed = new LineDashedNodeMaterial({ vertexColors: true, scale: 2, dashSize: 1, gapSize: 1 });

  line1 = new Engine.Line(geo, matLineBasic);
  line1.computeLineDistances();
  line1.visible = false;
  scene.add(line1);

  //

  useWindowResizer(renderer, camera, () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    insetWidth = window.innerHeight / 4; // square
    insetHeight = window.innerHeight / 4;

    camera2.aspect = insetWidth / insetHeight;
    camera2.updateProjectionMatrix();
  });

  initGui();
}

function animate() {
  // main scene

  renderer._clearColor = Color.new(0x000000);

  renderer.viewport.set(0, 0, window.innerWidth, window.innerHeight);

  controls.update();

  renderer.parameters.autoClear = true;

  scene.backgroundNode = null;
  renderer.render(scene, camera);

  // inset scene

  renderer.clear(false, true, false); // important!

  renderer.useScissor = true;

  renderer.scissor.set(20, 20, insetWidth, insetHeight);
  renderer.viewport.set(20, 20, window.innerWidth, window.innerHeight);

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
    'line type': 0,
    'world units': false,
    width: 5,
    alphaToCoverage: true,
    dashed: false,
    'dash offset': 0,
    'dash scale': 1,
    'dash / gap': 1,
  };

  gui.add(param, 'line type', { LineGeometry: 0, '"line-strip"': 1 }).onChange(function (val) {
    switch (val) {
      case 0:
        line.visible = true;

        line1.visible = false;

        break;

      case 1:
        line.visible = false;

        line1.visible = true;

        break;
    }
  });

  gui.add(param, 'world units').onChange(function (val) {
    matLine.worldUnits = val;
    matLine.needsUpdate = true;
  });

  gui.add(param, 'width', 1, 10).onChange(function (val) {
    matLine.linewidth = val;
  });

  gui.add(param, 'alphaToCoverage').onChange(function (val) {
    matLine.alphaToCoverage = val;
  });

  gui.add(param, 'dashed').onChange(function (val) {
    matLine.dashed = val;
    line1.material = val ? matLineDashed : matLineBasic;
  });

  gui.add(param, 'dash scale', 0.5, 2, 0.1).onChange(function (val) {
    matLine.scale = val;
    matLineDashed.scale = val;
  });

  gui.add(param, 'dash offset', 0, 5, 0.1).onChange(function (val) {
    matLine.dashOffset = val;
    matLineDashed.dashOffset = val;
  });

  gui.add(param, 'dash / gap', { '2 : 1': 0, '1 : 1': 1, '1 : 2': 2 }).onChange(function (val) {
    switch (val) {
      case 0:
        matLine.dashSize = 2;
        matLine.gapSize = 1;

        matLineDashed.dashSize = 2;
        matLineDashed.gapSize = 1;

        break;

      case 1:
        matLine.dashSize = 1;
        matLine.gapSize = 1;

        matLineDashed.dashSize = 1;
        matLineDashed.gapSize = 1;

        break;

      case 2:
        matLine.dashSize = 1;
        matLine.gapSize = 2;

        matLineDashed.dashSize = 1;
        matLineDashed.gapSize = 2;

        break;
    }
  });
}
